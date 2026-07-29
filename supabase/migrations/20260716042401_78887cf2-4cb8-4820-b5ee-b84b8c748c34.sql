
DROP TABLE IF EXISTS public.deal_timeline CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;
DROP TABLE IF EXISTS public.offer_templates CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.timeline_entries CASCADE;
DROP TABLE IF EXISTS public.connection_requests CASCADE;
DROP TABLE IF EXISTS public.anonymous_messages CASCADE;
DROP TABLE IF EXISTS public.buyer_seller_matches CASCADE;
DROP TABLE IF EXISTS public.seller_match_listings CASCADE;
DROP TABLE IF EXISTS public.buyer_match_profiles CASCADE;
DROP TABLE IF EXISTS public.role_applications CASCADE;
DROP TABLE IF EXISTS public.role_assignments CASCADE;
DROP TABLE IF EXISTS public.role_assignment_audit CASCADE;
DROP TABLE IF EXISTS public.admin_role_audit CASCADE;
DROP TABLE IF EXISTS public.subscription_audit CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.agent_directory CASCADE;
DROP TABLE IF EXISTS public.lender_directory CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.lenders CASCADE;
DROP TABLE IF EXISTS public.sellers CASCADE;

DROP FUNCTION IF EXISTS public.get_my_roles() CASCADE;
DROP FUNCTION IF EXISTS public.set_active_workspace(product_role) CASCADE;
DROP FUNCTION IF EXISTS public.request_role(product_role) CASCADE;
DROP FUNCTION IF EXISTS public.submit_role_application(product_role, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.has_approved_role(uuid, product_role) CASCADE;
DROP FUNCTION IF EXISTS public.require_active_workspace(uuid, product_role) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_role_status(uuid, product_role, role_status, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_approve_role(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_reject_role(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_reinstate_role(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_revoke_role_v2(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_suspend_role(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_active_workspace_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_agent_client_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_agent_client_ids_for_rls(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_client_agent_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_client_agent_ids_for_rls(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_broker_agent_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_broker_agent_ids_for_rls(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_agent_directory(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_lender_directory(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_public_agents(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_public_lenders(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_public_sellers() CASCADE;
DROP FUNCTION IF EXISTS public.accept_invitation(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_deal_client(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_access_deal(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_client_on_stage_change() CASCADE;
DROP FUNCTION IF EXISTS public.connection_requests_enforce_sender() CASCADE;
DROP FUNCTION IF EXISTS public.anonymous_messages_enforce_sender() CASCADE;
DROP FUNCTION IF EXISTS public.get_connection_request_contact(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.complete_onboarding(text) CASCADE;
DROP FUNCTION IF EXISTS public.set_user_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.update_sellers_updated_at() CASCADE;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS role CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS broker_id CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS active_workspace_role CASCADE;

DROP TYPE IF EXISTS public.product_role CASCADE;
DROP TYPE IF EXISTS public.role_status CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.block_privilege_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF current_setting('app.privileged_update', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.strict_prevent_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF current_setting('app.privileged_update', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END $function$;
