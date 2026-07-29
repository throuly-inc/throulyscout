
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_scenarios TO authenticated;
GRANT ALL ON public.saved_scenarios TO service_role;
ALTER TABLE public.saved_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved scenarios"
  ON public.saved_scenarios FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved scenarios"
  ON public.saved_scenarios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved scenarios"
  ON public.saved_scenarios FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved scenarios"
  ON public.saved_scenarios FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
