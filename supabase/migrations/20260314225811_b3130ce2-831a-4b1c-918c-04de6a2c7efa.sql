
-- FIX 1: Validate client_id on deals INSERT using contacts table
-- Drop existing permissive INSERT policy
DROP POLICY IF EXISTS "Agents can insert own deals" ON public.deals;

-- Create new INSERT policy that validates client_id against agent's contacts
CREATE POLICY "Agents can insert own deals" ON public.deals
FOR INSERT TO public
WITH CHECK (
  agent_id = auth.uid()
  AND (
    client_id IS NULL
    OR client_id IN (
      SELECT linked_user_id FROM public.contacts
      WHERE agent_id = auth.uid() AND linked_user_id IS NOT NULL
    )
  )
);

-- FIX 2: Restrict sellers table SELECT to agents/brokers only
DROP POLICY IF EXISTS "Authenticated users can view active sellers" ON public.sellers;

CREATE POLICY "Agents and brokers can view active sellers" ON public.sellers
FOR SELECT TO authenticated
USING (
  is_active = true
  AND (
    get_user_role(auth.uid()) IN ('agent', 'broker', 'admin')
  )
);
