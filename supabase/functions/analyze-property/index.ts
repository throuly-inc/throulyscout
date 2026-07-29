import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-PROPERTY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { listingUrl, financialProfile } = await req.json();

    if (!listingUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Listing URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("User authenticated", { userId: userData.user.id });

    // Server-enforced monthly quota (free: 3, premium: 100, pro/team: unlimited).
    // Note: this function uses the service role client; impersonate user for the RPC.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: quota, error: quotaErr } = await userClient.rpc("consume_usage", { _feature: "property_analysis" });
    if (quotaErr) {
      return new Response(
        JSON.stringify({ success: false, error: "Quota check failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (quota && (quota as any).allowed === false) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Monthly property analysis limit reached (${(quota as any).used}/${(quota as any).limit}). Upgrade for more.`,
          quota,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }



    // Step 1: Scrape the listing using Firecrawl
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Scraping listing URL", { url: listingUrl });

    let formattedUrl = String(listingUrl).trim().slice(0, 2048);
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // SSRF guard: only allow trusted real-estate domains
    const ALLOWED_HOSTS = [
      'zillow.com', 'redfin.com', 'realtor.com', 'trulia.com',
      'homes.com', 'compass.com', 'movoto.com', 'mlslistings.com',
      'estately.com', 'coldwellbanker.com', 'remax.com', 'century21.com',
    ];
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid listing URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only http(s) URLs are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const host = parsedUrl.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.some(d => host === d || host.endsWith(`.${d}`))) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL host not allowed. Supported: Zillow, Redfin, Realtor.com, Trulia, Homes.com, Compass, Movoto.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      logStep("Firecrawl error", { status: scrapeResponse.status, error: errorText });
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape listing. Please check the URL or enter details manually.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    logStep("Scraped content length", { length: markdown.length });

    // Step 2: Use AI to extract property data
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractionPrompt = `You are a real estate data extraction assistant. Extract property details from the following listing content.

Return ONLY a valid JSON object with these fields (use null for any missing data):
{
  "address": "full street address",
  "city": "city name",
  "state": "2-letter state code (e.g., CA, TX)",
  "zip_code": "zip code",
  "price": number (listing price, no commas or $),
  "bedrooms": number,
  "bathrooms": number (can be decimal like 2.5),
  "square_feet": number,
  "property_type": "single-family" | "condo" | "townhouse" | "multi-family" | "other",
  "hoa_monthly": number or null,
  "year_built": number or null,
  "lot_size": "lot size string or null"
}

Listing content:
${markdown.substring(0, 8000)}`;

    logStep("Extracting property data with AI");

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a precise data extraction assistant. Always respond with valid JSON only.' },
          { role: 'user', content: extractionPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI extraction error", { status: aiResponse.status, error: errorText });
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to analyze listing. Please try again or enter details manually.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse the JSON from AI response
    let propertyData;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent];
      const jsonStr = jsonMatch[1].trim();
      propertyData = JSON.parse(jsonStr);
      logStep("Property data extracted", propertyData);
    } catch (parseError) {
      logStep("JSON parse error", { content: aiContent.substring(0, 500) });
      return new Response(
        JSON.stringify({ success: false, error: 'Could not parse property data. Please enter details manually.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Calculate mortgage details
    const stateDataMap: Record<string, { avgPropertyTax: number; avgHomeInsurance: number; avgClosingCost: number; avgMortgageRate: number }> = {
      'AL': { avgPropertyTax: 0.41, avgHomeInsurance: 2100, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'AK': { avgPropertyTax: 1.19, avgHomeInsurance: 1200, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'AZ': { avgPropertyTax: 0.62, avgHomeInsurance: 1800, avgClosingCost: 2.6, avgMortgageRate: 6.75 },
      'AR': { avgPropertyTax: 0.62, avgHomeInsurance: 2200, avgClosingCost: 2.4, avgMortgageRate: 6.75 },
      'CA': { avgPropertyTax: 0.76, avgHomeInsurance: 1500, avgClosingCost: 2.0, avgMortgageRate: 6.50 },
      'CO': { avgPropertyTax: 0.51, avgHomeInsurance: 2400, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'CT': { avgPropertyTax: 2.14, avgHomeInsurance: 1800, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'DE': { avgPropertyTax: 0.57, avgHomeInsurance: 900, avgClosingCost: 3.0, avgMortgageRate: 6.75 },
      'FL': { avgPropertyTax: 0.89, avgHomeInsurance: 4200, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'GA': { avgPropertyTax: 0.92, avgHomeInsurance: 1900, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'HI': { avgPropertyTax: 0.28, avgHomeInsurance: 1100, avgClosingCost: 3.0, avgMortgageRate: 6.75 },
      'ID': { avgPropertyTax: 0.69, avgHomeInsurance: 1100, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'IL': { avgPropertyTax: 2.27, avgHomeInsurance: 1400, avgClosingCost: 3.5, avgMortgageRate: 6.75 },
      'IN': { avgPropertyTax: 0.85, avgHomeInsurance: 1300, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'IA': { avgPropertyTax: 1.57, avgHomeInsurance: 1400, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'KS': { avgPropertyTax: 1.41, avgHomeInsurance: 2400, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'KY': { avgPropertyTax: 0.86, avgHomeInsurance: 1700, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'LA': { avgPropertyTax: 0.55, avgHomeInsurance: 3300, avgClosingCost: 3.0, avgMortgageRate: 6.75 },
      'ME': { avgPropertyTax: 1.36, avgHomeInsurance: 1100, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'MD': { avgPropertyTax: 1.09, avgHomeInsurance: 1400, avgClosingCost: 4.0, avgMortgageRate: 6.75 },
      'MA': { avgPropertyTax: 1.23, avgHomeInsurance: 1600, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'MI': { avgPropertyTax: 1.54, avgHomeInsurance: 1400, avgClosingCost: 3.5, avgMortgageRate: 6.75 },
      'MN': { avgPropertyTax: 1.12, avgHomeInsurance: 1800, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'MS': { avgPropertyTax: 0.81, avgHomeInsurance: 2100, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'MO': { avgPropertyTax: 0.97, avgHomeInsurance: 1700, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'MT': { avgPropertyTax: 0.84, avgHomeInsurance: 1500, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'NE': { avgPropertyTax: 1.73, avgHomeInsurance: 2400, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'NV': { avgPropertyTax: 0.60, avgHomeInsurance: 1200, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'NH': { avgPropertyTax: 2.18, avgHomeInsurance: 1100, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'NJ': { avgPropertyTax: 2.49, avgHomeInsurance: 1200, avgClosingCost: 3.0, avgMortgageRate: 6.75 },
      'NM': { avgPropertyTax: 0.80, avgHomeInsurance: 1500, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'NY': { avgPropertyTax: 1.72, avgHomeInsurance: 1600, avgClosingCost: 3.5, avgMortgageRate: 6.75 },
      'NC': { avgPropertyTax: 0.84, avgHomeInsurance: 1800, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'ND': { avgPropertyTax: 0.98, avgHomeInsurance: 1800, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'OH': { avgPropertyTax: 1.56, avgHomeInsurance: 1100, avgClosingCost: 3.0, avgMortgageRate: 6.75 },
      'OK': { avgPropertyTax: 0.90, avgHomeInsurance: 2700, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'OR': { avgPropertyTax: 0.97, avgHomeInsurance: 800, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'PA': { avgPropertyTax: 1.58, avgHomeInsurance: 1000, avgClosingCost: 4.0, avgMortgageRate: 6.75 },
      'RI': { avgPropertyTax: 1.63, avgHomeInsurance: 2100, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'SC': { avgPropertyTax: 0.57, avgHomeInsurance: 2100, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'SD': { avgPropertyTax: 1.31, avgHomeInsurance: 2100, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'TN': { avgPropertyTax: 0.71, avgHomeInsurance: 1900, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'TX': { avgPropertyTax: 1.80, avgHomeInsurance: 3500, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'UT': { avgPropertyTax: 0.63, avgHomeInsurance: 1000, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'VT': { avgPropertyTax: 1.90, avgHomeInsurance: 900, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'VA': { avgPropertyTax: 0.82, avgHomeInsurance: 1300, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'WA': { avgPropertyTax: 0.98, avgHomeInsurance: 1200, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'WV': { avgPropertyTax: 0.58, avgHomeInsurance: 1200, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'WI': { avgPropertyTax: 1.85, avgHomeInsurance: 1000, avgClosingCost: 2.8, avgMortgageRate: 6.75 },
      'WY': { avgPropertyTax: 0.61, avgHomeInsurance: 1200, avgClosingCost: 2.5, avgMortgageRate: 6.75 },
      'DC': { avgPropertyTax: 0.56, avgHomeInsurance: 1300, avgClosingCost: 3.0, avgMortgageRate: 6.75 },
    };

    const homePrice = propertyData.price || 0;
    const state = propertyData.state?.toUpperCase() || 'CA';
    const stateData = stateDataMap[state] || stateDataMap['CA'];
    const hoaMonthly = propertyData.hoa_monthly || 0;

    // Calculate for multiple down payment options
    const downPaymentOptions = [3.5, 5, 10, 20];
    const calculations: Record<string, any> = {};

    for (const dpPercent of downPaymentOptions) {
      const downPaymentAmount = homePrice * (dpPercent / 100);
      const loanAmount = homePrice - downPaymentAmount;
      
      // Monthly mortgage payment (P&I)
      const monthlyRate = stateData.avgMortgageRate / 100 / 12;
      const numPayments = 30 * 12;
      const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      // Property tax
      const monthlyPropertyTax = (homePrice * (stateData.avgPropertyTax / 100)) / 12;
      
      // Home insurance (scaled by home value)
      const monthlyInsurance = (stateData.avgHomeInsurance * (homePrice / 100000)) / 12;
      
      // PMI (if down payment < 20%)
      const monthlyPMI = dpPercent < 20 ? (loanAmount * 0.005) / 12 : 0;
      
      // Total monthly payment
      const totalMonthlyPayment = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaMonthly;
      
      // Closing costs
      const closingCosts = homePrice * (stateData.avgClosingCost / 100);
      
      // Cash to close
      const cashToClose = downPaymentAmount + closingCosts;

      calculations[`${dpPercent}%`] = {
        downPaymentPercent: dpPercent,
        downPaymentAmount: Math.round(downPaymentAmount),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyMortgage),
        monthlyPropertyTax: Math.round(monthlyPropertyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        monthlyPMI: Math.round(monthlyPMI),
        monthlyHOA: hoaMonthly,
        totalMonthlyPayment: Math.round(totalMonthlyPayment),
        closingCosts: Math.round(closingCosts),
        cashToClose: Math.round(cashToClose),
      };
    }

    // Calculate qualification based on user's financial profile if provided
    let qualification = null;
    if (financialProfile) {
      const monthlyIncome = financialProfile.yearlyIncome / 12;
      const defaultCalc = calculations['20%'];
      const monthlyDebt = (financialProfile.totalDebt || 0) / 12;
      const dtiRatio = ((defaultCalc.totalMonthlyPayment + monthlyDebt) / monthlyIncome) * 100;
      
      const reservesNeeded = defaultCalc.totalMonthlyPayment * 3;
      const totalCashRequired = defaultCalc.cashToClose + reservesNeeded;
      const qualifies = dtiRatio <= 43 && financialProfile.savings >= totalCashRequired && financialProfile.creditScore >= 620;
      
      qualification = {
        qualifies,
        dtiRatio: Math.round(dtiRatio * 10) / 10,
        requiredIncome: Math.round((defaultCalc.totalMonthlyPayment / 0.28) * 12),
        requiredSavings: Math.round(totalCashRequired),
        creditScoreOk: financialProfile.creditScore >= 620,
        dtiOk: dtiRatio <= 43,
        savingsOk: financialProfile.savings >= totalCashRequired,
      };
    }

    logStep("Calculations complete", { state, homePrice });

    return new Response(
      JSON.stringify({
        success: true,
        property: {
          address: propertyData.address,
          city: propertyData.city,
          state: propertyData.state,
          zipCode: propertyData.zip_code,
          price: propertyData.price,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          squareFeet: propertyData.square_feet,
          propertyType: propertyData.property_type,
          hoaMonthly: propertyData.hoa_monthly,
          yearBuilt: propertyData.year_built,
        },
        calculations,
        qualification,
        listingUrl: formattedUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
