
-- Revoke broad EXECUTE on SECURITY DEFINER functions from anon/authenticated/public.
-- These are called by edge functions (service_role) or triggers only.
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
-- email_queue_dispatch/email_queue_wake are created manually (cron setup, see
-- 20260620001715_email_infra.sql notes), so they may not exist on fresh databases.
DO $$
BEGIN
  IF to_regprocedure('public.email_queue_dispatch()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
  END IF;
  IF to_regprocedure('public.email_queue_wake()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_grant_role(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_revoke_role(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_subscription_tier(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_usage(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.block_privilege_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.strict_prevent_role_change() FROM PUBLIC, anon, authenticated;

-- Ensure service_role can still call the ones edge functions invoke.
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_tier(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_usage(text) TO service_role;

-- has_role and get_user_role are referenced by RLS policies evaluated as the
-- querying user, so signed-in users must retain EXECUTE. Revoke only anon/public.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
