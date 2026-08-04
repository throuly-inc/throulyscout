set search_path = throulyscout, public, extensions;


-- Drop the broad matched-buyers RLS policy (it was already dropped in prior migration, ensure clean state)
DROP POLICY IF EXISTS "Matched buyers can read matched listings" ON seller_match_listings;

-- Re-add a restricted matched-buyers policy via RLS (row-level only; sensitive fields still on table but only owners see their own rows)
-- Matched buyers get read access but sensitive fields (min_acceptable_price, motivation) are exposed.
-- To truly protect those, create a safe view for matched buyers.
CREATE OR REPLACE VIEW throulyscout.seller_listings_safe AS
SELECT 
  id, user_id, bedrooms, bathrooms, sqft, lot_sqft, year_built, 
  hoa_monthly, listing_price, price_negotiable,
  available_date, is_owner, is_active, created_at, updated_at,
  features, condition, recent_updates, hoa_includes, contingencies_accepted,
  timeline, contact_name, contact_email, contact_phone, agent_name, agent_email,
  photos_url, description, property_address, city, state, zip_code, property_type
FROM seller_match_listings;

-- Since matched buyers should use the safe view (no min_acceptable_price, no motivation),
-- we do NOT re-add the broad RLS policy for matched buyers on the raw table.
-- Matched buyers should query seller_listings_safe instead.
-- Owners still have direct access to their own rows (including sensitive fields) via existing "Owners can read own listings" policy.
