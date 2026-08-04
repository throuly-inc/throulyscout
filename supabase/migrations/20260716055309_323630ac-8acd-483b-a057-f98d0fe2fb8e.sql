set search_path = throulyscout, public, extensions;


-- Allow each signed-in user to read their own role assignments so the
-- role-check helpers can be safely switched to SECURITY INVOKER.
DROP POLICY IF EXISTS "Users can read their own roles" ON throulyscout.user_roles;
CREATE POLICY "Users can read their own roles"
  ON throulyscout.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Switch has_role to SECURITY INVOKER. Callers now need SELECT on user_roles,
-- which the policy above grants for their own rows. Existing RLS references
-- (and admin_* SECURITY DEFINER wrappers) all pass auth.uid() or run as owner,
-- so behavior is preserved.
CREATE OR REPLACE FUNCTION throulyscout.has_role(_user_id uuid, _role throulyscout.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM throulyscout.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Same for get_user_role.
CREATE OR REPLACE FUNCTION throulyscout.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE r text;
BEGIN
  SELECT role::text INTO r FROM throulyscout.user_roles WHERE user_id = _user_id LIMIT 1;
  RETURN COALESCE(r, 'client');
END $$;

GRANT EXECUTE ON FUNCTION throulyscout.has_role(uuid, throulyscout.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION throulyscout.get_user_role(uuid) TO authenticated, service_role;
