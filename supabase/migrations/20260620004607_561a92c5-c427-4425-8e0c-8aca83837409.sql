-- 1) deal-documents storage: drop legacy policies and recreate with strict path convention
DROP POLICY IF EXISTS "Deal participants can read deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Deal participants can upload deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Deal participants can delete deal documents" ON storage.objects;

-- Read: personal/{userId}/* (owner only) OR {dealId}/* (participants only)
CREATE POLICY "Deal participants can read deal documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'deal-documents' AND (
    ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR public.user_can_access_deal(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

CREATE POLICY "Deal participants can upload deal documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'deal-documents' AND (
    ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR (
      public.user_can_access_deal(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
  )
);

CREATE POLICY "Deal participants can delete deal documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'deal-documents' AND (
    ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR (
      public.user_can_access_deal(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
  )
);

-- 2) connection_requests: allow agent/lender recipients to read requests routed to them
CREATE POLICY "Agent recipients can read incoming connection requests"
ON public.connection_requests FOR SELECT TO authenticated
USING (to_agent_id = auth.uid());

CREATE POLICY "Lender recipients can read incoming connection requests"
ON public.connection_requests FOR SELECT TO authenticated
USING (to_lender_id = auth.uid());

CREATE POLICY "Agent recipients can update connection requests"
ON public.connection_requests FOR UPDATE TO authenticated
USING (to_agent_id = auth.uid());

CREATE POLICY "Lender recipients can update connection requests"
ON public.connection_requests FOR UPDATE TO authenticated
USING (to_lender_id = auth.uid());