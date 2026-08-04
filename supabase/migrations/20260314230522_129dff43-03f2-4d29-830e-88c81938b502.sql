set search_path = throulyscout, public, extensions;


-- Remove the overly broad policy that defeats the purpose
DROP POLICY IF EXISTS "All authenticated can view active sellers via view" ON throulyscout.sellers;

-- Drop the security_invoker view since it can't bypass RLS
DROP VIEW IF EXISTS throulyscout.public_sellers;

-- Create a SECURITY DEFINER function that returns safe seller data
CREATE OR REPLACE FUNCTION throulyscout.get_public_sellers()
RETURNS TABLE (
  id uuid,
  city text,
  state text,
  zip_code text,
  property_type text,
  listing_price numeric,
  bedrooms integer,
  bathrooms numeric,
  square_feet integer,
  description text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'throulyscout'
AS $$
  SELECT id, city, state, zip_code, property_type, listing_price, bedrooms, bathrooms, square_feet, description, created_at
  FROM throulyscout.sellers
  WHERE is_active = true;
$$;
