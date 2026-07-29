
-- Fix remaining WITH CHECK (true) policies

-- Leads: keep allowing public inserts but require email to be non-empty
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
CREATE POLICY "Anyone can create leads"
  ON public.leads
  FOR INSERT
  TO public
  WITH CHECK (email IS NOT NULL AND email != '');
