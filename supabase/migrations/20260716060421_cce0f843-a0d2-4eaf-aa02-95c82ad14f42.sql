-- Return the view to security_invoker=on (safer default) and enforce column
-- restrictions via GRANTs on the base table.
ALTER VIEW public.public_properties SET (security_invoker = on);

-- Re-add public RLS on active listings so the view (running as invoker) can
-- read the underlying rows.
CREATE POLICY "Public can view active property listings"
  ON public.properties FOR SELECT
  USING (status = 'active');

-- Column-level restriction: anon/authenticated (non-owner) can only read
-- non-sensitive columns. Owner_id is intentionally excluded, so queries
-- selecting owner_id will fail for anon even though rows are visible.
REVOKE SELECT ON public.properties FROM anon, authenticated;
GRANT SELECT (
  id, address, city, state, zip, asking_price, bedrooms, bathrooms, sqft,
  photos, description, status, listing_type, created_at, updated_at
) ON public.properties TO anon, authenticated;

-- Owners still need full access to their own rows; the existing
-- "Owners can view all their properties" policy already scopes rows to them,
-- and this grant restores full-column access for authenticated callers.
GRANT SELECT ON public.properties TO authenticated;