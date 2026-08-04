set search_path = throulyscout, public, extensions;

-- Allow clients to insert timeline entries for their deals
CREATE POLICY "Clients can write timeline for own deals"
ON throulyscout.timeline_entries
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = timeline_entries.deal_id
    AND deals.client_id = auth.uid()
  )
);

-- NOTE: This migration originally inserted demo deal/task/timeline data tied to
-- hardcoded production user IDs. Those statements were removed because they fail
-- on fresh databases (the referenced users don't exist). The data already exists
-- in production, where this migration was applied before the cleanup.