import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createUserClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { priceId, mode } = await req.json();
    logStep("Request body", { priceId, mode });

    // Validate priceId format and mode allowlist
    if (typeof priceId !== "string" || !/^price_[A-Za-z0-9]+$/.test(priceId) || priceId.length > 100) {
      throw new Error("Invalid priceId");
    }
    const safeMode = mode === undefined ? "payment" : mode;
    if (safeMode !== "payment" && safeMode !== "subscription") {
      throw new Error("Invalid mode");
    }


    const supabaseClient = createUserClient();

    // Require authentication — no anonymous checkout.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authErr } = await supabaseClient.auth.getUser(token);
    if (authErr || !authData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userEmail: string = authData.user.email;
    let customerId: string | undefined;
    logStep("User authenticated", { email: userEmail });


    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
    }

    // Restrict redirect origin to a hardcoded allow-list to prevent
    // attacker-supplied Origin headers from redirecting victims off-site.
    const ALLOWED_ORIGINS = new Set([
      "https://throulyscout.com",
      "https://www.throulyscout.com",
      "https://throuly.com",
      "https://www.throuly.com",
      "https://throulyscout-staging.netlify.app",
      "https://throulyscout.netlify.app",
    ]);
    const requestOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.has(requestOrigin)
      ? requestOrigin
      : "https://throulyscout.com";
    
    const sessionConfig: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: safeMode,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (userEmail) {
      sessionConfig.customer_email = userEmail;
    }

    // Add trial for subscriptions
    if (safeMode === "subscription") {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
      };
    }


    logStep("Creating checkout session", { mode: sessionConfig.mode });
    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
