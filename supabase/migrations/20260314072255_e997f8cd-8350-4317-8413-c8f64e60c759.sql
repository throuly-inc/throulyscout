
-- Agent Directory table
CREATE TABLE public.agent_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  photo_url text,
  brokerage text NOT NULL,
  license_number text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  zip text NOT NULL,
  specialties text[] DEFAULT '{}',
  years_experience integer NOT NULL DEFAULT 0,
  languages text[] DEFAULT '{English}',
  bio text NOT NULL DEFAULT '',
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent directory is publicly readable"
  ON public.agent_directory FOR SELECT
  TO public USING (true);

-- Lender Directory table
CREATE TABLE public.lender_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  photo_url text,
  company text NOT NULL,
  license_number text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  zip text NOT NULL,
  lender_type text NOT NULL DEFAULT 'mortgage_broker',
  nmls_number text NOT NULL,
  loan_types_offered text[] DEFAULT '{conventional}',
  years_experience integer NOT NULL DEFAULT 0,
  languages text[] DEFAULT '{English}',
  bio text NOT NULL DEFAULT '',
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lender_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lender directory is publicly readable"
  ON public.lender_directory FOR SELECT
  TO public USING (true);

-- Connection Requests table
CREATE TABLE public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_agent_id uuid REFERENCES public.agent_directory(id) ON DELETE CASCADE,
  to_lender_id uuid REFERENCES public.lender_directory(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  contact_shared boolean NOT NULL DEFAULT false,
  from_name text,
  from_email text,
  from_phone text,
  state text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create connection requests"
  ON public.connection_requests FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Users can read own connection requests"
  ON public.connection_requests FOR SELECT
  TO authenticated USING (from_user_id = auth.uid());

-- Saved Searches table
CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  search_name text NOT NULL DEFAULT 'Property Search',
  filters jsonb NOT NULL DEFAULT '{}',
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own saved searches"
  ON public.saved_searches FOR ALL
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
