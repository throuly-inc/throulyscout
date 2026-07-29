
-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Agents can read linked profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies (default) to avoid recursion
-- Self-read: simple, no joins
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Self-update: simple, no joins
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Insert own profile (for trigger)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Agents reading client profiles via deals - use security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_agent_client_ids(_agent_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT client_id FROM public.deals
  WHERE agent_id = _agent_id AND client_id IS NOT NULL
$$;

CREATE POLICY "Agents can read linked profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_agent_client_ids(auth.uid())));

-- Admins - use security definer to avoid recursion
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Brokers need to read agent profiles
CREATE OR REPLACE FUNCTION public.get_broker_agent_ids(_broker_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE broker_id = _broker_id
$$;

CREATE POLICY "Brokers can read agent profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_broker_agent_ids(auth.uid())));
