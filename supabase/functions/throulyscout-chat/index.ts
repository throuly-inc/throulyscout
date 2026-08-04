import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createUserClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require auth to prevent unauthenticated AI-spend abuse.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createUserClient(authHeader);
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-enforced monthly quota (free: 10, premium: 500, pro/team: unlimited)
    const { data: quota, error: quotaErr } = await supabase.rpc("consume_usage", { _feature: "ai_chat" });
    if (quotaErr) {
      return new Response(JSON.stringify({ error: "Quota check failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (quota && (quota as any).allowed === false) {
      return new Response(JSON.stringify({
        error: `Monthly AI chat limit reached (${(quota as any).used}/${(quota as any).limit}). Upgrade for more.`,
        quota,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }



    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Too many messages (max ${MAX_MESSAGES})` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a helpful real estate assistant for throuly, a platform that helps people buy, sell, and refinance homes across all 50 US states.

You can help users with:
- Understanding mortgage calculations and home affordability
- Explaining the home buying and selling process
- Answering questions about down payments, closing costs, and fees
- Providing guidance on refinancing options
- Explaining concepts like PMI, property taxes, and home insurance
- Offering general real estate advice

Keep your responses concise, friendly, and helpful. If users ask about specific calculations, encourage them to use the calculator tools on the platform. Don't provide specific financial advice - recommend they consult with a licensed professional for personalized guidance.`,
          },
          ...safeMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
