set search_path = throulyscout, public, extensions;


-- Fix search_path on security definer functions
ALTER FUNCTION strict_prevent_role_change() SET search_path = throulyscout;
ALTER FUNCTION complete_onboarding(text) SET search_path = throulyscout;
