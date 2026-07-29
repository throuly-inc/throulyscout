DROP POLICY IF EXISTS "Public can view active property listings" ON public.properties;

DROP VIEW IF EXISTS public.public_properties;
CREATE VIEW public.public_properties AS
SELECT id, address, city, state, zip, asking_price, bedrooms, bathrooms, sqft,
       photos, description, status, listing_type, created_at, updated_at
FROM public.properties
WHERE status = 'active';

ALTER VIEW public.public_properties SET (security_invoker = off);

GRANT SELECT ON public.public_properties TO anon, authenticated;

REVOKE SELECT ON public.properties FROM anon;
GRANT SELECT ON public.properties TO authenticated;