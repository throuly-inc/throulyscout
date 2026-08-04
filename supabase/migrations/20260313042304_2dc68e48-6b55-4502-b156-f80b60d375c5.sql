set search_path = throulyscout, public, extensions;


-- Create offer_templates table
CREATE TABLE IF NOT EXISTS throulyscout.offer_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES throulyscout.profiles(id) ON DELETE CASCADE,
  template_name text NOT NULL DEFAULT 'Default Template',
  company_name text NOT NULL DEFAULT '',
  company_logo_url text,
  agent_license_number text NOT NULL DEFAULT '',
  brokerage_name text NOT NULL DEFAULT '',
  brokerage_address text NOT NULL DEFAULT '',
  default_earnest_money_pct numeric NOT NULL DEFAULT 1.0,
  default_contingencies text[] DEFAULT ARRAY['inspection', 'appraisal', 'financing']::text[],
  standard_terms text DEFAULT '',
  resend_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

ALTER TABLE throulyscout.offer_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can read own templates"
ON throulyscout.offer_templates FOR SELECT TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own templates"
ON throulyscout.offer_templates FOR INSERT TO authenticated
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own templates"
ON throulyscout.offer_templates FOR UPDATE TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete own templates"
ON throulyscout.offer_templates FOR DELETE TO authenticated
USING (agent_id = auth.uid());

-- Add seller info columns to offers table
ALTER TABLE throulyscout.offers
  ADD COLUMN IF NOT EXISTS seller_name text,
  ADD COLUMN IF NOT EXISTS seller_agent_name text,
  ADD COLUMN IF NOT EXISTS seller_agent_email text,
  ADD COLUMN IF NOT EXISTS seller_agent_brokerage text,
  ADD COLUMN IF NOT EXISTS buyer_name text,
  ADD COLUMN IF NOT EXISTS buyer_address text,
  ADD COLUMN IF NOT EXISTS down_payment numeric,
  ADD COLUMN IF NOT EXISTS down_payment_pct numeric,
  ADD COLUMN IF NOT EXISTS loan_preapproval boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS possession_date date,
  ADD COLUMN IF NOT EXISTS inspection_days integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS financing_days integer DEFAULT 21,
  ADD COLUMN IF NOT EXISTS additional_terms text,
  ADD COLUMN IF NOT EXISTS inclusions text,
  ADD COLUMN IF NOT EXISTS exclusions text,
  ADD COLUMN IF NOT EXISTS property_address text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Create agent-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('throulyscout-agent-logos', 'throulyscout-agent-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for agent-logos
CREATE POLICY "Auth users can upload agent logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'throulyscout-agent-logos');

CREATE POLICY "Anyone can read agent logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'throulyscout-agent-logos');

CREATE POLICY "Auth users can update own agent logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'throulyscout-agent-logos');

CREATE POLICY "Auth users can delete own agent logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'throulyscout-agent-logos');
