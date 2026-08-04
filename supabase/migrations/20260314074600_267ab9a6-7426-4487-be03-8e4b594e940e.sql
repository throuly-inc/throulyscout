set search_path = throulyscout, public, extensions;


-- Fix connection_requests INSERT policy
DROP POLICY IF EXISTS "Anyone can create connection requests" ON throulyscout.connection_requests;

-- Allow authenticated users to create connection requests with their user_id
CREATE POLICY "Authenticated users can create connection requests"
  ON throulyscout.connection_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- Allow anonymous users to create connection requests without a user_id
CREATE POLICY "Anon users can create connection requests"
  ON throulyscout.connection_requests
  FOR INSERT
  TO anon
  WITH CHECK (from_user_id IS NULL);
