
-- Fix infinite recursion: profiles policies reference deals, deals policies reference profiles

-- 1. Create helper functions that bypass RLS to break the cycle

CREATE OR REPLACE FUNCTION public.get_agent_client_ids_for_rls(_agent_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT client_id FROM public.deals
  WHERE agent_id = _agent_id AND client_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_client_agent_ids_for_rls(_client_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT agent_id FROM public.deals
  WHERE client_id = _client_id
$$;

CREATE OR REPLACE FUNCTION public.get_broker_agent_ids_for_rls(_broker_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.profiles WHERE broker_id = _broker_id
$$;

-- 2. Drop the recursive policies on profiles

DROP POLICY IF EXISTS "Agents can read their clients profiles" ON public.profiles;
DROP POLICY IF EXISTS "Clients can read agent profiles via deals" ON public.profiles;
DROP POLICY IF EXISTS "Brokers can read their agents profiles" ON public.profiles;

-- 3. Recreate them using the security definer functions (no cross-table RLS evaluation)

CREATE POLICY "Agents can read their clients profiles"
ON public.profiles FOR SELECT TO authenticated
USING (id IN (SELECT get_agent_client_ids_for_rls(auth.uid())));

CREATE POLICY "Clients can read agent profiles via deals"
ON public.profiles FOR SELECT TO authenticated
USING (id IN (SELECT get_client_agent_ids_for_rls(auth.uid())));

CREATE POLICY "Brokers can read their agents profiles"
ON public.profiles FOR SELECT TO authenticated
USING (id IN (SELECT get_broker_agent_ids_for_rls(auth.uid())));

-- 4. Fix the recursive policy on deals too

DROP POLICY IF EXISTS "Brokers can read agent deals" ON public.deals;

CREATE POLICY "Brokers can read agent deals"
ON public.deals FOR SELECT TO authenticated
USING (agent_id IN (SELECT get_broker_agent_ids_for_rls(auth.uid())));
