set search_path = throulyscout, public, extensions;

-- Create app_role enum for user roles
CREATE TYPE throulyscout.app_role AS ENUM ('admin', 'user', 'premium');

-- Create user profiles table
CREATE TABLE throulyscout.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles table
CREATE TABLE throulyscout.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create user financial profiles table
CREATE TABLE throulyscout.user_financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  yearly_income NUMERIC,
  total_debt NUMERIC,
  savings NUMERIC,
  monthly_expenses NUMERIC,
  credit_score INTEGER,
  preferred_states TEXT[],
  min_price NUMERIC,
  max_price NUMERIC,
  property_types TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Create saved results table
CREATE TABLE throulyscout.saved_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  state TEXT NOT NULL,
  home_price NUMERIC NOT NULL,
  down_payment_percent NUMERIC NOT NULL,
  hoa_monthly NUMERIC DEFAULT 0,
  monthly_payment NUMERIC,
  total_cash_needed NUMERIC,
  qualifies BOOLEAN,
  dti_ratio NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agents table
CREATE TABLE throulyscout.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  states TEXT[] NOT NULL,
  bio TEXT,
  photo_url TEXT,
  years_experience INTEGER,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table for email capture
CREATE TABLE throulyscout.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  source TEXT DEFAULT 'save_results',
  state TEXT,
  home_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE throulyscout.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE throulyscout.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE throulyscout.user_financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE throulyscout.saved_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE throulyscout.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE throulyscout.leads ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION throulyscout.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = throulyscout
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM throulyscout.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON throulyscout.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON throulyscout.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON throulyscout.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON throulyscout.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Financial profiles policies
CREATE POLICY "Users can view own financial profile" ON throulyscout.user_financial_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial profile" ON throulyscout.user_financial_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial profile" ON throulyscout.user_financial_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Saved results policies
CREATE POLICY "Users can view own saved results" ON throulyscout.saved_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved results" ON throulyscout.saved_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved results" ON throulyscout.saved_results
  FOR DELETE USING (auth.uid() = user_id);

-- Agents are publicly viewable
CREATE POLICY "Agents are publicly viewable" ON throulyscout.agents
  FOR SELECT USING (is_active = true);

-- Leads can be inserted by anyone (for unauthenticated users)
CREATE POLICY "Anyone can create leads" ON throulyscout.leads
  FOR INSERT WITH CHECK (true);

-- Create trigger for profile creation on user signup
CREATE OR REPLACE FUNCTION throulyscout.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = throulyscout
AS $$
BEGIN
  INSERT INTO throulyscout.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  INSERT INTO throulyscout.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_throulyscout
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION throulyscout.handle_new_user();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION throulyscout.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = throulyscout;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON throulyscout.profiles
  FOR EACH ROW EXECUTE FUNCTION throulyscout.update_updated_at_column();

CREATE TRIGGER update_user_financial_profiles_updated_at
  BEFORE UPDATE ON throulyscout.user_financial_profiles
  FOR EACH ROW EXECUTE FUNCTION throulyscout.update_updated_at_column();

-- Insert sample agents
INSERT INTO throulyscout.agents (name, email, phone, states, bio, years_experience, specialties) VALUES
('Sarah Johnson', 'sarah@example.com', '555-0101', ARRAY['CA', 'AZ', 'NV'], 'Top-rated agent specializing in first-time buyers', 8, ARRAY['First-time buyers', 'Luxury homes']),
('Michael Chen', 'michael@example.com', '555-0102', ARRAY['TX', 'OK', 'AR'], 'Investment property specialist with 12 years experience', 12, ARRAY['Investment properties', 'Commercial']),
('Emily Rodriguez', 'emily@example.com', '555-0103', ARRAY['FL', 'GA', 'SC'], 'Relocation expert helping families find their dream homes', 6, ARRAY['Relocations', 'Family homes']),
('David Williams', 'david@example.com', '555-0104', ARRAY['NY', 'NJ', 'CT'], 'NYC metro area specialist', 15, ARRAY['Urban properties', 'Condos']),
('Jennifer Lee', 'jennifer@example.com', '555-0105', ARRAY['WA', 'OR', 'ID'], 'Pacific Northwest real estate expert', 10, ARRAY['Eco-friendly homes', 'New construction']);