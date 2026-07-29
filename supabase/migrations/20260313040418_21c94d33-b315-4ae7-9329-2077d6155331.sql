CREATE POLICY "Users can update own scenarios"
  ON public.saved_scenarios
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());