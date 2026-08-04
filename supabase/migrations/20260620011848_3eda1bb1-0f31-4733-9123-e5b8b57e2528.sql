set search_path = throulyscout, public, extensions;


-- ============================================================
-- Security & product hardening migration
-- ============================================================

-- 1) USAGE QUOTAS (server-enforced free-tier allowances)
CREATE TABLE IF NOT EXISTS throulyscout.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  period_yyyymm text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature, period_yyyymm)
);
GRANT SELECT ON throulyscout.usage_counters TO authenticated;
GRANT ALL ON throulyscout.usage_counters TO service_role;
ALTER TABLE throulyscout.usage_counters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own usage" ON throulyscout.usage_counters;
CREATE POLICY "Users read own usage" ON throulyscout.usage_counters
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Tier-aware quota check + increment (SECURITY DEFINER so client cannot bypass).
-- Returns jsonb { allowed, used, limit, tier, period }.
CREATE OR REPLACE FUNCTION throulyscout.consume_usage(_feature text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = throulyscout
AS $$
DECLARE
  uid uuid := auth.uid();
  tier text;
  period text := to_char(now(), 'YYYYMM');
  q_limit integer;
  cur integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT COALESCE(subscription_tier, 'free') INTO tier
  FROM throulyscout.profiles WHERE id = uid;
  tier := COALESCE(tier, 'free');

  -- Limits per feature per tier (NULL = unlimited)
  q_limit := CASE _feature
    WHEN 'address_analysis' THEN
      CASE tier WHEN 'free' THEN 3 WHEN 'premium' THEN 100 ELSE NULL END
    WHEN 'property_analysis' THEN
      CASE tier WHEN 'free' THEN 3 WHEN 'premium' THEN 100 ELSE NULL END
    WHEN 'ai_chat' THEN
      CASE tier WHEN 'free' THEN 10 WHEN 'premium' THEN 500 ELSE NULL END
    ELSE 0
  END;

  INSERT INTO throulyscout.usage_counters (user_id, feature, period_yyyymm, count)
  VALUES (uid, _feature, period, 0)
  ON CONFLICT (user_id, feature, period_yyyymm) DO NOTHING;

  SELECT count INTO cur FROM throulyscout.usage_counters
  WHERE user_id = uid AND feature = _feature AND period_yyyymm = period
  FOR UPDATE;

  IF q_limit IS NOT NULL AND cur >= q_limit THEN
    RETURN jsonb_build_object('allowed', false, 'used', cur, 'limit', q_limit, 'tier', tier, 'period', period);
  END IF;

  UPDATE throulyscout.usage_counters
  SET count = count + 1, updated_at = now()
  WHERE user_id = uid AND feature = _feature AND period_yyyymm = period;

  RETURN jsonb_build_object('allowed', true, 'used', cur + 1, 'limit', q_limit, 'tier', tier, 'period', period);
END;
$$;
REVOKE ALL ON FUNCTION throulyscout.consume_usage(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION throulyscout.consume_usage(text) TO authenticated, service_role;

-- 2) SUBSCRIPTION AUDIT + ADMIN RPC
CREATE TABLE IF NOT EXISTS throulyscout.subscription_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  changed_by uuid,
  old_tier text,
  new_tier text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON throulyscout.subscription_audit TO authenticated;
GRANT ALL ON throulyscout.subscription_audit TO service_role;
ALTER TABLE throulyscout.subscription_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read audit" ON throulyscout.subscription_audit;
CREATE POLICY "Admins read audit" ON throulyscout.subscription_audit
  FOR SELECT TO authenticated USING (throulyscout.has_role(auth.uid(), 'admin'::app_role));

-- Allow privileged change via session GUC the RPC sets
CREATE OR REPLACE FUNCTION throulyscout.strict_prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = throulyscout
AS $$
BEGIN
  IF current_setting('app.privileged_update', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot update role directly';
  END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION throulyscout.block_privilege_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = throulyscout
AS $$
BEGIN
  IF current_setting('app.privileged_update', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot update role directly';
  END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION throulyscout.admin_set_subscription_tier(
  _target uuid, _new_tier text, _reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = throulyscout
AS $$
DECLARE
  old_tier text;
BEGIN
  IF NOT throulyscout.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF _new_tier NOT IN ('free','premium','professional','team') THEN
    RAISE EXCEPTION 'invalid tier %', _new_tier;
  END IF;

  SELECT subscription_tier INTO old_tier FROM throulyscout.profiles WHERE id = _target;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  PERFORM set_config('app.privileged_update', 'on', true);
  UPDATE throulyscout.profiles SET subscription_tier = _new_tier, updated_at = now()
  WHERE id = _target;
  PERFORM set_config('app.privileged_update', 'off', true);

  INSERT INTO throulyscout.subscription_audit(target_user_id, changed_by, old_tier, new_tier, reason)
  VALUES (_target, auth.uid(), old_tier, _new_tier, _reason);

  RETURN jsonb_build_object('ok', true, 'old_tier', old_tier, 'new_tier', _new_tier);
END;
$$;
REVOKE ALL ON FUNCTION throulyscout.admin_set_subscription_tier(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION throulyscout.admin_set_subscription_tier(uuid, text, text) TO authenticated, service_role;

-- 3) TASKS — require deal access on SELECT/UPDATE
DROP POLICY IF EXISTS "Users can read assigned or created tasks" ON throulyscout.tasks;
CREATE POLICY "Task readers must have deal access" ON throulyscout.tasks
  FOR SELECT TO authenticated
  USING (
    throulyscout.user_can_access_deal(auth.uid(), deal_id)
    AND (assigned_to = auth.uid() OR created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM throulyscout.deals d WHERE d.id = tasks.deal_id AND d.agent_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Assigned users can complete tasks" ON throulyscout.tasks;
DROP POLICY IF EXISTS "Creators can update tasks" ON throulyscout.tasks;
CREATE POLICY "Task updaters must have deal access" ON throulyscout.tasks
  FOR UPDATE TO authenticated
  USING (
    throulyscout.user_can_access_deal(auth.uid(), deal_id)
    AND (assigned_to = auth.uid() OR created_by = auth.uid())
  );

-- 4) CONNECTION REQUESTS — recipient checks via directory.user_id
DROP POLICY IF EXISTS "Agent recipients can read incoming connection requests" ON throulyscout.connection_requests;
DROP POLICY IF EXISTS "Agent recipients can update connection requests" ON throulyscout.connection_requests;
DROP POLICY IF EXISTS "Lender recipients can read incoming connection requests" ON throulyscout.connection_requests;
DROP POLICY IF EXISTS "Lender recipients can update connection requests" ON throulyscout.connection_requests;
DROP POLICY IF EXISTS "Recipients can update connection requests" ON throulyscout.connection_requests;

CREATE POLICY "Agent recipients read" ON throulyscout.connection_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM throulyscout.agent_directory a WHERE a.id = to_agent_id AND a.user_id = auth.uid()));
CREATE POLICY "Lender recipients read" ON throulyscout.connection_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM throulyscout.lender_directory l WHERE l.id = to_lender_id AND l.user_id = auth.uid()));
CREATE POLICY "Agent recipients update" ON throulyscout.connection_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM throulyscout.agent_directory a WHERE a.id = to_agent_id AND a.user_id = auth.uid()));
CREATE POLICY "Lender recipients update" ON throulyscout.connection_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM throulyscout.lender_directory l WHERE l.id = to_lender_id AND l.user_id = auth.uid()));
CREATE POLICY "Profile recipients update" ON throulyscout.connection_requests
  FOR UPDATE TO authenticated USING (to_user_id = auth.uid());

-- 5) WAITLIST — allow anon insert, block all reads/updates/deletes
DROP POLICY IF EXISTS "Authenticated users can insert waitlist entries" ON throulyscout.pricing_waitlist;
CREATE POLICY "Public insert pricing waitlist" ON throulyscout.pricing_waitlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- waitlist already allows insert to anon+authenticated; ensure no UPDATE/DELETE policies exist (none currently).

-- 6) DIRECTORY PUBLIC RPCs — strip email/phone
CREATE OR REPLACE FUNCTION throulyscout.get_agent_directory(_state text DEFAULT NULL::text)
RETURNS TABLE(id uuid, name text, photo_url text, brokerage text, license_number text, state text, city text, zip text, specialties text[], years_experience integer, languages text[], bio text, is_verified boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = throulyscout
AS $$
  SELECT id, name, photo_url, brokerage, license_number, state, city, zip,
         specialties, years_experience, languages, bio, is_verified
  FROM throulyscout.agent_directory
  WHERE (_state IS NULL OR _state = '' OR state = _state)
  LIMIT 200;
$$;

CREATE OR REPLACE FUNCTION throulyscout.get_lender_directory(_state text DEFAULT NULL::text)
RETURNS TABLE(id uuid, name text, photo_url text, company text, state text, city text, zip text, lender_type text, nmls_number text, loan_types_offered text[], years_experience integer, languages text[], bio text, is_verified boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = throulyscout
AS $$
  SELECT id, name, photo_url, company, state, city, zip, lender_type, nmls_number,
         loan_types_offered, years_experience, languages, bio, is_verified
  FROM throulyscout.lender_directory
  WHERE (_state IS NULL OR _state = '' OR state = _state)
  LIMIT 200;
$$;

-- 7) STORAGE — restrict listing on public buckets to authenticated; tighten deal-documents SELECT
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read agent logos" ON storage.objects;
CREATE POLICY "Avatars listing requires auth" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'throulyscout-avatars');
CREATE POLICY "Agent logos listing requires auth" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'throulyscout-agent-logos');
-- Note: files in public buckets remain accessible via the public Storage URL/CDN even without RLS-based listing.

DROP POLICY IF EXISTS "Deal participants can read deal documents" ON storage.objects;
CREATE POLICY "Deal participants can read deal documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'throulyscout-deal-documents' AND (
      -- personal scratch space: only uploader
      ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = auth.uid()::text)
      OR
      -- deal documents: must (a) have deal access AND (b) be uploader OR have a documents-table row whose visibility allows the user
      (
        throulyscout.user_can_access_deal(auth.uid(), (NULLIF((storage.foldername(name))[1], ''))::uuid)
        AND (
          (storage.foldername(name))[2] = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM throulyscout.documents d
            WHERE d.file_path = storage.objects.name
              AND (
                d.uploaded_by = auth.uid()
                OR d.agent_id = auth.uid()
                OR (d.visibility IN ('agent_and_client','all_parties')
                    AND EXISTS (SELECT 1 FROM throulyscout.deals dl WHERE dl.id = d.deal_id AND dl.client_id = auth.uid()))
              )
          )
        )
      )
    )
  );

-- 8) SECURITY DEFINER hygiene — revoke broad EXECUTE on internal/trigger/queue funcs
REVOKE ALL ON FUNCTION throulyscout.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION throulyscout.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION throulyscout.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION throulyscout.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- Trigger functions should never be callable directly
REVOKE ALL ON FUNCTION throulyscout.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.notify_client_on_stage_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.update_sellers_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.strict_prevent_role_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.block_privilege_changes() FROM PUBLIC, anon, authenticated;

-- Helpers used by RLS should only be callable by authenticated (revoke anon)
REVOKE EXECUTE ON FUNCTION throulyscout.user_can_access_deal(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.is_deal_client(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.get_agent_client_ids(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.get_agent_client_ids_for_rls(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.get_broker_agent_ids(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.get_broker_agent_ids_for_rls(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.get_client_agent_ids(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.get_client_agent_ids_for_rls(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.set_user_role(text) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.complete_onboarding(text) FROM anon;
