set search_path = throulyscout, public, extensions;

-- Prevent privilege escalation: block direct role/subscription_tier changes on profiles
DROP TRIGGER IF EXISTS prevent_profile_privilege_changes ON throulyscout.profiles;
CREATE TRIGGER prevent_profile_privilege_changes
BEFORE UPDATE ON throulyscout.profiles
FOR EACH ROW
EXECUTE FUNCTION throulyscout.block_privilege_changes();