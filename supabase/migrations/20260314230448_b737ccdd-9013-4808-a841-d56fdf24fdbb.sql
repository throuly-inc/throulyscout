set search_path = throulyscout, public, extensions;


-- FIX 1: get_user_role reads from user_roles first
CREATE OR REPLACE FUNCTION throulyscout.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'throulyscout'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role FROM throulyscout.user_roles WHERE user_id = _user_id;
  IF user_role IS NULL THEN
    SELECT role INTO user_role FROM throulyscout.profiles WHERE id = _user_id;
  END IF;
  RETURN COALESCE(user_role, 'client');
END;
$$;

-- Update complete_onboarding to sync user_roles
CREATE OR REPLACE FUNCTION throulyscout.complete_onboarding(new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'throulyscout'
AS $$
BEGIN
  IF new_role NOT IN ('agent', 'broker', 'client') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE throulyscout.profiles
  SET role = new_role, onboarding_complete = true, updated_at = now()
  WHERE id = auth.uid() AND onboarding_complete = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Onboarding already completed or user not found';
  END IF;

  -- Delete any existing roles for this user, then insert new one
  DELETE FROM throulyscout.user_roles WHERE user_id = auth.uid();
  INSERT INTO throulyscout.user_roles (user_id, role)
  VALUES (auth.uid(), new_role::throulyscout.app_role);
END;
$$;

-- Lock down user_roles RLS
ALTER TABLE throulyscout.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own roles" ON throulyscout.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON throulyscout.user_roles;
CREATE POLICY "Users can read own role" ON throulyscout.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- FIX 2: Restrict sellers table
DROP POLICY IF EXISTS "Authenticated users can view active sellers" ON throulyscout.sellers;
DROP POLICY IF EXISTS "Agents and brokers can view active sellers" ON throulyscout.sellers;

CREATE POLICY "Agents and brokers can view active sellers" ON throulyscout.sellers
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND get_user_role(auth.uid()) IN ('agent', 'broker', 'admin')
  );

-- Safe public view hiding PII
CREATE OR REPLACE VIEW throulyscout.public_sellers AS
SELECT
  id, city, state, zip_code, property_type, listing_price, bedrooms, bathrooms, square_feet, description, is_active, created_at
FROM throulyscout.sellers
WHERE is_active = true;

GRANT SELECT ON throulyscout.public_sellers TO authenticated;
GRANT SELECT ON throulyscout.public_sellers TO anon;
