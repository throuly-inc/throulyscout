set search_path = throulyscout, public, extensions;


-- The remaining WITH CHECK (true) was likely the old anonymous_messages anon policy
-- Let's check and fix: the anon insert policy we created allows sender_user_id IS NULL
-- which is fine. Let's check if there's another one.
-- Actually looking at original data: anonymous_messages had "Anyone can send anonymous messages" WITH CHECK (true)
-- We replaced it, but let's also verify connection_requests

-- connection_requests: add read policies for participants
-- Currently has no SELECT policy restrictions visible, let's add proper ones
DROP POLICY IF EXISTS "Users can read own connection requests" ON throulyscout.connection_requests;
CREATE POLICY "Users can read sent connection requests"
  ON throulyscout.connection_requests
  FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid());
