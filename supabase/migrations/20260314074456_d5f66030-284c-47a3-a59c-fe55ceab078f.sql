set search_path = throulyscout, public, extensions;


-- Fix remaining WITH CHECK (true) policies

-- Leads: keep allowing public inserts but require email to be non-empty
DROP POLICY IF EXISTS "Anyone can create leads" ON throulyscout.leads;
CREATE POLICY "Anyone can create leads"
  ON throulyscout.leads
  FOR INSERT
  TO public
  WITH CHECK (email IS NOT NULL AND email != '');
