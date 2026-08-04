set search_path = throulyscout, public, extensions;


-- Switch get_user_role() to read from the protected user_roles table
-- This means RLS admin checks use user_roles (which users can't modify) instead of profiles.role
CREATE OR REPLACE FUNCTION throulyscout.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'throulyscout'
AS $$
  SELECT role::text FROM throulyscout.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Update complete_onboarding to also sync user_roles table
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
  
  UPDATE profiles
  SET role = new_role, onboarding_complete = true, updated_at = now()
  WHERE id = auth.uid() AND onboarding_complete = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Onboarding already completed or user not found';
  END IF;
END;
$$;

-- Update set_user_role to also sync user_roles
CREATE OR REPLACE FUNCTION throulyscout.set_user_role(new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'throulyscout'
AS $$
DECLARE
  current_onboarding boolean;
BEGIN
  IF new_role NOT IN ('agent', 'broker', 'client') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be agent, broker, or client.', new_role;
  END IF;

  SELECT onboarding_complete INTO current_onboarding
  FROM throulyscout.profiles WHERE id = auth.uid();

  IF current_onboarding IS NULL THEN
    RAISE EXCEPTION 'Profile not found.';
  END IF;

  IF current_onboarding = true THEN
    RAISE EXCEPTION 'Onboarding already completed. Role cannot be changed.';
  END IF;

  UPDATE throulyscout.profiles
  SET role = new_role, onboarding_complete = true, updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Also restrict profiles UPDATE policy to only allow column-level grants
-- Revoke UPDATE on sensitive columns from authenticated/anon roles
REVOKE UPDATE ON throulyscout.profiles FROM authenticated, anon;
GRANT UPDATE (full_name, phone, avatar_url, notification_preferences, updated_at) ON throulyscout.profiles TO authenticated;
