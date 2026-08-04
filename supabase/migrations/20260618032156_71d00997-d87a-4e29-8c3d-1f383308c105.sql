set search_path = throulyscout, public, extensions;


-- 1. Add SELECT policy for connection_requests recipients
CREATE POLICY "Recipients can read incoming connection requests"
ON throulyscout.connection_requests
FOR SELECT TO authenticated
USING (to_user_id = auth.uid());

-- 2. Add broker SELECT policy on deal_timeline
CREATE POLICY "Brokers can view timeline for their agents' deals"
ON throulyscout.deal_timeline
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM throulyscout.deals d
    WHERE d.id = deal_timeline.deal_id
      AND d.agent_id IN (SELECT throulyscout.get_broker_agent_ids_for_rls(auth.uid()))
  )
);

-- 3. Add explicit admin-only policy on sellers to satisfy linter (table is otherwise accessed via SECURITY DEFINER RPC get_public_sellers which strips PII)
CREATE POLICY "Admins can manage sellers"
ON throulyscout.sellers
FOR ALL TO authenticated
USING (throulyscout.has_role(auth.uid(), 'admin'::throulyscout.app_role))
WITH CHECK (throulyscout.has_role(auth.uid(), 'admin'::throulyscout.app_role));
