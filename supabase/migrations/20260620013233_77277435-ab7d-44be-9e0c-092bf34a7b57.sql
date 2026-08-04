set search_path = throulyscout, public, extensions;


-- =========================================================
-- A. PROPERTIES: hide owner_id from public reads
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view active properties" ON throulyscout.properties;
DROP POLICY IF EXISTS "public_select_active_properties" ON throulyscout.properties;
DROP POLICY IF EXISTS "Public can view active properties" ON throulyscout.properties;
DROP POLICY IF EXISTS "anon_select_active_properties" ON throulyscout.properties;

-- Authenticated reads still go through existing owner / participant policies.
-- Public/anon access now flows through a sanitized view that omits owner_id.
CREATE OR REPLACE VIEW throulyscout.public_properties
WITH (security_invoker = on) AS
SELECT id, address, city, state, zip, asking_price, bedrooms, bathrooms,
       sqft, photos, status, listing_type, created_at, updated_at
FROM throulyscout.properties
WHERE status = 'active';

-- Re-add an anon SELECT policy on properties that excludes nothing structurally,
-- but require the consumer to use the view (we'll point anon clients at the view).
-- We keep anon access denied on the base table so owner_id cannot leak.
GRANT SELECT ON throulyscout.public_properties TO anon, authenticated;

-- =========================================================
-- B. CONNECTION REQUESTS: gate sender PII behind contact_shared
-- =========================================================
REVOKE SELECT (from_name, from_email, from_phone) ON throulyscout.connection_requests FROM authenticated, anon;

CREATE OR REPLACE FUNCTION throulyscout.get_connection_request_contact(_request_id uuid)
RETURNS TABLE (from_name text, from_email text, from_phone text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  r record;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE = '28000'; END IF;

  SELECT cr.from_user_id, cr.to_user_id, cr.to_agent_id, cr.to_lender_id, cr.contact_shared,
         cr.from_name, cr.from_email, cr.from_phone
    INTO r
  FROM throulyscout.connection_requests cr
  WHERE cr.id = _request_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Caller must be the sender, or the recipient AND contact_shared = true.
  IF r.from_user_id = uid
     OR (r.contact_shared = true AND (
           r.to_user_id = uid
           OR EXISTS (SELECT 1 FROM throulyscout.agent_directory ad WHERE ad.id = r.to_agent_id AND ad.user_id = uid)
           OR EXISTS (SELECT 1 FROM throulyscout.lender_directory ld WHERE ld.id = r.to_lender_id AND ld.user_id = uid)
         )) THEN
    from_name := r.from_name;
    from_email := r.from_email;
    from_phone := r.from_phone;
    RETURN NEXT;
  END IF;
END $fn$;

REVOKE ALL ON FUNCTION throulyscout.get_connection_request_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION throulyscout.get_connection_request_contact(uuid) TO authenticated;

-- =========================================================
-- C. INVITATIONS: hide raw code column after creation
-- =========================================================
REVOKE SELECT (code) ON throulyscout.invitations FROM authenticated, anon;
-- service_role still has full access (default ALL grant).
