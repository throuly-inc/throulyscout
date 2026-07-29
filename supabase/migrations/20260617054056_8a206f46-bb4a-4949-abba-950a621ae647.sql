
-- Lock down seller_match_listings writes: only the owner can manage their rows
CREATE POLICY "Owners insert own match listings"
ON public.seller_match_listings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own match listings"
ON public.seller_match_listings
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete own match listings"
ON public.seller_match_listings
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
