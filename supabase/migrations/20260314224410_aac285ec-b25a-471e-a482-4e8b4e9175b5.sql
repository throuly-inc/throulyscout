set search_path = throulyscout, public, extensions;


-- FIX 1: Prevent role escalation via strict trigger

-- Drop all existing UPDATE policies on profiles
DROP POLICY IF EXISTS "Users can update own safe fields only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own safe fields" ON profiles;
DROP POLICY IF EXISTS "Users update own profile only" ON profiles;

-- Drop existing triggers
DROP TRIGGER IF EXISTS check_privilege_escalation ON profiles;
DROP TRIGGER IF EXISTS strict_role_protection ON profiles;

-- Drop old function
DROP FUNCTION IF EXISTS prevent_privilege_escalation();

-- Create strict trigger function
CREATE OR REPLACE FUNCTION strict_prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF OLD.onboarding_complete = true THEN
      RAISE EXCEPTION 'Role cannot be changed after onboarding is complete';
    END IF;
    IF NEW.role NOT IN ('agent', 'broker', 'client') THEN
      RAISE EXCEPTION 'Invalid role. Cannot set role to admin.';
    END IF;
  END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Subscription tier cannot be changed directly';
  END IF;
  IF NEW.broker_id IS DISTINCT FROM OLD.broker_id THEN
    RAISE EXCEPTION 'Broker assignment cannot be changed directly';
  END IF;
  IF NEW.is_deactivated IS DISTINCT FROM OLD.is_deactivated THEN
    RAISE EXCEPTION 'Account status cannot be changed directly';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Email cannot be changed directly';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER strict_role_protection
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION strict_prevent_role_change();

-- Create the update policy
CREATE POLICY "Users update own profile only"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Recreate complete_onboarding function
CREATE OR REPLACE FUNCTION complete_onboarding(new_role text)
RETURNS void AS $$
BEGIN
  IF new_role NOT IN ('agent', 'broker', 'client') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  UPDATE profiles
  SET role = new_role, onboarding_complete = true, updated_at = now()
  WHERE id = auth.uid() AND onboarding_complete = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Onboarding already completed or user not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
