set search_path = throulyscout, public, extensions;


-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile safely" ON throulyscout.profiles;

-- Create a narrower UPDATE policy (still checks ownership)
CREATE POLICY "Users can update own profile safely"
ON throulyscout.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Revoke UPDATE on sensitive columns from client-side roles
REVOKE UPDATE (role, subscription_tier, is_deactivated, onboarding_complete, broker_id, email, created_at) ON throulyscout.profiles FROM authenticated;
REVOKE UPDATE (role, subscription_tier, is_deactivated, onboarding_complete, broker_id, email, created_at) ON throulyscout.profiles FROM anon;

-- Explicitly grant UPDATE only on safe columns
GRANT UPDATE (full_name, phone, avatar_url, notification_preferences, updated_at) ON throulyscout.profiles TO authenticated;
