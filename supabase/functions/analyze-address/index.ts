import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
const MAX_ADDRESS_CHARS = 200;


function isSpecificAddress(text: string): boolean {
  // Match patterns like "123 Main St", "456 Oak Avenue, City, ST"
  return /\d+\s+[A-Za-z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Rd|Road|Way|Ct|Court|Pl|Place|Cir|Circle|Ter|Terrace|Pkwy|Parkway)\b/i.test(text);
}

function extractPropertyData(markdown: string): Record<string, string | number | null> {
  const data: Record<string, string | number | null> = {};

  const bedMatch = markdown.match(/(\d+)\s*(?:bd|bed|bedroom|bdr|BR)/i);
  if (bedMatch) data.bedrooms = parseInt(bedMatch[1]);

  const bathMatch = markdown.match(/(\d+(?:\.\d+)?)\s*(?:ba|bath|bathroom)/i);
  if (bathMatch) data.bathrooms = parseFloat(bathMatch[1]);

  const sqftMatch = markdown.match(/([\d,]+)\s*(?:sq\s*ft|sqft|square\s*feet)/i);
  if (sqftMatch) data.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

  const yearMatch = markdown.match(/(?:built|year\s*built|constructed)[\s:]*(\d{4})/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1800 && year <= new Date().getFullYear()) data.yearBuilt = year;
  }

  const lotMatch = markdown.match(/([\d,.]+)\s*(?:acre|acres)/i);
  if (lotMatch) data.lotAcres = parseFloat(lotMatch[1].replace(/,/g, ''));

  const typePatterns = [
    { pattern: /single\s*family|single-family|house/i, type: 'Single-family' },
    { pattern: /condo|condominium/i, type: 'Condo' },
    { pattern: /townhouse|townhome/i, type: 'Townhouse' },
    { pattern: /multi\s*family|multi-family|duplex|triplex/i, type: 'Multi-family' },
  ];
  for (const { pattern, type } of typePatterns) {
    if (pattern.test(markdown)) { data.propertyType = type; break; }
  }

  const priceMatch = markdown.match(/\$[\d,]+/g);
  if (priceMatch) {
    const prices = priceMatch.map(p => parseInt(p.replace(/[$,]/g, ''))).filter(p => p > 50000 && p < 50000000);
    if (prices.length > 0) data.price = Math.max(...prices);
  }

  return data;
}

async function searchPropertyData(address: string): Promise<{ data: Record<string, string | number | null>; source: string } | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) return null;

  try {
    console.log('Searching Firecrawl for:', address);
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${address} property details bedrooms bathrooms sqft`,
        limit: 3,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl search error:', response.status);
      return null;
    }

    const result = await response.json();
    const results = result.data || [];
    if (results.length === 0) return null;

    // Combine markdown from top results and extract data
    const combined = results.map((r: any) => r.markdown || r.description || '').join('\n');
    const data = extractPropertyData(combined);
    const source = results[0]?.url || 'web search';

    // Only return if we got meaningful data
    if (Object.keys(data).length === 0) return null;

    console.log('Extracted property data:', data, 'from:', source);
    return { data, source };
  } catch (error) {
    console.error('Firecrawl search failed:', error);
    return null;
  }
}

function buildConfirmedDataPrompt(propertyData: Record<string, string | number | null>, source: string): string {
  const lines: string[] = ['CONFIRMED PROPERTY DATA (from web search):'];
  if (propertyData.bedrooms) lines.push(`- Bedrooms: ${propertyData.bedrooms}`);
  if (propertyData.bathrooms) lines.push(`- Bathrooms: ${propertyData.bathrooms}`);
  if (propertyData.sqft) lines.push(`- Square footage: ${propertyData.sqft}`);
  if (propertyData.yearBuilt) lines.push(`- Year built: ${propertyData.yearBuilt}`);
  if (propertyData.lotAcres) lines.push(`- Lot size: ${propertyData.lotAcres} acres`);
  if (propertyData.propertyType) lines.push(`- Property type: ${propertyData.propertyType}`);
  if (propertyData.price) lines.push(`- Listed/estimated price: $${Number(propertyData.price).toLocaleString()}`);
  lines.push(`- Source: ${source}`);
  lines.push('\nUse the confirmed data above as ground truth. Do NOT estimate values that are already confirmed. Mark confirmed values with "(confirmed)" and estimated values with "~" prefix and "(estimated)".');
  return lines.join('\n');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require auth to prevent unauthenticated AI-spend abuse.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sbClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await sbClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-enforced monthly quota (free: 3, premium: 100, pro/team: unlimited)
    const { data: quota, error: quotaErr } = await sbClient.rpc("consume_usage", { _feature: "address_analysis" });
    if (quotaErr) {
      return new Response(JSON.stringify({ error: "Quota check failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (quota && (quota as any).allowed === false) {
      return new Response(JSON.stringify({
        error: `Monthly address analysis limit reached (${(quota as any).used}/${(quota as any).limit}). Upgrade for more.`,
        quota,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }



    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Invalid messages (max ${MAX_MESSAGES})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const safeMessages = messages.map((m: any) => {
      if (!m || typeof m.role !== "string" || typeof m.content !== "string") {
        throw new Error("Invalid message shape");
      }
      if (!["system", "user", "assistant"].includes(m.role)) {
        throw new Error("Invalid message role");
      }
      return { role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) };
    });

    // Check if the latest user message contains a specific address
    const lastUserMsg = [...safeMessages].reverse().find((m: any) => m.role === 'user');
    const userText = (lastUserMsg?.content || '')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .slice(0, MAX_ADDRESS_CHARS);
    let confirmedDataSection = '';

    if (isSpecificAddress(userText)) {
      const result = await searchPropertyData(userText.trim());
      if (result) {
        confirmedDataSection = '\n\n' + buildConfirmedDataPrompt(result.data, result.source);
      }
    }


    const systemPrompt = `You are an expert real estate analyst for throuly, a privacy-first AI real estate platform. When users paste an address, city, ZIP code, or state, provide a comprehensive property and market analysis.

FORMAT RULES (STRICT):
- Use ONLY bullet points. No paragraphs or long sentences.
- Each bullet: bold label, then value. Keep to one line.
- Maximum 25 bullets total across all sections.
- Use compact section headers (### not ####).
- Confirmed values: "- **Beds:** 3 (confirmed)"
- Estimated values: "- **Value:** ~$380K-$420K (estimated)"

### Property
- Estimated property value range
- Property type, bedrooms, bathrooms, sqft
- Year built, lot size

### Market
- Median home price, price trends
- Days on market, inventory level
- Population & job growth

### Costs
- Property tax rate & annual estimate
- Insurance estimate
- HOA (if applicable), closing cost %

### Investment
- Rental income range, gross yield
- Cap rate, price-to-rent ratio

### Comps
- 2-3 recent comparable sales (price, beds, sqft)

End with: *Estimates only. Consult a licensed professional.*${confirmedDataSection}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...safeMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Analyze address error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
