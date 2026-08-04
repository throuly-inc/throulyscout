set search_path = throulyscout, public, extensions;

-- Create a table for lenders/mortgage professionals
CREATE TABLE throulyscout.lenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  nmls_id TEXT,
  states TEXT[] NOT NULL,
  loan_types TEXT[] DEFAULT ARRAY['conventional', 'fha', 'va', 'usda', 'jumbo'],
  bio TEXT,
  years_experience INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE throulyscout.lenders ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to active lenders
CREATE POLICY "Active lenders are publicly viewable"
ON throulyscout.lenders
FOR SELECT
USING (is_active = true);