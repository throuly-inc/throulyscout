
-- 1. Agents & Lenders: drop public PII exposure
DROP POLICY IF EXISTS "Agents are publicly viewable" ON public.agents;
DROP POLICY IF EXISTS "Active lenders are publicly viewable" ON public.lenders;

CREATE POLICY "Block direct client reads of agents"
ON public.agents FOR SELECT TO anon, authenticated USING (false);

CREATE POLICY "Block direct client reads of lenders"
ON public.lenders FOR SELECT TO anon, authenticated USING (false);

CREATE OR REPLACE FUNCTION public.get_public_agents(_state text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, states text[], specialties text[], years_experience int, photo_url text, bio text, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.name, a.states, a.specialties, a.years_experience, a.photo_url, a.bio, a.is_active
  FROM public.agents a
  WHERE a.is_active = true AND (_state IS NULL OR _state = ANY(a.states))
  LIMIT 50;
$$;
REVOKE ALL ON FUNCTION public.get_public_agents(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_agents(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_lenders(_state text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, company text, nmls_id text, states text[], loan_types text[], years_experience int, photo_url text, bio text, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.name, l.company, l.nmls_id, l.states, l.loan_types, l.years_experience, l.photo_url, l.bio, l.is_active
  FROM public.lenders l
  WHERE l.is_active = true AND (_state IS NULL OR _state = ANY(l.states))
  LIMIT 50;
$$;
REVOKE ALL ON FUNCTION public.get_public_lenders(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_lenders(text) TO anon, authenticated;

-- 2. Storage: lock down deal-documents to deal participants
CREATE OR REPLACE FUNCTION public.user_can_access_deal(_user_id uuid, _deal_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals
    WHERE id = _deal_id AND (agent_id = _user_id OR client_id = _user_id)
  )
$$;
REVOKE ALL ON FUNCTION public.user_can_access_deal(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_access_deal(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Auth users can read deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload deal documents" ON storage.objects;

CREATE POLICY "Deal participants can read deal documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'deal-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.user_can_access_deal(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

CREATE POLICY "Deal participants can upload deal documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'deal-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.user_can_access_deal(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

CREATE POLICY "Deal participants can delete deal documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'deal-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.user_can_access_deal(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

-- 3. anonymous_messages: let recipients read their messages
CREATE POLICY "Recipients can read their messages"
ON public.anonymous_messages FOR SELECT TO authenticated
USING (recipient_id = auth.uid());

-- 4. Explicit deny-by-default reads on lead-capture tables
CREATE POLICY "Block client reads of leads"
ON public.leads FOR SELECT TO anon, authenticated USING (false);

CREATE POLICY "Block client reads of pricing waitlist"
ON public.pricing_waitlist FOR SELECT TO anon, authenticated USING (false);

CREATE POLICY "Block client reads of waitlist"
ON public.waitlist FOR SELECT TO anon, authenticated USING (false);
