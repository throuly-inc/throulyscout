set search_path = throulyscout, public, extensions;


DROP TABLE IF EXISTS throulyscout.deal_timeline CASCADE;
DROP TABLE IF EXISTS throulyscout.offers CASCADE;
DROP TABLE IF EXISTS throulyscout.offer_templates CASCADE;
DROP TABLE IF EXISTS throulyscout.tasks CASCADE;
DROP TABLE IF EXISTS throulyscout.documents CASCADE;
DROP TABLE IF EXISTS throulyscout.invitations CASCADE;
DROP TABLE IF EXISTS throulyscout.contacts CASCADE;
DROP TABLE IF EXISTS throulyscout.clients CASCADE;
DROP TABLE IF EXISTS throulyscout.deals CASCADE;
DROP TABLE IF EXISTS throulyscout.timeline_entries CASCADE;
DROP TABLE IF EXISTS throulyscout.connection_requests CASCADE;
DROP TABLE IF EXISTS throulyscout.anonymous_messages CASCADE;
DROP TABLE IF EXISTS throulyscout.buyer_seller_matches CASCADE;
DROP TABLE IF EXISTS throulyscout.seller_match_listings CASCADE;
DROP TABLE IF EXISTS throulyscout.buyer_match_profiles CASCADE;
DROP TABLE IF EXISTS throulyscout.role_applications CASCADE;
DROP TABLE IF EXISTS throulyscout.role_assignments CASCADE;
DROP TABLE IF EXISTS throulyscout.role_assignment_audit CASCADE;
DROP TABLE IF EXISTS throulyscout.admin_role_audit CASCADE;
DROP TABLE IF EXISTS throulyscout.subscription_audit CASCADE;
DROP TABLE IF EXISTS throulyscout.leads CASCADE;
DROP TABLE IF EXISTS throulyscout.agent_directory CASCADE;
DROP TABLE IF EXISTS throulyscout.lender_directory CASCADE;
DROP TABLE IF EXISTS throulyscout.agents CASCADE;
DROP TABLE IF EXISTS throulyscout.lenders CASCADE;
DROP TABLE IF EXISTS throulyscout.sellers CASCADE;

DROP FUNCTION IF EXISTS throulyscout.get_my_roles() CASCADE;
DROP FUNCTION IF EXISTS throulyscout.set_active_workspace(product_role) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.request_role(product_role) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.submit_role_application(product_role, jsonb) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.has_approved_role(uuid, product_role) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.require_active_workspace(uuid, product_role) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.admin_set_role_status(uuid, product_role, role_status, text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.admin_approve_role(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.admin_reject_role(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.admin_reinstate_role(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.admin_revoke_role_v2(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.admin_suspend_role(uuid, product_role, text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.validate_active_workspace_role() CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_agent_client_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_agent_client_ids_for_rls(uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_client_agent_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_client_agent_ids_for_rls(uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_broker_agent_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_broker_agent_ids_for_rls(uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_agent_directory(text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_lender_directory(text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_public_agents(text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_public_lenders(text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_public_sellers() CASCADE;
DROP FUNCTION IF EXISTS throulyscout.accept_invitation(text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.is_deal_client(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.user_can_access_deal(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.notify_client_on_stage_change() CASCADE;
DROP FUNCTION IF EXISTS throulyscout.connection_requests_enforce_sender() CASCADE;
DROP FUNCTION IF EXISTS throulyscout.anonymous_messages_enforce_sender() CASCADE;
DROP FUNCTION IF EXISTS throulyscout.get_connection_request_contact(uuid) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.complete_onboarding(text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.set_user_role(text) CASCADE;
DROP FUNCTION IF EXISTS throulyscout.update_sellers_updated_at() CASCADE;

ALTER TABLE throulyscout.profiles DROP COLUMN IF EXISTS role CASCADE;
ALTER TABLE throulyscout.profiles DROP COLUMN IF EXISTS broker_id CASCADE;
ALTER TABLE throulyscout.profiles DROP COLUMN IF EXISTS active_workspace_role CASCADE;

DROP TYPE IF EXISTS throulyscout.product_role CASCADE;
DROP TYPE IF EXISTS throulyscout.role_status CASCADE;

CREATE OR REPLACE FUNCTION throulyscout.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO throulyscout.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO throulyscout.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::throulyscout.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION throulyscout.block_privilege_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF current_setting('app.privileged_update', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION throulyscout.strict_prevent_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF current_setting('app.privileged_update', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END $function$;
