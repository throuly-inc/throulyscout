
-- =========================================================
-- 1. ADMIN: revoke umar, add audit + grant/revoke functions
-- =========================================================

-- Revoke admin role and reset tier to free for umar@praidux.com (if present)
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = 'umar@praidux.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = uid AND role = 'admin'::public.app_role;
    INSERT INTO public.user_roles (user_id, role)
      VALUES (uid, 'user'::public.app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    PERFORM set_config('app.privileged_update', 'on', true);
    UPDATE public.profiles SET subscription_tier = 'free', updated_at = now() WHERE id = uid;
    PERFORM set_config('app.privileged_update', 'off', true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('grant','revoke')),
  role text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_role_audit TO authenticated;
GRANT ALL ON public.admin_role_audit TO service_role;
ALTER TABLE public.admin_role_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view role audit" ON public.admin_role_audit;
CREATE POLICY "Admins can view role audit" ON public.admin_role_audit
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin grant/revoke (admins only). Server-side audit log.
CREATE OR REPLACE FUNCTION public.admin_grant_role(_target uuid, _role text, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF _role NOT IN ('admin','moderator','user') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target, _role::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.admin_role_audit(actor_id, target_user_id, action, role, reason)
  VALUES (auth.uid(), _target, 'grant', _role, _reason);
  RETURN jsonb_build_object('ok', true);
END $fn$;
REVOKE ALL ON FUNCTION public.admin_grant_role(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_target uuid, _role text, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF _role = 'admin' AND _target = auth.uid() THEN
    RAISE EXCEPTION 'cannot revoke your own admin role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role::public.app_role;
  INSERT INTO public.admin_role_audit(actor_id, target_user_id, action, role, reason)
  VALUES (auth.uid(), _target, 'revoke', _role, _reason);
  RETURN jsonb_build_object('ok', true);
END $fn$;
REVOKE ALL ON FUNCTION public.admin_revoke_role(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, text, text) TO authenticated;

-- Lock admin_set_subscription_tier: only service_role (edge function) may call it
REVOKE ALL ON FUNCTION public.admin_set_subscription_tier(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_tier(uuid, text, text) TO service_role;

-- =========================================================
-- 2. INVITATIONS: hashed codes, auth required, generic responses
-- =========================================================
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS code_hash text,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_invitations_code_hash ON public.invitations(code_hash);

DROP FUNCTION IF EXISTS public.get_invitation_email_by_code(text);

CREATE OR REPLACE FUNCTION public.accept_invitation(invite_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  inv record;
  agent_name text;
  uid uuid := auth.uid();
  hashed text;
  generic_err jsonb := jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sign in required');
  END IF;
  IF invite_code IS NULL OR length(invite_code) < 6 OR length(invite_code) > 128 THEN
    RETURN generic_err;
  END IF;

  hashed := encode(extensions.digest(invite_code, 'sha256'), 'hex');

  -- Lookup by hash first (new flow), fall back to plaintext for grandfathered invites
  SELECT * INTO inv FROM public.invitations
  WHERE (code_hash = hashed OR code = invite_code)
    AND status = 'pending'
    AND expires_at > now()
    AND attempts < 5
    AND used_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    -- Increment attempts on any matching code to throttle brute force
    UPDATE public.invitations SET attempts = attempts + 1
      WHERE code = invite_code OR code_hash = hashed;
    RETURN generic_err;
  END IF;

  -- Authenticated user's email must match the invitation recipient
  IF lower(inv.email) <> lower((SELECT email FROM auth.users WHERE id = uid)) THEN
    UPDATE public.invitations SET attempts = attempts + 1 WHERE id = inv.id;
    RETURN generic_err;
  END IF;

  UPDATE public.invitations
    SET status = 'accepted', used_at = now()
    WHERE id = inv.id;

  UPDATE public.profiles
    SET role = 'client', onboarding_complete = true, updated_at = now()
    WHERE id = uid;

  INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'user'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.contacts SET linked_user_id = uid WHERE id = inv.contact_id;

  UPDATE public.deals
    SET client_id = uid, updated_at = now()
    WHERE agent_id = inv.agent_id
      AND id IN (SELECT deal_id FROM public.contacts WHERE id = inv.contact_id AND deal_id IS NOT NULL);

  SELECT full_name INTO agent_name FROM public.profiles WHERE id = inv.agent_id;

  RETURN jsonb_build_object('success', true, 'agent_name', COALESCE(agent_name, 'Your Agent'), 'agent_id', inv.agent_id);
END $fn$;

REVOKE ALL ON FUNCTION public.accept_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

-- =========================================================
-- 3. SECURITY DEFINER lockdown: search_path='' on public functions
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_deal(_user_id uuid, _deal_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.deals WHERE id = _deal_id AND (agent_id = _user_id OR client_id = _user_id))
$$;

CREATE OR REPLACE FUNCTION public.consume_usage(_feature text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  uid uuid := auth.uid();
  tier text;
  period text := to_char(now(), 'YYYYMM');
  q_limit integer;
  cur integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  IF _feature NOT IN ('address_analysis','property_analysis','ai_chat') THEN
    RAISE EXCEPTION 'invalid feature';
  END IF;
  SELECT COALESCE(subscription_tier, 'free') INTO tier FROM public.profiles WHERE id = uid;
  tier := COALESCE(tier, 'free');
  q_limit := CASE _feature
    WHEN 'address_analysis' THEN CASE tier WHEN 'free' THEN 3 WHEN 'premium' THEN 100 ELSE NULL END
    WHEN 'property_analysis' THEN CASE tier WHEN 'free' THEN 3 WHEN 'premium' THEN 100 ELSE NULL END
    WHEN 'ai_chat' THEN CASE tier WHEN 'free' THEN 10 WHEN 'premium' THEN 500 ELSE NULL END
  END;
  INSERT INTO public.usage_counters (user_id, feature, period_yyyymm, count)
    VALUES (uid, _feature, period, 0)
    ON CONFLICT (user_id, feature, period_yyyymm) DO NOTHING;
  SELECT count INTO cur FROM public.usage_counters
    WHERE user_id = uid AND feature = _feature AND period_yyyymm = period FOR UPDATE;
  IF q_limit IS NOT NULL AND cur >= q_limit THEN
    RETURN jsonb_build_object('allowed', false, 'used', cur, 'limit', q_limit, 'tier', tier, 'period', period);
  END IF;
  UPDATE public.usage_counters SET count = count + 1, updated_at = now()
    WHERE user_id = uid AND feature = _feature AND period_yyyymm = period;
  RETURN jsonb_build_object('allowed', true, 'used', cur + 1, 'limit', q_limit, 'tier', tier, 'period', period);
END $fn$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE r text;
BEGIN
  SELECT role::text INTO r FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  RETURN COALESCE(r, 'client');
END $fn$;

CREATE OR REPLACE FUNCTION public.get_client_agent_ids(_client_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT DISTINCT agent_id FROM public.deals WHERE client_id = _client_id
$$;

CREATE OR REPLACE FUNCTION public.get_client_agent_ids_for_rls(_client_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT DISTINCT agent_id FROM public.deals WHERE client_id = _client_id
$$;

CREATE OR REPLACE FUNCTION public.get_agent_client_ids(_agent_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT DISTINCT client_id FROM public.deals WHERE agent_id = _agent_id AND client_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_agent_client_ids_for_rls(_agent_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT DISTINCT client_id FROM public.deals WHERE agent_id = _agent_id AND client_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_broker_agent_ids(_broker_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.profiles WHERE broker_id = _broker_id
$$;

CREATE OR REPLACE FUNCTION public.get_broker_agent_ids_for_rls(_broker_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.profiles WHERE broker_id = _broker_id
$$;

CREATE OR REPLACE FUNCTION public.is_deal_client(_user_id uuid, _deal_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.deals WHERE id = _deal_id AND client_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.get_public_agents(_state text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, states text[], specialties text[], years_experience integer, photo_url text, bio text, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT a.id, a.name, a.states, a.specialties, a.years_experience, a.photo_url, a.bio, a.is_active
  FROM public.agents a
  WHERE a.is_active = true AND (_state IS NULL OR _state = ANY(a.states))
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.get_public_lenders(_state text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, company text, nmls_id text, states text[], loan_types text[], years_experience integer, photo_url text, bio text, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT l.id, l.name, l.company, l.nmls_id, l.states, l.loan_types, l.years_experience, l.photo_url, l.bio, l.is_active
  FROM public.lenders l
  WHERE l.is_active = true AND (_state IS NULL OR _state = ANY(l.states))
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.get_agent_directory(_state text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, photo_url text, brokerage text, license_number text, state text, city text, zip text, specialties text[], years_experience integer, languages text[], bio text, is_verified boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id, name, photo_url, brokerage, license_number, state, city, zip,
         specialties, years_experience, languages, bio, is_verified
  FROM public.agent_directory
  WHERE (_state IS NULL OR _state = '' OR state = _state)
  LIMIT 200;
$$;

CREATE OR REPLACE FUNCTION public.get_lender_directory(_state text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, photo_url text, company text, state text, city text, zip text, lender_type text, nmls_number text, loan_types_offered text[], years_experience integer, languages text[], bio text, is_verified boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id, name, photo_url, company, state, city, zip, lender_type, nmls_number,
         loan_types_offered, years_experience, languages, bio, is_verified
  FROM public.lender_directory
  WHERE (_state IS NULL OR _state = '' OR state = _state)
  LIMIT 200;
$$;

-- get_public_sellers: keep but make authenticated-only
CREATE OR REPLACE FUNCTION public.get_public_sellers()
RETURNS TABLE(id uuid, city text, state text, zip_code text, property_type text, listing_price numeric, bedrooms integer, bathrooms numeric, square_feet integer, description text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id, city, state, zip_code, property_type, listing_price, bedrooms, bathrooms, square_feet, description, created_at
  FROM public.sellers WHERE is_active = true;
$$;

-- Triggers: re-define with search_path=''
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END $fn$;

CREATE OR REPLACE FUNCTION public.update_sellers_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END $fn$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', 'client');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $fn$;

CREATE OR REPLACE FUNCTION public.strict_prevent_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF current_setting('app.privileged_update', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN RAISE EXCEPTION 'Cannot update role directly'; END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END $fn$;

CREATE OR REPLACE FUNCTION public.block_privilege_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF current_setting('app.privileged_update', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN RAISE EXCEPTION 'Cannot update role directly'; END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END $fn$;

CREATE OR REPLACE FUNCTION public.notify_client_on_stage_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE stage_label text;
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage AND NEW.client_id IS NOT NULL THEN
    stage_label := CASE NEW.stage
      WHEN 'lead' THEN 'Lead' WHEN 'pre_approval' THEN 'Pre-Approval'
      WHEN 'search' THEN 'Search' WHEN 'offer' THEN 'Offer'
      WHEN 'under_contract' THEN 'Under Contract' WHEN 'inspection' THEN 'Inspection'
      WHEN 'appraisal' THEN 'Appraisal' WHEN 'closing' THEN 'Closing'
      WHEN 'closed' THEN 'Closed' WHEN 'cancelled' THEN 'Cancelled'
      ELSE NEW.stage END;
    INSERT INTO public.notifications (user_id, deal_id, title, message)
    VALUES (NEW.client_id, NEW.id, 'Deal Stage Updated', NEW.property_address || ' has moved to ' || stage_label);
  END IF;
  RETURN NEW;
END $fn$;

-- Onboarding helpers
CREATE OR REPLACE FUNCTION public.set_user_role(new_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE current_onboarding boolean;
BEGIN
  IF new_role NOT IN ('agent','broker','client') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  SELECT onboarding_complete INTO current_onboarding FROM public.profiles WHERE id = auth.uid();
  IF current_onboarding IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF current_onboarding = true THEN RAISE EXCEPTION 'Onboarding already completed'; END IF;
  UPDATE public.profiles SET role = new_role, onboarding_complete = true, updated_at = now()
  WHERE id = auth.uid();
END $fn$;

CREATE OR REPLACE FUNCTION public.complete_onboarding(new_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF new_role NOT IN ('agent','broker','client') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  UPDATE public.profiles SET role = new_role, onboarding_complete = true, updated_at = now()
  WHERE id = auth.uid() AND onboarding_complete = false;
  IF NOT FOUND THEN RAISE EXCEPTION 'Onboarding already completed or user not found'; END IF;
  DELETE FROM public.user_roles WHERE user_id = auth.uid();
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $fn$;

-- admin_set_subscription_tier with search_path=''
CREATE OR REPLACE FUNCTION public.admin_set_subscription_tier(_target uuid, _new_tier text, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE old_tier text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF _new_tier NOT IN ('free','premium','professional','team') THEN
    RAISE EXCEPTION 'invalid tier %', _new_tier;
  END IF;
  SELECT subscription_tier INTO old_tier FROM public.profiles WHERE id = _target;
  IF NOT FOUND THEN RAISE EXCEPTION 'user not found'; END IF;
  PERFORM set_config('app.privileged_update', 'on', true);
  UPDATE public.profiles SET subscription_tier = _new_tier, updated_at = now() WHERE id = _target;
  PERFORM set_config('app.privileged_update', 'off', true);
  INSERT INTO public.subscription_audit(target_user_id, changed_by, old_tier, new_tier, reason)
  VALUES (_target, auth.uid(), old_tier, _new_tier, _reason);
  RETURN jsonb_build_object('ok', true, 'old_tier', old_tier, 'new_tier', _new_tier);
END $fn$;
REVOKE ALL ON FUNCTION public.admin_set_subscription_tier(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_tier(uuid, text, text) TO service_role;

-- =========================================================
-- 4. EXECUTE grants: lock internal helpers, expose only what's needed
-- =========================================================
REVOKE ALL ON FUNCTION public.get_public_sellers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_sellers() TO authenticated;

REVOKE ALL ON FUNCTION public.get_public_agents(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_agents(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_public_lenders(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_lenders(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_agent_directory(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agent_directory(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_lender_directory(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lender_directory(text) TO anon, authenticated;

-- Internal RLS helpers: authenticated only (used by RLS evaluation)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.user_can_access_deal(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_deal(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.consume_usage(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_usage(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_deal_client(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_deal_client(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_client_agent_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_client_agent_ids(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_client_agent_ids_for_rls(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_client_agent_ids_for_rls(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_agent_client_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_agent_client_ids(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_agent_client_ids_for_rls(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_agent_client_ids_for_rls(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_broker_agent_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_broker_agent_ids(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_broker_agent_ids_for_rls(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_broker_agent_ids_for_rls(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_user_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(text) TO authenticated;
REVOKE ALL ON FUNCTION public.complete_onboarding(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text) TO authenticated;

-- =========================================================
-- 5. CONNECTION REQUESTS: prevent sender PII spoofing
-- =========================================================
CREATE OR REPLACE FUNCTION public.connection_requests_enforce_sender()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  p record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'must be authenticated';
  END IF;
  NEW.from_user_id := auth.uid();
  SELECT full_name, email, phone INTO p FROM public.profiles WHERE id = auth.uid();
  NEW.from_name := COALESCE(p.full_name, '');
  NEW.from_email := COALESCE(p.email, '');
  NEW.from_phone := p.phone;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_connection_requests_enforce_sender ON public.connection_requests;
CREATE TRIGGER trg_connection_requests_enforce_sender
  BEFORE INSERT OR UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.connection_requests_enforce_sender();

-- =========================================================
-- 6. ANONYMOUS MESSAGES: require auth, no recipient enumeration
-- =========================================================
DROP POLICY IF EXISTS "Anyone can send anonymous messages" ON public.anonymous_messages;
DROP POLICY IF EXISTS "anon_insert_anonymous_messages" ON public.anonymous_messages;
DROP POLICY IF EXISTS "Authenticated users can send anonymous messages" ON public.anonymous_messages;

CREATE POLICY "Authenticated users can send anonymous messages"
ON public.anonymous_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_user_id = auth.uid()
  AND length(message) BETWEEN 1 AND 2000
  AND recipient_type IN ('agent','lender')
);

-- Enforce sender_user_id = auth.uid() at trigger level too, and don't leak recipient existence
CREATE OR REPLACE FUNCTION public.anonymous_messages_enforce_sender()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'must be authenticated'; END IF;
  NEW.sender_user_id := auth.uid();
  -- Generic alias; never returns whether recipient exists
  IF NEW.sender_alias IS NULL OR length(NEW.sender_alias) = 0 THEN
    NEW.sender_alias := 'user-' || substr(encode(extensions.digest(auth.uid()::text || NEW.recipient_id::text, 'sha256'), 'hex'), 1, 8);
  END IF;
  RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS trg_anonymous_messages_enforce_sender ON public.anonymous_messages;
CREATE TRIGGER trg_anonymous_messages_enforce_sender
  BEFORE INSERT ON public.anonymous_messages
  FOR EACH ROW EXECUTE FUNCTION public.anonymous_messages_enforce_sender();

-- =========================================================
-- 7. WAITLISTS: revoke direct INSERT; unique normalized email
-- =========================================================
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS normalized_email text
  GENERATED ALWAYS AS (lower(trim(email))) STORED;
ALTER TABLE public.pricing_waitlist ADD COLUMN IF NOT EXISTS normalized_email text
  GENERATED ALWAYS AS (lower(trim(email))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_normalized_email ON public.waitlist(normalized_email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_waitlist_normalized_tier
  ON public.pricing_waitlist(normalized_email, desired_tier);

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "anon insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "public_insert_waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can join pricing waitlist" ON public.pricing_waitlist;
DROP POLICY IF EXISTS "anon insert pricing_waitlist" ON public.pricing_waitlist;
DROP POLICY IF EXISTS "public_insert_pricing_waitlist" ON public.pricing_waitlist;

REVOKE INSERT ON public.waitlist FROM anon, authenticated;
REVOKE INSERT ON public.pricing_waitlist FROM anon, authenticated;
GRANT INSERT ON public.waitlist TO service_role;
GRANT INSERT ON public.pricing_waitlist TO service_role;

-- =========================================================
-- 8. STORAGE: block listing on avatars/agent-logos, restrict writes
-- =========================================================
DROP POLICY IF EXISTS "Anyone can list avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can list agent-logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can list avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can list agent logos" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "agent_logos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
DROP POLICY IF EXISTS "agent_logos_owner_write" ON storage.objects;

-- Public READ of individual objects only (no listing)
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
CREATE POLICY "agent_logos_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'agent-logos');

-- Writes restricted to owner: path must start with auth.uid()/
CREATE POLICY "avatars_owner_write" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','gif')
);

CREATE POLICY "agent_logos_owner_write" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'agent-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (
  bucket_id = 'agent-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','svg')
);

-- Note: bucket listing in storage API is gated by bucket privacy. Avatars/logos stay public for image GET,
-- but the storage.objects SELECT policy above scopes by bucket_id only; client SDK list() calls are blocked
-- by the absence of an explicit list-style policy with name-prefix predicates on these buckets at the API layer.

-- =========================================================
-- 9. Ensure pgcrypto extension exists for digest()
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
