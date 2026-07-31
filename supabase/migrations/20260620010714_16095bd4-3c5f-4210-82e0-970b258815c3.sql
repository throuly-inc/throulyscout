-- 1) Drop the third-party API key column from offer_templates
ALTER TABLE public.offer_templates DROP COLUMN IF EXISTS resend_api_key;

-- 2) Strict authorization on realtime.messages (broadcast/presence)
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