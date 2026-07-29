
-- FIX 1: Drop ALL existing RLS policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Agents can read linked profiles" ON profiles;
DROP POLICY IF EXISTS "Brokers can read agent profiles" ON profiles;
DROP POLICY IF EXISTS "Clients can read agent profiles via deals" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- New SELECT policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Agents can read their clients profiles" ON profiles FOR SELECT TO authenticated
USING (id IN (SELECT client_id FROM deals WHERE agent_id = auth.uid() AND client_id IS NOT NULL));

CREATE POLICY "Clients can read agent profiles via deals" ON profiles FOR SELECT TO authenticated
USING (id IN (SELECT agent_id FROM deals WHERE client_id = auth.uid()));

CREATE POLICY "Brokers can read their agents profiles" ON profiles FOR SELECT TO authenticated
USING (broker_id = auth.uid());

CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- INSERT policy
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE policy (column restrictions enforced by trigger)
CREATE POLICY "Users can update own safe fields only" ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Drop old trigger and function
DROP TRIGGER IF EXISTS check_role_escalation ON profiles;
DROP FUNCTION IF EXISTS prevent_role_escalation() CASCADE;

-- New privilege escalation prevention function
CREATE OR REPLACE FUNCTION prevent_privilege_escalation() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF get_user_role(auth.uid()) != 'admin' THEN
      IF OLD.onboarding_complete = true THEN
        RAISE EXCEPTION 'Cannot change role after onboarding';
      END IF;
    END IF;
  END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    IF get_user_role(auth.uid()) != 'admin' THEN
      RAISE EXCEPTION 'Only admins can change subscription tier';
    END IF;
  END IF;
  IF NEW.is_deactivated IS DISTINCT FROM OLD.is_deactivated THEN
    IF get_user_role(auth.uid()) != 'admin' THEN
      RAISE EXCEPTION 'Only admins can deactivate accounts';
    END IF;
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    IF get_user_role(auth.uid()) != 'admin' THEN
      RAISE EXCEPTION 'Cannot modify email directly';
    END IF;
  END IF;
  IF NEW.broker_id IS DISTINCT FROM OLD.broker_id THEN
    IF get_user_role(auth.uid()) != 'admin' THEN
      RAISE EXCEPTION 'Only admins can change broker assignment';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_privilege_escalation BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION prevent_privilege_escalation();

-- FIX 2: Restrict seller_match_listings access
DROP POLICY IF EXISTS "Authenticated users can view active listings" ON seller_match_listings;

-- Only owners can see their own listings (full data)
CREATE POLICY "Owners can read own listings" ON seller_match_listings FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Matched buyers can see listings they are matched with
CREATE POLICY "Matched buyers can read matched listings" ON seller_match_listings FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM buyer_seller_matches bsm
  JOIN buyer_match_profiles bmp ON bmp.id = bsm.buyer_profile_id
  WHERE bsm.seller_listing_id = seller_match_listings.id
  AND bmp.user_id = auth.uid()
));
