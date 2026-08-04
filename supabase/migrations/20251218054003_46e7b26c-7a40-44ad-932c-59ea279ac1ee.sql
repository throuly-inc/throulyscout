set search_path = throulyscout, public, extensions;

-- Create storage bucket for deal documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'throulyscout-deal-documents', 
  'throulyscout-deal-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create documents table to track uploaded files
CREATE TABLE throulyscout.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES throulyscout.deals(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('contract', 'disclosure', 'inspection', 'appraisal', 'title', 'loan', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'complete', 'rejected')),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE throulyscout.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents table
CREATE POLICY "Agents can view own documents" ON throulyscout.documents
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can upload documents" ON throulyscout.documents
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own documents" ON throulyscout.documents
  FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete own documents" ON throulyscout.documents
  FOR DELETE USING (auth.uid() = agent_id);

-- Storage policies for deal-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'throulyscout-deal-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'throulyscout-deal-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'throulyscout-deal-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime on deals table for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE throulyscout.deals;

-- Create updated_at trigger for documents
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON throulyscout.documents
  FOR EACH ROW
  EXECUTE FUNCTION throulyscout.update_updated_at_column();