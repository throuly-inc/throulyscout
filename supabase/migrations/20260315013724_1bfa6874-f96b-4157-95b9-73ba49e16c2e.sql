set search_path = throulyscout, public, extensions;


-- Fix infinite recursion: profiles policies reference deals, deals policies reference profiles

-- 1. Create helper functions that bypass RLS to break the cycle

CREATE OR REPLACE FUNCTION throulyscout.get_agent_client_ids_for_rls(_agent_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'throulyscout'
AS $$
  SELECT DISTINCT client_id FROM throulyscout.deals
  WHERE agent_id = _agent_id AND client_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION throulyscout.get_client_agent_ids_for_rls(_client_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'throulyscout'
AS $$
  SELECT DISTINCT agent_id FROM throulyscout.deals
  WHERE client_id = _client_id
$$;

CREATE OR REPLACE FUNCTION throulyscout.get_broker_agent_ids_for_rls(_broker_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'throulyscout'
AS $$
  SELECT id FROM throulyscout.profiles WHERE broker_id = _broker_id
$$;

-- 2. Drop the recursive policies on profiles

DROP POLICY IF EXISTS "Agents can read their clients profiles" ON throulyscout.profiles;
DROP POLICY IF EXISTS "Clients can read agent profiles via deals" ON throulyscout.profiles;
DROP POLICY IF EXISTS "Brokers can read their agents profiles" ON throulyscout.profiles;

-- 3. Recreate them using the security definer functions (no cross-table RLS evaluation)

CREATE POLICY "Agents can read their clients profiles"
ON throulyscout.profiles FOR SELECT TO authenticated
USING (id IN (SELECT get_agent_client_ids_for_rls(auth.uid())));

CREATE POLICY "Clients can read agent profiles via deals"
ON throulyscout.profiles FOR SELECT TO authenticated
USING (id IN (SELECT get_client_agent_ids_for_rls(auth.uid())));

CREATE POLICY "Brokers can read their agents profiles"
ON throulyscout.profiles FOR SELECT TO authenticated
USING (id IN (SELECT get_broker_agent_ids_for_rls(auth.uid())));

-- 4. Fix the recursive policy on deals too

DROP POLICY IF EXISTS "Brokers can read agent deals" ON throulyscout.deals;

CREATE POLICY "Brokers can read agent deals"
ON throulyscout.deals FOR SELECT TO authenticated
USING (agent_id IN (SELECT get_broker_agent_ids_for_rls(auth.uid())));
