set search_path = throulyscout, public, extensions;

CREATE POLICY "Users can update own scenarios"
  ON throulyscout.saved_scenarios
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());