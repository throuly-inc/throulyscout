-- Prevent privilege escalation: block direct role/subscription_tier changes on profiles
DROP TRIGGER IF EXISTS prevent_profile_privilege_changes ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_changes
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.block_privilege_changes();