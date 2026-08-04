set search_path = throulyscout, public, extensions;


-- =====================================================================
-- PHASE 1: Multi-role accounts foundation
-- =====================================================================

-- Enum for role kinds (separate from app_role used by user_roles which is
-- platform-level admin/moderator/user). This one represents product roles.
DO $$ BEGIN
  CREATE TYPE throulyscout.product_role AS ENUM ('buyer','seller','agent','lender','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE throulyscout.role_status AS ENUM ('pending','approved','rejected','suspended','revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- role_assignments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS throulyscout.role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role throulyscout.product_role NOT NULL,
  status throulyscout.role_status NOT NULL DEFAULT 'pending',
  approved_at timestamptz,
  approved_by uuid,
  revoked_at timestamptz,
  revoked_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON throulyscout.role_assignments TO authenticated;
GRANT ALL ON throulyscout.role_assignments TO service_role;
ALTER TABLE throulyscout.role_assignments ENABLE ROW LEVEL SECURITY;

-- Users can read their own assignments. NO insert/update/delete from client.
CREATE POLICY "Users read own role_assignments"
  ON throulyscout.role_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all role_assignments"
  ON throulyscout.role_assignments FOR SELECT
  TO authenticated
  USING (throulyscout.has_role(auth.uid(), 'admin'::throulyscout.app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_role_assignments_updated_at ON throulyscout.role_assignments;
CREATE TRIGGER trg_role_assignments_updated_at
  BEFORE UPDATE ON throulyscout.role_assignments
  FOR EACH ROW EXECUTE FUNCTION throulyscout.update_updated_at_column();

-- ---------------------------------------------------------------------
-- role_assignment_audit
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS throulyscout.role_assignment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  role throulyscout.product_role NOT NULL,
  old_status throulyscout.role_status,
  new_status throulyscout.role_status NOT NULL,
  actor_id uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON throulyscout.role_assignment_audit TO authenticated;
GRANT ALL ON throulyscout.role_assignment_audit TO service_role;
ALTER TABLE throulyscout.role_assignment_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read role_assignment_audit"
  ON throulyscout.role_assignment_audit FOR SELECT
  TO authenticated
  USING (throulyscout.has_role(auth.uid(), 'admin'::throulyscout.app_role));

-- ---------------------------------------------------------------------
-- role_applications (Agent / Lender details)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS throulyscout.role_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role throulyscout.product_role NOT NULL CHECK (role IN ('agent','lender')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status throulyscout.role_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON throulyscout.role_applications TO authenticated;
GRANT ALL ON throulyscout.role_applications TO service_role;
ALTER TABLE throulyscout.role_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant reads own application"
  ON throulyscout.role_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all applications"
  ON throulyscout.role_applications FOR SELECT
  TO authenticated
  USING (throulyscout.has_role(auth.uid(), 'admin'::throulyscout.app_role));

DROP TRIGGER IF EXISTS trg_role_applications_updated_at ON throulyscout.role_applications;
CREATE TRIGGER trg_role_applications_updated_at
  BEFORE UPDATE ON throulyscout.role_applications
  FOR EACH ROW EXECUTE FUNCTION throulyscout.update_updated_at_column();

-- ---------------------------------------------------------------------
-- profiles.active_workspace_role
-- ---------------------------------------------------------------------
ALTER TABLE throulyscout.profiles
  ADD COLUMN IF NOT EXISTS active_workspace_role throulyscout.product_role;

-- Block setting active_workspace_role to a role the user does not hold as approved.
CREATE OR REPLACE FUNCTION throulyscout.validate_active_workspace_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.active_workspace_role IS NULL THEN RETURN NEW; END IF;
  IF NEW.active_workspace_role = 'admin' THEN
    RAISE EXCEPTION 'cannot set admin as active workspace';
  END IF;
  IF NEW.active_workspace_role IS DISTINCT FROM COALESCE(OLD.active_workspace_role, NULL::throulyscout.product_role) THEN
    IF NOT EXISTS (
      SELECT 1 FROM throulyscout.role_assignments
      WHERE user_id = NEW.id
        AND role = NEW.active_workspace_role
        AND status = 'approved'
    ) THEN
      RAISE EXCEPTION 'active workspace role not approved for this user';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_active_workspace ON throulyscout.profiles;
CREATE TRIGGER trg_validate_active_workspace
  BEFORE UPDATE OF active_workspace_role ON throulyscout.profiles
  FOR EACH ROW EXECUTE FUNCTION throulyscout.validate_active_workspace_role();

-- ---------------------------------------------------------------------
-- Helper: has_approved_role
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throulyscout.has_approved_role(_user_id uuid, _role throulyscout.product_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM throulyscout.role_assignments
    WHERE user_id = _user_id AND role = _role AND status = 'approved'
  )
$$;

REVOKE EXECUTE ON FUNCTION throulyscout.has_approved_role(uuid, throulyscout.product_role) FROM anon;
GRANT EXECUTE ON FUNCTION throulyscout.has_approved_role(uuid, throulyscout.product_role) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- get_my_roles
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throulyscout.get_my_roles()
RETURNS TABLE(role throulyscout.product_role, status throulyscout.role_status, approved_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role, status, approved_at
  FROM throulyscout.role_assignments
  WHERE user_id = auth.uid()
    AND role <> 'admin';  -- never expose admin status to clients
$$;

REVOKE EXECUTE ON FUNCTION throulyscout.get_my_roles() FROM anon;
GRANT EXECUTE ON FUNCTION throulyscout.get_my_roles() TO authenticated;

-- ---------------------------------------------------------------------
-- request_role: buyer/seller self-serve; agent/lender => pending
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throulyscout.request_role(_role throulyscout.product_role)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  uid uuid := auth.uid();
  new_status throulyscout.role_status;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '28000'; END IF;
  IF _role = 'admin' THEN RAISE EXCEPTION 'cannot self-assign admin' USING ERRCODE = '42501'; END IF;

  new_status := CASE _role
    WHEN 'buyer' THEN 'approved'::throulyscout.role_status
    WHEN 'seller' THEN 'approved'::throulyscout.role_status
    ELSE 'pending'::throulyscout.role_status
  END;

  INSERT INTO throulyscout.role_assignments(user_id, role, status, approved_at)
    VALUES (uid, _role, new_status, CASE WHEN new_status='approved' THEN now() ELSE NULL END)
    ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO throulyscout.role_assignment_audit(target_user_id, role, old_status, new_status, actor_id, reason)
    VALUES (uid, _role, NULL, new_status, uid, 'self-request');

  RETURN jsonb_build_object('ok', true, 'status', new_status);
END $$;

REVOKE EXECUTE ON FUNCTION throulyscout.request_role(throulyscout.product_role) FROM anon;
GRANT EXECUTE ON FUNCTION throulyscout.request_role(throulyscout.product_role) TO authenticated;

-- ---------------------------------------------------------------------
-- submit_role_application (agent/lender details)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throulyscout.submit_role_application(_role throulyscout.product_role, _payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '28000'; END IF;
  IF _role NOT IN ('agent','lender') THEN RAISE EXCEPTION 'role does not require application'; END IF;
  IF _payload IS NULL OR jsonb_typeof(_payload) <> 'object' THEN RAISE EXCEPTION 'payload required'; END IF;

  -- Minimal required fields
  IF _role = 'agent' THEN
    IF COALESCE(_payload->>'license_number','') = '' OR COALESCE(_payload->>'license_state','') = ''
       OR COALESCE(_payload->>'brokerage','') = '' OR COALESCE(_payload->>'full_name','') = '' THEN
      RAISE EXCEPTION 'missing required agent fields';
    END IF;
  ELSIF _role = 'lender' THEN
    IF COALESCE(_payload->>'nmls_number','') = '' OR COALESCE(_payload->>'license_state','') = ''
       OR COALESCE(_payload->>'organization','') = '' OR COALESCE(_payload->>'full_name','') = '' THEN
      RAISE EXCEPTION 'missing required lender fields';
    END IF;
  END IF;

  INSERT INTO throulyscout.role_applications(user_id, role, payload, status)
    VALUES (uid, _role, _payload, 'pending')
    ON CONFLICT (user_id, role) DO UPDATE
      SET payload = EXCLUDED.payload,
          status = 'pending',
          submitted_at = now(),
          reviewed_at = NULL,
          reviewed_by = NULL,
          review_notes = NULL,
          updated_at = now();

  INSERT INTO throulyscout.role_assignments(user_id, role, status)
    VALUES (uid, _role, 'pending')
    ON CONFLICT (user_id, role) DO UPDATE
      SET status = CASE WHEN throulyscout.role_assignments.status = 'approved'
                        THEN throulyscout.role_assignments.status
                        ELSE 'pending'::throulyscout.role_status END,
          updated_at = now();

  INSERT INTO throulyscout.role_assignment_audit(target_user_id, role, old_status, new_status, actor_id, reason)
    VALUES (uid, _role, NULL, 'pending', uid, 'application submitted');

  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE EXECUTE ON FUNCTION throulyscout.submit_role_application(throulyscout.product_role, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION throulyscout.submit_role_application(throulyscout.product_role, jsonb) TO authenticated;

-- ---------------------------------------------------------------------
-- set_active_workspace
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throulyscout.set_active_workspace(_role throulyscout.product_role)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '28000'; END IF;
  IF _role = 'admin' THEN RAISE EXCEPTION 'invalid workspace'; END IF;
  IF NOT throulyscout.has_approved_role(uid, _role) THEN
    RAISE EXCEPTION 'role not approved' USING ERRCODE = '42501';
  END IF;
  UPDATE throulyscout.profiles SET active_workspace_role = _role, updated_at = now() WHERE id = uid;
  RETURN jsonb_build_object('ok', true, 'active_workspace_role', _role);
END $$;

REVOKE EXECUTE ON FUNCTION throulyscout.set_active_workspace(throulyscout.product_role) FROM anon;
GRANT EXECUTE ON FUNCTION throulyscout.set_active_workspace(throulyscout.product_role) TO authenticated;

-- ---------------------------------------------------------------------
-- Admin role management RPCs
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throulyscout.admin_set_role_status(_target uuid, _role throulyscout.product_role, _new_status throulyscout.role_status, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE old_status throulyscout.role_status;
BEGIN
  IF NOT throulyscout.has_role(auth.uid(), 'admin'::throulyscout.app_role) THEN
    RAISE EXCEPTION 'admin required' USING ERRCODE = '42501';
  END IF;
  IF _role = 'admin' THEN
    RAISE EXCEPTION 'use admin_grant_role/admin_revoke_role for admin' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO old_status FROM throulyscout.role_assignments WHERE user_id = _target AND role = _role;

  INSERT INTO throulyscout.role_assignments(user_id, role, status, approved_at, approved_by, revoked_at, revoked_by, reason)
    VALUES (
      _target, _role, _new_status,
      CASE WHEN _new_status='approved' THEN now() END,
      CASE WHEN _new_status='approved' THEN auth.uid() END,
      CASE WHEN _new_status IN ('revoked','suspended') THEN now() END,
      CASE WHEN _new_status IN ('revoked','suspended') THEN auth.uid() END,
      _reason
    )
    ON CONFLICT (user_id, role) DO UPDATE SET
      status = EXCLUDED.status,
      approved_at = CASE WHEN EXCLUDED.status='approved' THEN now() ELSE throulyscout.role_assignments.approved_at END,
      approved_by = CASE WHEN EXCLUDED.status='approved' THEN auth.uid() ELSE throulyscout.role_assignments.approved_by END,
      revoked_at = CASE WHEN EXCLUDED.status IN ('revoked','suspended') THEN now() ELSE NULL END,
      revoked_by = CASE WHEN EXCLUDED.status IN ('revoked','suspended') THEN auth.uid() ELSE NULL END,
      reason = _reason,
      updated_at = now();

  -- Mirror to role_applications when relevant
  IF _role IN ('agent','lender') THEN
    UPDATE throulyscout.role_applications
      SET status = _new_status, reviewed_at = now(), reviewed_by = auth.uid(), review_notes = _reason, updated_at = now()
      WHERE user_id = _target AND role = _role;
  END IF;

  INSERT INTO throulyscout.role_assignment_audit(target_user_id, role, old_status, new_status, actor_id, reason)
    VALUES (_target, _role, old_status, _new_status, auth.uid(), _reason);

  -- If user's active workspace no longer valid, clear it
  IF _new_status <> 'approved' THEN
    UPDATE throulyscout.profiles
      SET active_workspace_role = NULL, updated_at = now()
      WHERE id = _target AND active_workspace_role = _role;
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE EXECUTE ON FUNCTION throulyscout.admin_set_role_status(uuid, throulyscout.product_role, throulyscout.role_status, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.admin_set_role_status(uuid, throulyscout.product_role, throulyscout.role_status, text) TO service_role;

-- Convenience wrappers (admin-only via has_role check inside)
CREATE OR REPLACE FUNCTION throulyscout.admin_approve_role(_target uuid, _role throulyscout.product_role, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT throulyscout.admin_set_role_status(_target, _role, 'approved'::throulyscout.role_status, _reason);
$$;
CREATE OR REPLACE FUNCTION throulyscout.admin_reject_role(_target uuid, _role throulyscout.product_role, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT throulyscout.admin_set_role_status(_target, _role, 'rejected'::throulyscout.role_status, _reason);
$$;
CREATE OR REPLACE FUNCTION throulyscout.admin_suspend_role(_target uuid, _role throulyscout.product_role, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT throulyscout.admin_set_role_status(_target, _role, 'suspended'::throulyscout.role_status, _reason);
$$;
CREATE OR REPLACE FUNCTION throulyscout.admin_revoke_role_v2(_target uuid, _role throulyscout.product_role, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT throulyscout.admin_set_role_status(_target, _role, 'revoked'::throulyscout.role_status, _reason);
$$;
CREATE OR REPLACE FUNCTION throulyscout.admin_reinstate_role(_target uuid, _role throulyscout.product_role, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT throulyscout.admin_set_role_status(_target, _role, 'approved'::throulyscout.role_status, _reason);
$$;

REVOKE EXECUTE ON FUNCTION throulyscout.admin_approve_role(uuid, throulyscout.product_role, text) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.admin_reject_role(uuid, throulyscout.product_role, text) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.admin_suspend_role(uuid, throulyscout.product_role, text) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.admin_revoke_role_v2(uuid, throulyscout.product_role, text) FROM anon;
REVOKE EXECUTE ON FUNCTION throulyscout.admin_reinstate_role(uuid, throulyscout.product_role, text) FROM anon;
GRANT EXECUTE ON FUNCTION throulyscout.admin_approve_role(uuid, throulyscout.product_role, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION throulyscout.admin_reject_role(uuid, throulyscout.product_role, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION throulyscout.admin_suspend_role(uuid, throulyscout.product_role, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION throulyscout.admin_revoke_role_v2(uuid, throulyscout.product_role, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION throulyscout.admin_reinstate_role(uuid, throulyscout.product_role, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- Backfill from existing profiles.role so nobody loses access
-- ---------------------------------------------------------------------
INSERT INTO throulyscout.role_assignments (user_id, role, status, approved_at)
SELECT
  p.id,
  CASE
    WHEN p.role = 'agent' THEN 'agent'::throulyscout.product_role
    WHEN p.role = 'broker' THEN 'agent'::throulyscout.product_role
    WHEN p.role = 'lender' THEN 'lender'::throulyscout.product_role
    WHEN p.role = 'seller' THEN 'seller'::throulyscout.product_role
    ELSE 'buyer'::throulyscout.product_role
  END,
  'approved'::throulyscout.role_status,
  now()
FROM throulyscout.profiles p
WHERE p.id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Every user is also a buyer by default (lets them use Scout)
INSERT INTO throulyscout.role_assignments (user_id, role, status, approved_at)
SELECT p.id, 'buyer'::throulyscout.product_role, 'approved'::throulyscout.role_status, now()
FROM throulyscout.profiles p
ON CONFLICT (user_id, role) DO NOTHING;

-- Backfill admin role from user_roles
INSERT INTO throulyscout.role_assignments (user_id, role, status, approved_at)
SELECT ur.user_id, 'admin'::throulyscout.product_role, 'approved'::throulyscout.role_status, now()
FROM throulyscout.user_roles ur
WHERE ur.role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Set active workspace to current profiles.role where possible
UPDATE throulyscout.profiles p
SET active_workspace_role = CASE
    WHEN p.role = 'agent' THEN 'agent'::throulyscout.product_role
    WHEN p.role = 'broker' THEN 'agent'::throulyscout.product_role
    WHEN p.role = 'lender' THEN 'lender'::throulyscout.product_role
    WHEN p.role = 'seller' THEN 'seller'::throulyscout.product_role
    ELSE 'buyer'::throulyscout.product_role
  END
WHERE p.active_workspace_role IS NULL;
