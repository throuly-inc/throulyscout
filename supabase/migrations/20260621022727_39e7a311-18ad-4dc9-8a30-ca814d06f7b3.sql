set search_path = throulyscout, public, extensions;


-- Revoke EXECUTE from PUBLIC/anon/authenticated on internal helper functions
-- that are only meant to be invoked by RLS policies or triggers (not by clients).
-- service_role retains access for edge functions / admin code.

DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'throulyscout.get_broker_agent_ids_for_rls(uuid)',
    'throulyscout.get_client_agent_ids_for_rls(uuid)',
    'throulyscout.get_agent_client_ids_for_rls(uuid)',
    'throulyscout.get_broker_agent_ids(uuid)',
    'throulyscout.get_client_agent_ids(uuid)',
    'throulyscout.get_agent_client_ids(uuid)',
    'throulyscout.is_deal_client(uuid, uuid)',
    'throulyscout.user_can_access_deal(uuid, uuid)',
    'throulyscout.require_active_workspace(uuid, throulyscout.product_role)',
    'throulyscout.has_approved_role(uuid, throulyscout.product_role)',
    'throulyscout.get_user_role(uuid)',
    'throulyscout.strict_prevent_role_change()',
    'throulyscout.block_privilege_changes()',
    'throulyscout.validate_active_workspace_role()',
    'throulyscout.handle_new_user()',
    'throulyscout.notify_client_on_stage_change()',
    'throulyscout.update_updated_at_column()',
    'throulyscout.update_sellers_updated_at()',
    'throulyscout.connection_requests_enforce_sender()',
    'throulyscout.anonymous_messages_enforce_sender()',
    'throulyscout.enqueue_email(text, jsonb)',
    'throulyscout.delete_email(text, bigint)',
    'throulyscout.read_email_batch(text, integer, integer)',
    'throulyscout.move_to_dlq(text, text, bigint, jsonb)',
    'throulyscout.admin_set_role_status(uuid, throulyscout.product_role, throulyscout.role_status, text)'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
