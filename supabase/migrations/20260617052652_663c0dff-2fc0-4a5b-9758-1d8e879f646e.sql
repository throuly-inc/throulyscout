set search_path = throulyscout, public, extensions;


-- 1) Lock down public PII on agent_directory & lender_directory
DROP POLICY IF EXISTS "Agent directory is publicly readable" ON throulyscout.agent_directory;
DROP POLICY IF EXISTS "Lender directory is publicly readable" ON throulyscout.lender_directory;

-- Allow owners to read/manage their own row (so AgentOfferSettings etc. still work via direct table access if needed)
CREATE POLICY "Owners can read own agent_directory row"
ON throulyscout.agent_directory FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owners can read own lender_directory row"
ON throulyscout.lender_directory FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Public RPCs that omit email & phone
CREATE OR REPLACE FUNCTION throulyscout.get_agent_directory(_state text DEFAULT NULL)
RETURNS TABLE(
  id uuid, name text, photo_url text, brokerage text, license_number text,
  state text, city text, zip text, specialties text[], years_experience integer,
  languages text[], bio text, is_verified boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = throulyscout
AS $$
  SELECT id, name, photo_url, brokerage, license_number, state, city, zip,
         specialties, years_experience, languages, bio, is_verified
  FROM throulyscout.agent_directory
  WHERE (_state IS NULL OR _state = '' OR state = _state)
  LIMIT 200;
$$;

CREATE OR REPLACE FUNCTION throulyscout.get_lender_directory(_state text DEFAULT NULL)
RETURNS TABLE(
  id uuid, name text, photo_url text, company text, state text, city text, zip text,
  lender_type text, nmls_number text, loan_types_offered text[],
  years_experience integer, languages text[], bio text, is_verified boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = throulyscout
AS $$
  SELECT id, name, photo_url, company, state, city, zip, lender_type, nmls_number,
         loan_types_offered, years_experience, languages, bio, is_verified
  FROM throulyscout.lender_directory
  WHERE (_state IS NULL OR _state = '' OR state = _state)
  LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION throulyscout.get_agent_directory(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_lender_directory(text) TO anon, authenticated;

-- 2) Fix agent-logos storage policies — require folder ownership
DROP POLICY IF EXISTS "Auth users can delete own agent logos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update own agent logos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload agent logos" ON storage.objects;

CREATE POLICY "Auth users can upload own agent logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'throulyscout-agent-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Auth users can update own agent logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'throulyscout-agent-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Auth users can delete own agent logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'throulyscout-agent-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Let clients read deal_timeline for their deals
CREATE POLICY "Clients can view timeline for their deals"
ON throulyscout.deal_timeline FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM throulyscout.deals
    WHERE deals.id = deal_timeline.deal_id AND deals.client_id = auth.uid()
  )
);

-- 4) Remove per-agent resend_api_key column; key now lives in a project secret
ALTER TABLE throulyscout.offer_templates DROP COLUMN IF EXISTS resend_api_key;
