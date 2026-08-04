set search_path = throulyscout, public, extensions;

-- Drop the potentially recursive client timeline policy
DROP POLICY IF EXISTS "Clients can write timeline for own deals" ON throulyscout.timeline_entries;

-- Create a security definer function to check if user is client on a deal
CREATE OR REPLACE FUNCTION throulyscout.is_deal_client(_user_id uuid, _deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'throulyscout'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM throulyscout.deals
    WHERE id = _deal_id AND client_id = _user_id
  )
$$;

-- Re-create with security definer function
CREATE POLICY "Clients can write timeline for own deals"
ON throulyscout.timeline_entries
FOR INSERT
TO public
WITH CHECK (
  throulyscout.is_deal_client(auth.uid(), deal_id)
);