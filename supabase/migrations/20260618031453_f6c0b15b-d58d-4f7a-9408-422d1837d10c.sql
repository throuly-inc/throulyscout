set search_path = throulyscout, public, extensions;


-- 1. Drop misleading/broken SELECT policy on sellers.
-- sellers.id is gen_random_uuid (unrelated to auth.uid), so this policy never matched.
-- Public access to non-PII fields is already handled by the SECURITY DEFINER
-- function throulyscout.get_public_sellers(). Direct reads of sellers (which contains PII)
-- remain fully blocked by RLS for anon/authenticated.
DROP POLICY IF EXISTS "Sellers view own data" ON throulyscout.sellers;

-- 2. Provide a narrow SECURITY DEFINER lookup so an invited recipient can pre-fill
-- the email on the signup page using an invite code, without exposing
-- agent_id, contact_id, or other invitation rows.
CREATE OR REPLACE FUNCTION throulyscout.get_invitation_email_by_code(invite_code text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = throulyscout
AS $$
  SELECT email
  FROM throulyscout.invitations
  WHERE code = invite_code
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION throulyscout.get_invitation_email_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION throulyscout.get_invitation_email_by_code(text) TO anon, authenticated;
