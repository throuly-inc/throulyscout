set search_path = throulyscout, public, extensions;

DROP POLICY IF EXISTS "Anon users can send anonymous messages" ON throulyscout.anonymous_messages;

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
    WHERE n.nspname = 'throulyscout' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION throulyscout.get_agent_directory(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_lender_directory(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_public_agents(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_public_lenders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_public_sellers() TO anon, authenticated;

GRANT EXECUTE ON FUNCTION throulyscout.has_role(uuid, throulyscout.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.has_approved_role(uuid, throulyscout.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.is_deal_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.user_can_access_deal(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.require_active_workspace(uuid, throulyscout.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_my_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_agent_client_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_agent_client_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_client_agent_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_client_agent_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_broker_agent_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_broker_agent_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_connection_request_contact(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.complete_onboarding(text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.set_user_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.consume_usage(text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.request_role(throulyscout.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.set_active_workspace(throulyscout.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.submit_role_application(throulyscout.product_role, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_grant_role(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_revoke_role(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_approve_role(uuid, throulyscout.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_reject_role(uuid, throulyscout.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_suspend_role(uuid, throulyscout.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_revoke_role_v2(uuid, throulyscout.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_reinstate_role(uuid, throulyscout.product_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_set_role_status(uuid, throulyscout.product_role, throulyscout.role_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_set_subscription_tier(uuid, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION throulyscout.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION throulyscout.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION throulyscout.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION throulyscout.move_to_dlq(text, text, bigint, jsonb) TO service_role;

REVOKE ALL ON throulyscout.seller_match_listings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON throulyscout.seller_match_listings TO authenticated;
GRANT ALL ON throulyscout.seller_match_listings TO service_role;