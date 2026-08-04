set search_path = throulyscout, public, extensions;

CREATE POLICY "Block direct client reads of sellers" ON throulyscout.sellers FOR SELECT TO anon, authenticated USING (false);