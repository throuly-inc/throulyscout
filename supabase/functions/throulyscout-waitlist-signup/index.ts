// Server-side waitlist signup.
// - Verifies Cloudflare Turnstile token (if TURNSTILE_SECRET_KEY is set)
// - Per-IP and per-email rate limits via an in-memory bucket (best-effort)
// - Normalizes email and silently collapses duplicates
// - Always returns a generic success response
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_TIERS = new Set(["free", "premium", "professional", "team"]);
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX_PER_IP = 5;
const buckets = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX_PER_IP) {
    buckets.set(key, arr);
    return true;
  }
  arr.push(now);
  buckets.set(key, arr);
  return false;
}

async function verifyTurnstile(token: string | null, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    // Turnstile not yet configured. Allow but log so the user remembers to add it.
    console.warn("waitlist-signup: TURNSTILE_SECRET_KEY not set; skipping captcha verification");
    return true;
  }
  if (!token) return false;
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const j = await r.json();
    return j?.success === true;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;

    const body = await req.json().catch(() => ({}));
    const rawEmail = String(body.email ?? "").trim();
    const list = String(body.list ?? "waitlist"); // 'waitlist' or 'pricing_waitlist'
    const source = body.source ? String(body.source).slice(0, 64) : null;
    const desiredTier = body.desired_tier ? String(body.desired_tier) : null;
    const turnstileToken = body.turnstile_token ? String(body.turnstile_token) : null;

    // Always return the same generic response, regardless of failure mode below.
    const generic = () =>
      new Response(JSON.stringify({ ok: true, message: "Thanks — you're on the list." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 254) return generic();
    if (list !== "waitlist" && list !== "pricing_waitlist") return generic();
    if (list === "pricing_waitlist" && (!desiredTier || !ALLOWED_TIERS.has(desiredTier))) {
      return generic();
    }
    if (ip && rateLimited(ip)) return generic();
    if (rateLimited("email:" + rawEmail.toLowerCase())) return generic();

    const ok = await verifyTurnstile(turnstileToken, ip);
    if (!ok) return generic();

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "throulyscout" } }
    );

    if (list === "waitlist") {
      // ON CONFLICT silently collapses duplicates via unique normalized_email index
      await svc
        .from("waitlist")
        .upsert({ email: rawEmail, source } as never, { onConflict: "normalized_email", ignoreDuplicates: true });
    } else {
      await svc
        .from("pricing_waitlist")
        .upsert(
          { email: rawEmail, desired_tier: desiredTier! } as never,
          { onConflict: "normalized_email,desired_tier", ignoreDuplicates: true }
        );
    }

    return generic();
  } catch (e) {
    console.error("waitlist-signup error:", e);
    // Still generic on error
    return new Response(JSON.stringify({ ok: true, message: "Thanks — you're on the list." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
