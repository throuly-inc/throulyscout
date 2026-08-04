set search_path = throulyscout, public, extensions;


-- Tighten the INSERT policy: only allow inserts where user_id matches the caller
-- (the SECURITY DEFINER trigger bypasses RLS anyway)
DROP POLICY "System can insert notifications" ON throulyscout.notifications;
CREATE POLICY "Insert own notifications"
  ON throulyscout.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
