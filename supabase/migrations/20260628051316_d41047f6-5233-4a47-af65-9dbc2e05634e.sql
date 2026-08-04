set search_path = throulyscout, public, extensions;


-- Revoke default PUBLIC execute on all SECURITY DEFINER functions, then re-grant narrowly.

-- Trigger-only / internal functions: PUBLIC + anon + authenticated revoked
DO $$
DECLARE
  fn text;
  trigger_only text[] := ARRAY[
    'update_updated_at_column()',
    'update_sellers_updated_at()',
    'strict_prevent_role_change()',
    'block_privilege_changes()',
    'validate_active_workspace_role()',
    'notify_client_on_stage_change()',
    'handle_new_user()',
    'anonymous_messages_enforce_sender()',
    'connection_requests_enforce_sender()',
    'move_to_dlq(text, text, bigint, jsonb)',
    'enqueue_email(text, jsonb)',
    'delete_email(text, bigint)',
    'read_email_batch(text, integer, integer)'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_only LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION throulyscout.%s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION throulyscout.%s TO service_role', fn);
  END LOOP;
END $$;

-- Authenticated-only RPCs and RLS helpers
DO $$
DECLARE
  fn text;
  auth_only text[] := ARRAY[
    'set_user_role(text)',
    'complete_onboarding(text)',
    'accept_invitation(text)',
    'set_active_workspace(product_role)',
    'submit_role_application(product_role, jsonb)',
    'request_role(product_role)',
    'get_my_roles()',
    'consume_usage(text)',
    'admin_grant_role(uuid, text, text)',
    'admin_revoke_role(uuid, text, text)',
    'admin_approve_role(uuid, product_role, text)',
    'admin_reject_role(uuid, product_role, text)',
    'admin_suspend_role(uuid, product_role, text)',
    'admin_reinstate_role(uuid, product_role, text)',
    'admin_revoke_role_v2(uuid, product_role, text)',
    'admin_set_role_status(uuid, product_role, role_status, text)',
    'admin_set_subscription_tier(uuid, text, text)',
    'has_role(uuid, app_role)',
    'has_approved_role(uuid, product_role)',
    'get_user_role(uuid)',
    'get_client_agent_ids_for_rls(uuid)',
    'get_agent_client_ids_for_rls(uuid)',
    'get_broker_agent_ids_for_rls(uuid)',
    'get_client_agent_ids(uuid)',
    'get_agent_client_ids(uuid)',
    'get_broker_agent_ids(uuid)',
    'is_deal_client(uuid, uuid)',
    'user_can_access_deal(uuid, uuid)',
    'require_active_workspace(uuid, product_role)',
    'get_connection_request_contact(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY auth_only LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION throulyscout.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION throulyscout.%s TO authenticated, service_role', fn);
  END LOOP;
END $$;

-- Public directory lookups: anon + authenticated allowed
DO $$
DECLARE
  fn text;
  public_fns text[] := ARRAY[
    'get_public_agents(text)',
    'get_public_sellers()',
    'get_public_lenders(text)',
    'get_agent_directory(text)',
    'get_lender_directory(text)'
  ];
BEGIN
  FOREACH fn IN ARRAY public_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION throulyscout.%s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION throulyscout.%s TO anon, authenticated, service_role', fn);
  END LOOP;
END $$;
