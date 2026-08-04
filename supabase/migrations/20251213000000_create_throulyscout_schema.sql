-- Throuly Scout lives in its own Postgres schema ("throulyscout"), not in
-- "public". In production the Supabase project is shared with the main Throuly
-- app (schema "throuly"), so each app is namespaced by schema. All migrations
-- after this one create objects in the throulyscout schema.
--
-- NOTE: the schema must also be exposed to PostgREST ("Exposed schemas" in
-- Project Settings -> Data API, or db_schema via the Management API) for the
-- frontend client, which is configured with { db: { schema: 'throulyscout' } }.

CREATE SCHEMA IF NOT EXISTS throulyscout;

GRANT USAGE ON SCHEMA throulyscout TO anon, authenticated, service_role;

-- Mirror production's default privileges for objects created in this schema:
--   tables/sequences: full access for the API roles (RLS still applies)
--   functions: executable by authenticated + service_role only (not anon/PUBLIC)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA throulyscout
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA throulyscout
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA throulyscout
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA throulyscout
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;
