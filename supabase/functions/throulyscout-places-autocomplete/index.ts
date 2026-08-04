// Google Places Autocomplete proxy (keeps API key server-side)
import { createUserClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!GOOGLE_KEY) {
    return new Response(JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth guard: keep paid Google Places API behind authenticated users only.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const sb = createUserClient();
  const { data: userData, error: userErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "search") {
      const input = String(body?.input || "").trim();
      const sessionToken = String(body?.sessionToken || "");
      if (input.length < 3) {
        return new Response(JSON.stringify({ predictions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_KEY,
        },
        body: JSON.stringify({
          input,
          includedPrimaryTypes: ["street_address", "premise", "subpremise", "route", "postal_code"],
          includedRegionCodes: ["us"],
          sessionToken: sessionToken || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        return new Response(JSON.stringify({ error: data?.error?.message || "Autocomplete failed" }), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const predictions = (data?.suggestions || [])
        .filter((s: any) => s?.placePrediction)
        .map((s: any) => ({
          placeId: s.placePrediction.placeId,
          text: s.placePrediction.text?.text || "",
          mainText: s.placePrediction.structuredFormat?.mainText?.text || "",
          secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || "",
        }));
      return new Response(JSON.stringify({ predictions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details") {
      const placeId = String(body?.placeId || "");
      const sessionToken = String(body?.sessionToken || "");
      if (!placeId) {
        return new Response(JSON.stringify({ error: "placeId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
      if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
      const r = await fetch(url.toString(), {
        headers: {
          "X-Goog-Api-Key": GOOGLE_KEY,
          "X-Goog-FieldMask": "id,formattedAddress,addressComponents,location,displayName",
        },
      });
      const data = await r.json();
      if (!r.ok) {
        return new Response(JSON.stringify({ error: data?.error?.message || "Details failed" }), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const comps = (data?.addressComponents || []) as Array<{ longText: string; shortText: string; types: string[] }>;
      const get = (t: string, short = false) => {
        const c = comps.find((x) => x.types?.includes(t));
        return c ? (short ? c.shortText : c.longText) : "";
      };
      const streetNumber = get("street_number");
      const route = get("route");
      const result = {
        placeId: data?.id,
        formattedAddress: data?.formattedAddress || "",
        street: [streetNumber, route].filter(Boolean).join(" "),
        city: get("locality") || get("postal_town") || get("sublocality") || get("administrative_area_level_2"),
        state: get("administrative_area_level_1", true),
        stateLong: get("administrative_area_level_1"),
        zip: get("postal_code"),
        country: get("country", true),
        lat: data?.location?.latitude ?? null,
        lng: data?.location?.longitude ?? null,
      };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
