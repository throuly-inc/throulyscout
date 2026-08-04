set search_path = throulyscout, public, extensions;

-- Allow clients to read the profile of agents on their deals
CREATE POLICY "Clients can read agent profiles via deals"
ON throulyscout.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT agent_id FROM throulyscout.deals WHERE client_id = auth.uid()
  )
);