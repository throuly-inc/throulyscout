-- Drop the recursive policy
DROP POLICY IF EXISTS "Clients can read agent profiles via deals" ON public.profiles;

-- Create a security definer function to get agent IDs for a client
CREATE OR REPLACE FUNCTION public.get_client_agent_ids(_client_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT agent_id FROM public.deals
  WHERE client_id = _client_id
$$;

-- Re-create the policy using the function
CREATE POLICY "Clients can read agent profiles via deals"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (SELECT get_client_agent_ids(auth.uid()))
);