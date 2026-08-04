set search_path = throulyscout, public, extensions;


-- Restrict public/anonymous SELECT on properties so owner_id and full address aren't exposed.
-- Anonymous and free-tier consumers should read via the vetted public_properties view instead.
DROP POLICY IF EXISTS "Public can view active property listings" ON throulyscout.properties;

-- Authenticated users can still browse active listings directly (RLS on view + downstream masking in app).
CREATE POLICY "Authenticated can view active property listings"
ON throulyscout.properties
FOR SELECT
TO authenticated
USING (status = 'active');
