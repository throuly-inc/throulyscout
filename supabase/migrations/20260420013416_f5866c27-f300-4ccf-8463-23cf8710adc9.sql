set search_path = throulyscout, public, extensions;

CREATE TABLE IF NOT EXISTS throulyscout.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE throulyscout.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
ON throulyscout.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);