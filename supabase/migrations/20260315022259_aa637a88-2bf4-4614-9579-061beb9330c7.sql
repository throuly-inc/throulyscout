
-- Fix mutable search_path on block_privilege_changes
CREATE OR REPLACE FUNCTION public.block_privilege_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot update role directly';
  END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot update subscription_tier directly';
  END IF;
  RETURN NEW;
END;
$function$;
