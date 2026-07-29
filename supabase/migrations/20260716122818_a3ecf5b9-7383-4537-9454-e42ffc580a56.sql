
-- Restrict public/anonymous SELECT on properties so owner_id and full address aren't exposed.
-- Anonymous and free-tier consumers should read via the vetted public_properties view instead.
DROP POLICY IF EXISTS "Public can view active property listings" ON public.properties;

-- Authenticated users can still browse active listings directly (RLS on view + downstream masking in app).
CREATE POLICY "Authenticated can view active property listings"
ON public.properties
FOR SELECT
TO authenticated
USING (status = 'active');
