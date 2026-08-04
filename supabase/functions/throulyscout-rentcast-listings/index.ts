// SimplyRETS-backed listings (uses public demo credentials simplyrets:simplyrets)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIMPLYRETS_AUTH = "Basic " + btoa("simplyrets:simplyrets");

const STATE_CODES: Record<string, string> = {
  texas: "TX",
  tx: "TX",
};

const toStateCode = (state?: string) => state ? STATE_CODES[state.trim().toLowerCase()] : undefined;

const buildListingsUrl = (options: {
  minPrice?: number;
  maxPrice?: number;
  state?: string;
  city?: string;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (options.minPrice) params.set("minprice", String(options.minPrice));
  if (options.maxPrice) params.set("maxprice", String(options.maxPrice));
  params.set("status", "Active");
  params.set("limit", String(options.limit ?? 50));
  const stateCode = toStateCode(options.state);
  if (stateCode) params.set("states", stateCode);
  if (options.city) params.append("cities", options.city);

  return `https://api.simplyrets.com/properties?${params.toString()}`;
};

const fetchListings = async (url: string) => {
  const response = await fetch(url, {
    headers: { Authorization: SIMPLYRETS_AUTH, accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("SimplyRETS error:", response.status, text);
    throw new Error(`SimplyRETS ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authentication to prevent open quota abuse.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { db: { schema: "throulyscout" } },
    );
    const { data: u, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !u.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    const homePrice = Number(body?.homePrice);
    const state = typeof body?.state === "string" ? body.state.slice(0, 30) : undefined;
    const city = typeof body?.city === "string" ? body.city.replace(/[^A-Za-z0-9 .\-']/g, "").slice(0, 60) : undefined;
    const rangePct = Number.isFinite(body?.rangePct) ? Math.min(1, Math.max(0, Number(body.rangePct))) : 0.2;
    const limit = Number.isFinite(body?.limit) ? Math.min(50, Math.max(1, Math.floor(Number(body.limit)))) : 6;

    if (!homePrice || homePrice <= 0 || homePrice > 100_000_000) {
      return new Response(JSON.stringify({ error: "Valid homePrice is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const minPrice = Math.round(homePrice * (1 - rangePct));
    const maxPrice = Math.round(homePrice * (1 + rangePct));

    const exactUrl = buildListingsUrl({ minPrice, maxPrice, state, city, limit: 50 });
    let list = await fetchListings(exactUrl);
    let scope = list.length > 0
      ? (city ? "city-exact" : "state-exact")
      : "none";

    if (list.length === 0) {
      const fallbackUrl = buildListingsUrl({ state, city, limit: 50 });
      list = await fetchListings(fallbackUrl);
      scope = list.length > 0 ? (city ? "city-closest" : "state-closest") : "none";
    }

    const ranked = list
      .filter((l: any) => typeof l.listPrice === "number")
      .map((l: any) => ({ l, diff: Math.abs((l.listPrice as number) - homePrice) }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, limit)
      .map(({ l }) => {
        const a = l.address || {};
        const addressLine = [a.streetNumber, a.streetName].filter(Boolean).join(" ");
        const formatted = a.full || [addressLine, a.city, a.state, a.postalCode].filter(Boolean).join(", ");
        return {
          id: String(l.mlsId ?? l.listingId ?? formatted),
          address: formatted,
          city: a.city,
          state: a.state,
          zipCode: a.postalCode,
          price: l.listPrice,
          bedrooms: l.property?.bedrooms,
          bathrooms: l.property?.bathsFull != null
            ? (l.property.bathsFull + (l.property.bathsHalf || 0) * 0.5)
            : undefined,
          squareFootage: l.property?.area,
          propertyType: l.property?.type,
          yearBuilt: l.property?.yearBuilt,
          listedDate: l.listDate,
          daysOnMarket: l.mls?.daysOnMarket,
          photos: Array.isArray(l.photos) ? l.photos.filter((p: any) => typeof p === "string") : [],
        };
      });

    return new Response(
      JSON.stringify({ listings: ranked, scope, minPrice, maxPrice }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("simplyrets-listings error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message, listings: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
