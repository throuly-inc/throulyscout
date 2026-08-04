set search_path = throulyscout, public, extensions;


-- ============================================
-- STEP 1: ALTER PROFILES TABLE
-- ============================================
ALTER TABLE throulyscout.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS broker_id uuid REFERENCES throulyscout.profiles(id),
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

ALTER TABLE throulyscout.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('agent', 'broker', 'client', 'admin'));

ALTER TABLE throulyscout.profiles
  ADD CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'premium', 'professional', 'team'));

-- ============================================
-- STEP 2: ALTER DEALS TABLE (add missing columns)
-- ============================================
ALTER TABLE throulyscout.deals
  ADD COLUMN IF NOT EXISTS deal_type text DEFAULT 'buy',
  ADD COLUMN IF NOT EXISTS progress_pct integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

ALTER TABLE throulyscout.deals
  ADD CONSTRAINT deals_deal_type_check CHECK (deal_type IN ('buy', 'sell', 'dual'));

-- ============================================
-- CREATE TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS throulyscout.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES throulyscout.deals(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES throulyscout.profiles(id),
  created_by uuid REFERENCES throulyscout.profiles(id),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  is_ai_suggested boolean NOT NULL DEFAULT false,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'locked'))
);

-- ============================================
-- CREATE CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS throulyscout.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES throulyscout.profiles(id),
  name text NOT NULL,
  email text,
  phone text,
  role_label text DEFAULT 'lead',
  deal_id uuid REFERENCES throulyscout.deals(id),
  linked_user_id uuid REFERENCES throulyscout.profiles(id),
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_role_label_check CHECK (role_label IN ('buyer', 'seller', 'lead', 'past_client'))
);

-- ============================================
-- CREATE PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS throulyscout.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES throulyscout.profiles(id),
  address text NOT NULL,
  city text,
  state text,
  zip text,
  asking_price decimal,
  bedrooms integer,
  bathrooms integer,
  sqft integer,
  description text,
  photos text[],
  status text NOT NULL DEFAULT 'draft',
  listing_type text DEFAULT 'sale',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT properties_status_check CHECK (status IN ('draft', 'active', 'pending', 'sold', 'withdrawn')),
  CONSTRAINT properties_listing_type_check CHECK (listing_type IN ('sale', 'rent', 'both'))
);

-- ============================================
-- CREATE TIMELINE_ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS throulyscout.timeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES throulyscout.deals(id) ON DELETE CASCADE,
  entry_type text NOT NULL,
  content text,
  created_by uuid REFERENCES throulyscout.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT timeline_entries_type_check CHECK (entry_type IN ('stage_change', 'note', 'task_update', 'offer', 'document', 'system'))
);

-- Updated_at trigger for properties
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON throulyscout.properties
  FOR EACH ROW
  EXECUTE FUNCTION throulyscout.update_updated_at_column();

-- ============================================
-- STEP 3: SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- ============================================
CREATE OR REPLACE FUNCTION throulyscout.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = throulyscout
AS $$
  SELECT role FROM throulyscout.profiles WHERE id = _user_id
$$;

-- ============================================
-- STEP 3: RLS — ENABLE ON NEW TABLES
-- ============================================
ALTER TABLE throulyscout.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE throulyscout.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE throulyscout.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE throulyscout.timeline_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES RLS (drop old, recreate)
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON throulyscout.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON throulyscout.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON throulyscout.profiles;

CREATE POLICY "Users can read own profile" ON throulyscout.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON throulyscout.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON throulyscout.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Agents can read linked profiles" ON throulyscout.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM throulyscout.deals
      WHERE deals.client_id = profiles.id
      AND deals.agent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all profiles" ON throulyscout.profiles
  FOR SELECT USING (
    throulyscout.get_user_role(auth.uid()) = 'admin'
  );

-- ============================================
-- DEALS RLS (drop old, recreate)
-- ============================================
DROP POLICY IF EXISTS "Agents can create own deals" ON throulyscout.deals;
DROP POLICY IF EXISTS "Agents can delete own deals" ON throulyscout.deals;
DROP POLICY IF EXISTS "Agents can update own deals" ON throulyscout.deals;
DROP POLICY IF EXISTS "Agents can view own deals" ON throulyscout.deals;

CREATE POLICY "Agents can select own deals" ON throulyscout.deals
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own deals" ON throulyscout.deals
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own deals" ON throulyscout.deals
  FOR UPDATE USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete own deals" ON throulyscout.deals
  FOR DELETE USING (agent_id = auth.uid());

CREATE POLICY "Clients can read own deals" ON throulyscout.deals
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Brokers can read agent deals" ON throulyscout.deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM throulyscout.profiles
      WHERE profiles.id = deals.agent_id
      AND profiles.broker_id = auth.uid()
    )
  );

-- ============================================
-- TASKS RLS
-- ============================================
CREATE POLICY "Users can read assigned or created tasks" ON throulyscout.tasks
  FOR SELECT USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Agents can create tasks" ON throulyscout.tasks
  FOR INSERT WITH CHECK (
    throulyscout.get_user_role(auth.uid()) IN ('agent', 'broker', 'admin')
  );

CREATE POLICY "Creators can update tasks" ON throulyscout.tasks
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Assigned users can complete tasks" ON throulyscout.tasks
  FOR UPDATE USING (assigned_to = auth.uid());

-- ============================================
-- CONTACTS RLS
-- ============================================
CREATE POLICY "Agents can read own contacts" ON throulyscout.contacts
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can create contacts" ON throulyscout.contacts
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own contacts" ON throulyscout.contacts
  FOR UPDATE USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete own contacts" ON throulyscout.contacts
  FOR DELETE USING (agent_id = auth.uid());

-- ============================================
-- PROPERTIES RLS
-- ============================================
CREATE POLICY "Authenticated can read active properties" ON throulyscout.properties
  FOR SELECT TO authenticated USING (status = 'active');

CREATE POLICY "Owners can read own properties" ON throulyscout.properties
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can create properties" ON throulyscout.properties
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own properties" ON throulyscout.properties
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own properties" ON throulyscout.properties
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================
-- TIMELINE_ENTRIES RLS
-- ============================================
CREATE POLICY "Deal participants can read timeline" ON throulyscout.timeline_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM throulyscout.deals
      WHERE deals.id = timeline_entries.deal_id
      AND (deals.agent_id = auth.uid() OR deals.client_id = auth.uid())
    )
  );

CREATE POLICY "Deal agents can write timeline" ON throulyscout.timeline_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM throulyscout.deals
      WHERE deals.id = timeline_entries.deal_id
      AND deals.agent_id = auth.uid()
    )
  );

-- ============================================
-- STEP 4: UPDATE AUTH TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION throulyscout.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = throulyscout
AS $$
BEGIN
  INSERT INTO throulyscout.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'client'
  );
  
  INSERT INTO throulyscout.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
