set search_path = throulyscout, public, extensions;


-- Add missing columns to existing documents table
ALTER TABLE throulyscout.documents
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES throulyscout.profiles(id),
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'agent_only',
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES throulyscout.properties(id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Agents can delete own documents" ON throulyscout.documents;
DROP POLICY IF EXISTS "Agents can update own documents" ON throulyscout.documents;
DROP POLICY IF EXISTS "Agents can upload documents" ON throulyscout.documents;
DROP POLICY IF EXISTS "Agents can view own documents" ON throulyscout.documents;

-- Uploaders can CRUD their own docs
CREATE POLICY "Uploaders can insert own docs"
ON throulyscout.documents FOR INSERT TO authenticated
WITH CHECK (
  (agent_id = auth.uid()) OR (uploaded_by = auth.uid())
);

CREATE POLICY "Uploaders can update own docs"
ON throulyscout.documents FOR UPDATE TO authenticated
USING (
  (agent_id = auth.uid()) OR (uploaded_by = auth.uid())
);

CREATE POLICY "Uploaders can delete own docs"
ON throulyscout.documents FOR DELETE TO authenticated
USING (
  (agent_id = auth.uid()) OR (uploaded_by = auth.uid())
);

-- Agents can read all docs on their deals
CREATE POLICY "Agents can read docs on their deals"
ON throulyscout.documents FOR SELECT TO authenticated
USING (
  (agent_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM throulyscout.deals
    WHERE deals.id = documents.deal_id AND deals.agent_id = auth.uid()
  )
);

-- Clients can read docs with appropriate visibility on their deals
CREATE POLICY "Clients can read visible docs on their deals"
ON throulyscout.documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM throulyscout.deals
    WHERE deals.id = documents.deal_id
      AND deals.client_id = auth.uid()
  )
  AND visibility IN ('agent_and_client', 'all_parties')
);

-- Storage policies for deal-documents bucket (already exists)
-- Allow authenticated users to upload to deal-documents
CREATE POLICY "Auth users can upload deal documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'throulyscout-deal-documents');

-- Allow authenticated users to read deal documents
CREATE POLICY "Auth users can read deal documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'throulyscout-deal-documents');

-- Allow uploaders to delete their deal documents
CREATE POLICY "Auth users can delete deal documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'throulyscout-deal-documents');
