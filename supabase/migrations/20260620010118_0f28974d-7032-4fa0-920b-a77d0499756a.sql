-- deal_timeline: add UPDATE/DELETE policies
CREATE POLICY "Agents can update timeline entries for their deals"
ON public.deal_timeline FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_timeline.deal_id AND d.agent_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_timeline.deal_id AND d.agent_id = auth.uid()));

CREATE POLICY "Agents can delete timeline entries for their deals"
ON public.deal_timeline FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_timeline.deal_id AND d.agent_id = auth.uid()));

CREATE POLICY "Brokers can delete timeline entries for their agents' deals"
ON public.deal_timeline FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.deals d
  WHERE d.id = deal_timeline.deal_id
    AND d.agent_id IN (SELECT public.get_broker_agent_ids_for_rls(auth.uid()))
));

-- tasks: add DELETE policy
CREATE POLICY "Creators or deal agents can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = tasks.deal_id AND d.agent_id = auth.uid())
);

-- invitations: add DELETE policy
CREATE POLICY "Agents delete own invitations"
ON public.invitations FOR DELETE TO authenticated
USING (auth.uid() = agent_id);

-- connection_requests: add DELETE policy for senders
CREATE POLICY "Senders can withdraw their own connection requests"
ON public.connection_requests FOR DELETE TO authenticated
USING (from_user_id = auth.uid());

-- storage: deal-documents UPDATE policy (mirror INSERT)
CREATE POLICY "Deal participants can update deal documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'deal-documents'
  AND (
    ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR (public.user_can_access_deal(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
        AND (storage.foldername(name))[2] = auth.uid()::text)
  )
)
WITH CHECK (
  bucket_id = 'deal-documents'
  AND (
    ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR (public.user_can_access_deal(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
        AND (storage.foldername(name))[2] = auth.uid()::text)
  )
);