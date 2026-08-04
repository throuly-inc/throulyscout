set search_path = throulyscout, public, extensions;

DROP POLICY IF EXISTS "Public can view active property listings" ON throulyscout.properties;

DROP VIEW IF EXISTS throulyscout.public_properties;
CREATE VIEW throulyscout.public_properties AS
SELECT id, address, city, state, zip, asking_price, bedrooms, bathrooms, sqft,
       photos, description, status, listing_type, created_at, updated_at
FROM throulyscout.properties
WHERE status = 'active';

ALTER VIEW throulyscout.public_properties SET (security_invoker = off);

GRANT SELECT ON throulyscout.public_properties TO anon, authenticated;

REVOKE SELECT ON throulyscout.properties FROM anon;
GRANT SELECT ON throulyscout.properties TO authenticated;