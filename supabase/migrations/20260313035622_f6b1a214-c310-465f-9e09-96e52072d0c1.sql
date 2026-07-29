CREATE TABLE public.saved_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scenario_name text NOT NULL DEFAULT 'Homebuying Estimate',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scenarios" ON public.saved_scenarios FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read own scenarios" ON public.saved_scenarios FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own scenarios" ON public.saved_scenarios FOR DELETE TO authenticated USING (user_id = auth.uid());