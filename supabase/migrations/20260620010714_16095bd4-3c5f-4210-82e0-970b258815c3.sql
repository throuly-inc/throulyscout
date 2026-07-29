-- 1) Drop the third-party API key column from offer_templates
ALTER TABLE public.offer_templates DROP COLUMN IF EXISTS resend_api_key;

-- 2) Strict authorization on realtime.messages (broadcast/presence)
-- On newer Supabase projects the postgres role cannot alter realtime.messages
-- (it is owned by the realtime admin role), and RLS is already enabled there
-- with no permissive policies — equivalent to the deny-all intent below.
-- Skip gracefully when we lack privileges instead of failing the migration.
DO $$
BEGIN
  ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Deny all realtime broadcast/presence" ON realtime.messages;
  DROP POLICY IF EXISTS "Deny all realtime select" ON realtime.messages;
  DROP POLICY IF EXISTS "Deny all realtime insert" ON realtime.messages;

  CREATE POLICY "Deny all realtime select"
    ON realtime.messages FOR SELECT
    TO authenticated, anon
    USING (false);

  CREATE POLICY "Deny all realtime insert"
    ON realtime.messages FOR INSERT
    TO authenticated, anon
    WITH CHECK (false);
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Skipping realtime.messages hardening (no privilege): %', SQLERRM;
END $$;