
-- 1. Helper: true only when caller holds approved role AND it is their active workspace
CREATE OR REPLACE FUNCTION public.require_active_workspace(_user_id uuid, _role public.product_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_assignments ra
    JOIN public.profiles p ON p.id = ra.user_id
    WHERE ra.user_id = _user_id
      AND ra.role = _role
      AND ra.status = 'approved'
      AND p.active_workspace_role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.require_active_workspace(uuid, public.product_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_active_workspace(uuid, public.product_role) TO authenticated, service_role;

-- 2. Apply BUYER workspace gating to buyer-only tables
-- buyer_match_profiles
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='buyer_match_profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.buyer_match_profiles', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "buyer_active select own" ON public.buyer_match_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role));
CREATE POLICY "buyer_active insert own" ON public.buyer_match_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role));
CREATE POLICY "buyer_active update own" ON public.buyer_match_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role))
  WITH CHECK (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role));
CREATE POLICY "buyer_active delete own" ON public.buyer_match_profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role));

-- buyer_questionnaires
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='buyer_questionnaires' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.buyer_questionnaires', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "buyer_active rw" ON public.buyer_questionnaires
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role))
  WITH CHECK (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role));

-- saved_searches / saved_results / saved_scenarios / user_financial_profiles (buyer)
DO $$
DECLARE t text; pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['saved_searches','saved_results','saved_scenarios','user_financial_profiles']
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY "buyer_active rw" ON public.%I FOR ALL TO authenticated
         USING (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), ''buyer''::public.product_role))
         WITH CHECK (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), ''buyer''::public.product_role))', t);
  END LOOP;
END $$;

-- 3. Apply SELLER workspace gating
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='seller_match_listings' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.seller_match_listings', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "seller_active rw" ON public.seller_match_listings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'seller'::public.product_role))
  WITH CHECK (auth.uid() = user_id AND public.require_active_workspace(auth.uid(), 'seller'::public.product_role));

-- 4. AGENT workspace gating on agent-only tables
-- offer_templates (agent owns)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='offer_templates' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.offer_templates', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "agent_active rw" ON public.offer_templates
  FOR ALL TO authenticated
  USING (auth.uid() = agent_id AND public.require_active_workspace(auth.uid(), 'agent'::public.product_role))
  WITH CHECK (auth.uid() = agent_id AND public.require_active_workspace(auth.uid(), 'agent'::public.product_role));

-- contacts (agent owns)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='contacts' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contacts', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "agent_active rw contacts" ON public.contacts
  FOR ALL TO authenticated
  USING (auth.uid() = agent_id AND public.require_active_workspace(auth.uid(), 'agent'::public.product_role))
  WITH CHECK (auth.uid() = agent_id AND public.require_active_workspace(auth.uid(), 'agent'::public.product_role));
-- Linked clients still need read access to their own contact row when in buyer workspace
CREATE POLICY "buyer_active read own contact" ON public.contacts
  FOR SELECT TO authenticated
  USING (linked_user_id = auth.uid() AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role));

-- tasks: agent path gated, deal client path keeps working
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='tasks' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "agent_active tasks rw" ON public.tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = tasks.deal_id AND d.agent_id = auth.uid()
    )
    AND public.require_active_workspace(auth.uid(), 'agent'::public.product_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = tasks.deal_id AND d.agent_id = auth.uid()
    )
    AND public.require_active_workspace(auth.uid(), 'agent'::public.product_role)
  );
CREATE POLICY "buyer_active tasks read own deal" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    public.is_deal_client(auth.uid(), tasks.deal_id)
    AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role)
  );

-- deals: agent path gated, client path gated to buyer workspace
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='deals' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.deals', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "agent_active deals rw" ON public.deals
  FOR ALL TO authenticated
  USING (agent_id = auth.uid() AND public.require_active_workspace(auth.uid(), 'agent'::public.product_role))
  WITH CHECK (agent_id = auth.uid() AND public.require_active_workspace(auth.uid(), 'agent'::public.product_role));
CREATE POLICY "buyer_active deals read own" ON public.deals
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() AND public.require_active_workspace(auth.uid(), 'buyer'::public.product_role));
