set search_path = throulyscout, public, extensions;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Clients can read agent profiles via deals" ON throulyscout.profiles;

-- Create a security definer function to get agent IDs for a client
CREATE OR REPLACE FUNCTION throulyscout.get_client_agent_ids(_client_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'throulyscout'
AS $$
  SELECT DISTINCT agent_id FROM throulyscout.deals
  WHERE client_id = _client_id
$$;

-- Re-create the policy using the function
CREATE POLICY "Clients can read agent profiles via deals"
ON throulyscout.profiles
FOR SELECT
TO authenticated
USING (
  id IN (SELECT get_client_agent_ids(auth.uid()))
);