
-- FIX 2: Drop unprotected views and recreate safe ones

-- Drop all potentially unsafe views
DROP VIEW IF EXISTS public.seller_listings_safe;
DROP VIEW IF EXISTS public.public_listings;
DROP VIEW IF EXISTS public.property_listings;
DROP VIEW IF EXISTS public.public_property_listings;

-- Create safe property listings view (no owner_id, no profile joins)
CREATE OR REPLACE VIEW public.public_property_listings
WITH (security_invoker = true) AS
SELECT
  p.id, p.city, p.state, p.zip, p.asking_price,
  p.bedrooms, p.bathrooms, p.sqft, p.description,
  p.photos, p.status, p.listing_type, p.created_at
FROM properties p
WHERE p.status = 'active';

-- Fix properties SELECT policies
DROP POLICY IF EXISTS "Authenticated can read active properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
DROP POLICY IF EXISTS "Public can view active property listings" ON properties;

CREATE POLICY "Public can view active property listings"
ON properties FOR SELECT
USING (status = 'active');

-- Keep owner policy (already exists, ensure it's there)
DROP POLICY IF EXISTS "Owners can read own properties" ON properties;
CREATE POLICY "Owners can view all their properties"
ON properties FOR SELECT
USING (auth.uid() = owner_id);
