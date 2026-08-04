import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// All Throuly Scout data lives in this Postgres schema: the production
// Supabase project is shared with the main Throuly app, so each app is
// namespaced by schema. Every client (this module and the frontend's
// src/integrations/supabase/client.ts) must select it explicitly, because
// PostgREST serves the "public" schema unless told otherwise.
export const APP_SCHEMA = "throulyscout";

/**
 * Client authenticated as the caller (anon key + their JWT), so RLS applies
 * as that user. Pass the request's Authorization header to forward the JWT;
 * omit it when the function only uses auth.getUser(token) explicitly.
 */
export function createUserClient(authHeader?: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      db: { schema: APP_SCHEMA },
      ...(authHeader ? { global: { headers: { Authorization: authHeader } } } : {}),
    },
  );
}

/** Service-role client (bypasses RLS) for trusted server-side work. */
export function createServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { db: { schema: APP_SCHEMA }, auth: { persistSession: false } },
  );
}

export type ServiceClient = ReturnType<typeof createServiceClient>;
export type UserClient = ReturnType<typeof createUserClient>;
