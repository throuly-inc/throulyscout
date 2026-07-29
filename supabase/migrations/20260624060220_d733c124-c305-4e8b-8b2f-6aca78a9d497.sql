DROP POLICY IF EXISTS "Anon users can send anonymous messages" ON public.anonymous_messages;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "agent_logos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars listing requires auth" ON storage.objects;
DROP POLICY IF EXISTS "Agent logos listing requires auth" ON storage.objects;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.get_agent_directory(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_lender_directory(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_agents(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_lenders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_sellers() TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_approved_role(uuid, public.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_deal_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_deal(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.require_active_workspace(uuid, public.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_client_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_client_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_agent_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_agent_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_broker_agent_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_broker_agent_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_connection_request_contact(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_usage(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_role(public.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_workspace(public.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_role_application(public.product_role, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_role(uuid, public.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_role(uuid, public.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_role(uuid, public.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role_v2(uuid, public.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reinstate_role(uuid, public.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role_status(uuid, public.product_role, public.role_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_tier(uuid, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

REVOKE ALL ON public.seller_match_listings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_match_listings TO authenticated;
GRANT ALL ON public.seller_match_listings TO service_role;