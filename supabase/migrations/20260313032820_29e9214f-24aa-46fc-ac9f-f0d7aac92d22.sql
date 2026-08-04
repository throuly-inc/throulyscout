set search_path = throulyscout, public, extensions;


-- 1. Create notifications table
CREATE TABLE throulyscout.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deal_id uuid REFERENCES throulyscout.deals(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE throulyscout.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Users can read own notifications
CREATE POLICY "Users can read own notifications"
  ON throulyscout.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Users can update own notifications (mark read)
CREATE POLICY "Users can update own notifications"
  ON throulyscout.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Allow system inserts via trigger (security definer function)
CREATE POLICY "System can insert notifications"
  ON throulyscout.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE throulyscout.notifications;

-- 7. Trigger function: when deal.stage changes, notify the client
CREATE OR REPLACE FUNCTION throulyscout.notify_client_on_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = throulyscout
AS $$
DECLARE
  stage_label text;
  client_name text;
BEGIN
  -- Only fire if stage actually changed and there is a client
  IF OLD.stage IS DISTINCT FROM NEW.stage AND NEW.client_id IS NOT NULL THEN
    -- Map stage to label
    stage_label := CASE NEW.stage
      WHEN 'lead' THEN 'Lead'
      WHEN 'pre_approval' THEN 'Pre-Approval'
      WHEN 'search' THEN 'Search'
      WHEN 'offer' THEN 'Offer'
      WHEN 'under_contract' THEN 'Under Contract'
      WHEN 'inspection' THEN 'Inspection'
      WHEN 'appraisal' THEN 'Appraisal'
      WHEN 'closing' THEN 'Closing'
      WHEN 'closed' THEN 'Closed'
      WHEN 'cancelled' THEN 'Cancelled'
      ELSE NEW.stage
    END;

    INSERT INTO throulyscout.notifications (user_id, deal_id, title, message)
    VALUES (
      NEW.client_id,
      NEW.id,
      'Deal Stage Updated',
      NEW.property_address || ' has moved to ' || stage_label
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 8. Attach trigger to deals table
CREATE TRIGGER trg_deal_stage_change
  AFTER UPDATE ON throulyscout.deals
  FOR EACH ROW
  EXECUTE FUNCTION throulyscout.notify_client_on_stage_change();
