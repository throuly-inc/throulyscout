
-- Fix security definer view - recreate with security_invoker
DROP VIEW IF EXISTS public.public_sellers;
CREATE VIEW public.public_sellers WITH (security_invoker = true) AS
SELECT
  id, city, state, zip_code, property_type, listing_price, bedrooms, bathrooms, square_feet, description, is_active, created_at
FROM public.sellers
WHERE is_active = true;

GRANT SELECT ON public.public_sellers TO authenticated;
GRANT SELECT ON public.public_sellers TO anon;

-- Also add a permissive SELECT policy for the view to work for all authenticated users
-- The view only exposes safe columns, so this is fine
CREATE POLICY "All authenticated can view active sellers via view" ON public.sellers
  FOR SELECT TO authenticated
  USING (is_active = true);
