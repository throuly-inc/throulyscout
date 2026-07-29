-- Drop the potentially recursive client timeline policy
DROP POLICY IF EXISTS "Clients can write timeline for own deals" ON public.timeline_entries;

-- Create a security definer function to check if user is client on a deal
CREATE OR REPLACE FUNCTION public.is_deal_client(_user_id uuid, _deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals
    WHERE id = _deal_id AND client_id = _user_id
  )
$$;

-- Re-create with security definer function
CREATE POLICY "Clients can write timeline for own deals"
ON public.timeline_entries
FOR INSERT
TO public
WITH CHECK (
  public.is_deal_client(auth.uid(), deal_id)
);