import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-ASSISTANCE-PROGRAMS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require auth to prevent unauthenticated AI-spend abuse.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Function started");


    const payload = await req.json();
    const rawState = typeof payload?.state === "string" ? payload.state.trim().toUpperCase() : "";
    const rawCity = typeof payload?.city === "string" ? payload.city : "";
    const isFirstTimeBuyer = !!payload?.isFirstTimeBuyer;
    const income = Number.isFinite(payload?.income) ? Math.max(0, Math.min(10_000_000, Number(payload.income))) : null;
    const propertyPrice = Number.isFinite(payload?.propertyPrice) ? Math.max(0, Math.min(100_000_000, Number(payload.propertyPrice))) : null;

    // 50 states + DC allowlist (accept 2-letter code OR full name)
    const US_STATES = new Set([
      "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
      "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
      "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
    ]);
    const NAME_TO_CODE: Record<string, string> = {
      ALABAMA:"AL",ALASKA:"AK",ARIZONA:"AZ",ARKANSAS:"AR",CALIFORNIA:"CA",COLORADO:"CO",CONNECTICUT:"CT",
      DELAWARE:"DE",FLORIDA:"FL",GEORGIA:"GA",HAWAII:"HI",IDAHO:"ID",ILLINOIS:"IL",INDIANA:"IN",IOWA:"IA",
      KANSAS:"KS",KENTUCKY:"KY",LOUISIANA:"LA",MAINE:"ME",MARYLAND:"MD",MASSACHUSETTS:"MA",MICHIGAN:"MI",
      MINNESOTA:"MN",MISSISSIPPI:"MS",MISSOURI:"MO",MONTANA:"MT",NEBRASKA:"NE",NEVADA:"NV",
      "NEW HAMPSHIRE":"NH","NEW JERSEY":"NJ","NEW MEXICO":"NM","NEW YORK":"NY","NORTH CAROLINA":"NC",
      "NORTH DAKOTA":"ND",OHIO:"OH",OKLAHOMA:"OK",OREGON:"OR",PENNSYLVANIA:"PA","RHODE ISLAND":"RI",
      "SOUTH CAROLINA":"SC","SOUTH DAKOTA":"SD",TENNESSEE:"TN",TEXAS:"TX",UTAH:"UT",VERMONT:"VT",
      VIRGINIA:"VA",WASHINGTON:"WA","WEST VIRGINIA":"WV",WISCONSIN:"WI",WYOMING:"WY",
      "DISTRICT OF COLUMBIA":"DC","WASHINGTON DC":"DC","WASHINGTON D.C.":"DC",
    };
    const stateCode = US_STATES.has(rawState) ? rawState : NAME_TO_CODE[rawState];
    if (!stateCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid state. Use 2-letter US code or full name." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // City: strip control chars, cap length, conservative allowlist
    const city = rawCity.replace(/[^A-Za-z0-9 .\-']/g, "").slice(0, 60);
    const state = stateCode;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    const prompt = `You are a real estate assistance program expert. Based on the following buyer profile, provide relevant homebuyer assistance programs.

Buyer Profile:
- State: ${state}
- City: ${city || 'Not specified'}
- First-time homebuyer: ${isFirstTimeBuyer ? 'Yes' : 'No/Unknown'}
- Annual Income: ${income ? `$${income.toLocaleString()}` : 'Not specified'}
- Target Home Price: ${propertyPrice ? `$${propertyPrice.toLocaleString()}` : 'Not specified'}

Provide a JSON response with the following structure:
{
  "programs": [
    {
      "name": "Program Name",
      "type": "grant" | "loan" | "tax_credit" | "down_payment_assistance",
      "description": "Brief description of the program",
      "eligibility": "Key eligibility requirements",
      "benefit": "What the buyer receives (e.g., up to $10,000)",
      "firstTimeOnly": true/false,
      "incomeLimit": "Income limit if applicable or null",
      "website": "Official program website URL if known, or null"
    }
  ],
  "resources": [
    {
      "name": "Resource name",
      "url": "https://...",
      "description": "Brief description"
    }
  ]
}

Include:
1. State-specific housing authority programs
2. FHA, VA, USDA loan programs if applicable
3. Down payment assistance programs
4. First-time homebuyer programs (if applicable)
5. Tax credit programs
6. Local city/county programs if the city is specified

Always include links to official resources like:
- HUD state housing authority: https://www.hud.gov/states
- State housing finance agency
- Local housing counseling agencies

Provide 3-6 relevant programs and 2-4 helpful resources.`;

    logStep("Requesting AI recommendations", { state, isFirstTimeBuyer });

    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful real estate assistance program expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI service credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      logStep("AI error", { status: aiResponse.status, error: errorText });
      throw new Error('Failed to get assistance program recommendations');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Parse the JSON from AI response
    let programs;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent];
      const jsonStr = jsonMatch[1].trim();
      programs = JSON.parse(jsonStr);
      logStep("Programs extracted", { count: programs.programs?.length });
    } catch (parseError) {
      logStep("JSON parse error", { content: aiContent.substring(0, 500) });
      // Return a fallback response with general resources
      programs = {
        programs: [],
        resources: [
          {
            name: "HUD Housing Counseling",
            url: "https://www.hud.gov/counseling",
            description: "Find HUD-approved housing counseling agencies"
          },
          {
            name: `${state} Housing Finance Agency`,
            url: `https://www.hud.gov/states`,
            description: "State housing authority programs and resources"
          },
          {
            name: "Down Payment Resource",
            url: "https://downpaymentresource.com",
            description: "Search for down payment assistance programs"
          }
        ]
      };
    }

    // Always add standard resources
    const standardResources = [
      {
        name: "HUD State Information",
        url: "https://www.hud.gov/states",
        description: "Find your state's housing authority and local HUD office"
      },
      {
        name: "Consumer Financial Protection Bureau",
        url: "https://www.consumerfinance.gov/owning-a-home/",
        description: "Tools and resources for homebuyers"
      }
    ];

    // Merge and dedupe resources
    const allResources = [...(programs.resources || [])];
    for (const sr of standardResources) {
      if (!allResources.find(r => r.url === sr.url)) {
        allResources.push(sr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        programs: programs.programs || [],
        resources: allResources,
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
