
-- FIX 1: Remove profiles.role fallback from get_user_role to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role FROM public.user_roles WHERE user_id = _user_id;
  RETURN COALESCE(user_role, 'client');
END;
$function$;

-- FIX 2: Block direct updates to role and subscription_tier on profiles
CREATE OR REPLACE FUNCTION public.strict_prevent_role_change()
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

DROP TRIGGER IF EXISTS prevent_role_change ON public.profiles;
CREATE TRIGGER prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.strict_prevent_role_change();

-- FIX 3: Replace tasks INSERT policy with deal ownership check
DROP POLICY IF EXISTS "Agents can create tasks" ON public.tasks;
CREATE POLICY "Agents can create tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = ANY(ARRAY['agent','broker','admin'])
    AND EXISTS (
      SELECT 1 FROM public.deals WHERE deals.id = tasks.deal_id AND deals.agent_id = auth.uid()
    )
  );
