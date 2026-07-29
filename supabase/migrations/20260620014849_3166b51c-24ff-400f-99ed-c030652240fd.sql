
-- Block orphan rows from existing or being created (defense in depth)
DELETE FROM public.seller_match_listings WHERE user_id IS NULL;
ALTER TABLE public.seller_match_listings ALTER COLUMN user_id SET NOT NULL;

-- Replace owner policies, scoped to authenticated only
DROP POLICY IF EXISTS "Owners view own match listings" ON public.seller_match_listings;
DROP POLICY IF EXISTS "Owners insert own match listings" ON public.seller_match_listings;
DROP POLICY IF EXISTS "Owners update own match listings" ON public.seller_match_listings;
DROP POLICY IF EXISTS "Owners delete own match listings" ON public.seller_match_listings;

CREATE POLICY "Owners view own match listings"
  ON public.seller_match_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert own match listings"
  ON public.seller_match_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own match listings"
  ON public.seller_match_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete own match listings"
  ON public.seller_match_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure anon has zero access to this PII-bearing table
REVOKE ALL ON public.seller_match_listings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_match_listings TO authenticated;
GRANT ALL ON public.seller_match_listings TO service_role;
