set search_path = throulyscout, public, extensions;


DROP POLICY IF EXISTS "Anyone can join the waitlist" ON throulyscout.waitlist;
DROP POLICY IF EXISTS "Public insert pricing waitlist" ON throulyscout.pricing_waitlist;
