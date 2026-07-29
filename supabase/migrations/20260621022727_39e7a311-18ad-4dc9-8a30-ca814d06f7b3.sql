
-- Revoke EXECUTE from PUBLIC/anon/authenticated on internal helper functions
-- that are only meant to be invoked by RLS policies or triggers (not by clients).
-- service_role retains access for edge functions / admin code.

DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'public.get_broker_agent_ids_for_rls(uuid)',
    'public.get_client_agent_ids_for_rls(uuid)',
    'public.get_agent_client_ids_for_rls(uuid)',
    'public.get_broker_agent_ids(uuid)',
    'public.get_client_agent_ids(uuid)',
    'public.get_agent_client_ids(uuid)',
    'public.is_deal_client(uuid, uuid)',
    'public.user_can_access_deal(uuid, uuid)',
    'public.require_active_workspace(uuid, public.product_role)',
    'public.has_approved_role(uuid, public.product_role)',
    'public.get_user_role(uuid)',
    'public.strict_prevent_role_change()',
    'public.block_privilege_changes()',
    'public.validate_active_workspace_role()',
    'public.handle_new_user()',
    'public.notify_client_on_stage_change()',
    'public.update_updated_at_column()',
    'public.update_sellers_updated_at()',
    'public.connection_requests_enforce_sender()',
    'public.anonymous_messages_enforce_sender()',
    'public.enqueue_email(text, jsonb)',
    'public.delete_email(text, bigint)',
    'public.read_email_batch(text, integer, integer)',
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.admin_set_role_status(uuid, public.product_role, public.role_status, text)'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
