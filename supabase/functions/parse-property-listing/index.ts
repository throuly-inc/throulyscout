import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


interface PropertyData {
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  features: string[];
  description: string | null;
}

function detectSource(url: string): string {
  if (url.includes('zillow.com')) return 'zillow';
  if (url.includes('redfin.com')) return 'redfin';
  if (url.includes('realtor.com')) return 'realtor';
  if (url.includes('trulia.com')) return 'trulia';
  return 'other';
}

function parsePropertyFromMarkdown(markdown: string, source: string): PropertyData {
  const data: PropertyData = {
    price: null,
    bedrooms: null,
    bathrooms: null,
    sqft: null,
    lotSqft: null,
    yearBuilt: null,
    propertyType: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    features: [],
    description: null,
  };

  // Extract price - look for dollar amounts
  const priceMatch = markdown.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (priceMatch) {
    // Find the largest price (likely the listing price)
    const prices = priceMatch.map(p => parseInt(p.replace(/[$,\.]/g, '')));
    const validPrices = prices.filter(p => p > 50000 && p < 50000000);
    if (validPrices.length > 0) {
      data.price = Math.max(...validPrices);
    }
  }

  // Extract bedrooms
  const bedMatch = markdown.match(/(\d+)\s*(?:bd|bed|bedroom|bdr|BR)/i);
  if (bedMatch) {
    data.bedrooms = parseInt(bedMatch[1]);
  }

  // Extract bathrooms
  const bathMatch = markdown.match(/(\d+(?:\.\d+)?)\s*(?:ba|bath|bathroom)/i);
  if (bathMatch) {
    data.bathrooms = parseFloat(bathMatch[1]);
  }

  // Extract sqft
  const sqftMatch = markdown.match(/([\d,]+)\s*(?:sq\s*ft|sqft|square\s*feet)/i);
  if (sqftMatch) {
    data.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));
  }

  // Extract year built
  const yearMatch = markdown.match(/(?:built|year\s*built|constructed)[\s:]*(\d{4})/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1800 && year <= new Date().getFullYear()) {
      data.yearBuilt = year;
    }
  }

  // Extract property type
  const typePatterns = [
    { pattern: /single\s*family|single-family|house/i, type: 'single-family' },
    { pattern: /condo|condominium/i, type: 'condo' },
    { pattern: /townhouse|townhome|town\s*home/i, type: 'townhouse' },
    { pattern: /multi\s*family|multi-family|duplex|triplex/i, type: 'multi-family' },
    { pattern: /land|lot|vacant/i, type: 'land' },
  ];
  
  for (const { pattern, type } of typePatterns) {
    if (pattern.test(markdown)) {
      data.propertyType = type;
      break;
    }
  }

  // Extract features
  const featurePatterns = [
    { pattern: /garage|parking/i, feature: 'garage' },
    { pattern: /pool|swimming/i, feature: 'pool' },
    { pattern: /basement/i, feature: 'basement' },
    { pattern: /updated\s*kitchen|modern\s*kitchen/i, feature: 'updated_kitchen' },
    { pattern: /hardwood|wood\s*floor/i, feature: 'hardwood_floors' },
    { pattern: /fireplace/i, feature: 'fireplace' },
    { pattern: /large\s*yard|big\s*yard/i, feature: 'large_yard' },
    { pattern: /office|home\s*office/i, feature: 'home_office' },
    { pattern: /new\s*construction|newly\s*built/i, feature: 'new_construction' },
    { pattern: /solar|energy\s*efficient/i, feature: 'energy_efficient' },
  ];

  for (const { pattern, feature } of featurePatterns) {
    if (pattern.test(markdown) && !data.features.includes(feature)) {
      data.features.push(feature);
    }
  }

  // Extract address components
  const zipMatch = markdown.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    data.zipCode = zipMatch[1];
  }

  // State abbreviation
  const stateMatch = markdown.match(/,\s*([A-Z]{2})\s*\d{5}/);
  if (stateMatch) {
    data.state = stateMatch[1];
  }

  console.log('Parsed property data:', data);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth guard: prevent unauthenticated Firecrawl spend
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

    const { url } = await req.json();


    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Property parsing service not configured. Please enter details manually.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = String(url).trim().slice(0, 2048);
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
        JSON.stringify({ success: false, error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const host = parsedUrl.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.some(d => host === d || host.endsWith(`.${d}`))) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL host not supported. Use Zillow, Redfin, Realtor.com, Trulia, Homes.com, Compass, or Movoto.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const source = detectSource(formattedUrl);
    console.log('Parsing property listing from:', source, formattedUrl);

    // Use Firecrawl to scrape the property listing
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not access property listing. Please enter details manually.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = data.data?.markdown || data.markdown || '';
    
    if (!markdown) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No content found at this URL. Please enter details manually.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const propertyData = parsePropertyFromMarkdown(markdown, source);

    // Check if we got meaningful data
    const hasData = propertyData.price || propertyData.bedrooms || propertyData.sqft;

    if (!hasData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract property details from this listing. Please enter details manually.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully parsed property:', propertyData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        propertyData,
        source,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing property listing:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to parse property listing. Please enter details manually.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});