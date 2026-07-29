-- =============================================
-- THROULLY BUYER-SELLER MATCHING SYSTEM SCHEMA
-- =============================================

-- Create buyer profiles table for matching questionnaire
CREATE TABLE public.buyer_match_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 1: Location & Timeline
  preferred_states TEXT[] NOT NULL,
  preferred_cities TEXT[],
  max_commute_minutes INTEGER,
  timeline TEXT NOT NULL CHECK (timeline IN ('immediately', '1-3_months', '3-6_months', '6-12_months', 'just_browsing')),
  pre_approved BOOLEAN DEFAULT false,
  
  -- Step 2: Property Preferences
  property_types TEXT[] NOT NULL,
  min_bedrooms INTEGER DEFAULT 1,
  max_bedrooms INTEGER,
  min_bathrooms NUMERIC DEFAULT 1,
  max_bathrooms NUMERIC,
  min_sqft INTEGER,
  max_sqft INTEGER,
  min_lot_sqft INTEGER,
  max_year_built INTEGER,
  min_year_built INTEGER,
  
  -- Step 3: Reference Property (from Zillow/Redfin link or manual)
  reference_property_url TEXT,
  reference_property_data JSONB, -- Parsed or manually entered property details
  reference_property_source TEXT CHECK (reference_property_source IN ('zillow', 'redfin', 'realtor', 'manual', 'other')),
  
  -- Step 4: Must-haves & Nice-to-haves
  must_have_features TEXT[], -- e.g., 'garage', 'pool', 'basement', 'updated_kitchen'
  nice_to_have_features TEXT[],
  deal_breakers TEXT[], -- e.g., 'hoa_over_500', 'no_yard', 'busy_road'
  
  -- Step 5: Financial
  min_budget NUMERIC,
  max_budget NUMERIC NOT NULL,
  down_payment_percent NUMERIC DEFAULT 20,
  financing_type TEXT DEFAULT 'conventional' CHECK (financing_type IN ('conventional', 'fha', 'va', 'cash', 'other')),
  
  -- Step 6: Contact & Preferences
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'text')),
  wants_agent_contact BOOLEAN DEFAULT true,
  
  -- Matching metadata
  is_active BOOLEAN DEFAULT true,
  match_score_weights JSONB DEFAULT '{"location": 0.25, "price": 0.25, "features": 0.20, "size": 0.15, "reference_similarity": 0.15}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create seller listings table for matching
CREATE TABLE public.seller_match_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 1: Property Basics
  property_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN ('single-family', 'condo', 'townhouse', 'multi-family', 'land', 'other')),
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC NOT NULL,
  sqft INTEGER,
  lot_sqft INTEGER,
  year_built INTEGER,
  
  -- Step 2: Features & Condition
  features TEXT[], -- 'garage', 'pool', 'basement', 'updated_kitchen', 'hardwood_floors', etc.
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'excellent', 'good', 'fair', 'needs_work')),
  recent_updates TEXT[], -- 'roof', 'hvac', 'kitchen', 'bathrooms', 'flooring'
  hoa_monthly NUMERIC DEFAULT 0,
  hoa_includes TEXT[],
  
  -- Step 3: Pricing & Terms
  listing_price NUMERIC NOT NULL,
  price_negotiable BOOLEAN DEFAULT true,
  min_acceptable_price NUMERIC,
  contingencies_accepted TEXT[] DEFAULT ARRAY['financing', 'inspection', 'appraisal'],
  
  -- Step 4: Timeline & Motivation
  available_date DATE DEFAULT CURRENT_DATE,
  timeline TEXT DEFAULT 'flexible' CHECK (timeline IN ('asap', '30_days', '60_days', '90_days', 'flexible')),
  motivation TEXT, -- 'relocating', 'downsizing', 'upgrading', 'investment', 'other'
  
  -- Step 5: Contact
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  is_owner BOOLEAN DEFAULT true,
  agent_name TEXT,
  agent_email TEXT,
  
  -- Listing metadata
  is_active BOOLEAN DEFAULT true,
  photos_url TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create match results table to store computed matches
CREATE TABLE public.buyer_seller_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_profile_id UUID NOT NULL REFERENCES public.buyer_match_profiles(id) ON DELETE CASCADE,
  seller_listing_id UUID NOT NULL REFERENCES public.seller_match_listings(id) ON DELETE CASCADE,
  
  -- Match scoring
  total_score NUMERIC NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  score_breakdown JSONB NOT NULL, -- {"location": 95, "price": 80, "features": 70, "size": 85, "reference": 75}
  
  -- Match status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'interested', 'contacted', 'rejected', 'closed')),
  buyer_interested BOOLEAN,
  seller_notified BOOLEAN DEFAULT false,
  agent_flagged BOOLEAN DEFAULT false, -- For agent review in hybrid mode
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(buyer_profile_id, seller_listing_id)
);

-- Enable RLS
ALTER TABLE public.buyer_match_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_match_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_seller_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buyer_match_profiles
CREATE POLICY "Users can view own buyer profiles" ON public.buyer_match_profiles
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create own buyer profiles" ON public.buyer_match_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own buyer profiles" ON public.buyer_match_profiles
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own buyer profiles" ON public.buyer_match_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for seller_match_listings
CREATE POLICY "Active listings are publicly viewable" ON public.seller_match_listings
  FOR SELECT USING (is_active = true);
  
CREATE POLICY "Users can create own seller listings" ON public.seller_match_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own seller listings" ON public.seller_match_listings
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own seller listings" ON public.seller_match_listings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for buyer_seller_matches
CREATE POLICY "Buyers can view own matches" ON public.buyer_seller_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.buyer_match_profiles
      WHERE id = buyer_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can view matches for their listings" ON public.buyer_seller_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.seller_match_listings
      WHERE id = seller_listing_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can update own match status" ON public.buyer_seller_matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.buyer_match_profiles
      WHERE id = buyer_profile_id AND user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_buyer_match_profiles_updated_at
  BEFORE UPDATE ON public.buyer_match_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_match_listings_updated_at
  BEFORE UPDATE ON public.seller_match_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyer_seller_matches_updated_at
  BEFORE UPDATE ON public.buyer_seller_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster matching queries
CREATE INDEX idx_seller_listings_state ON public.seller_match_listings(state);
CREATE INDEX idx_seller_listings_price ON public.seller_match_listings(listing_price);
CREATE INDEX idx_seller_listings_active ON public.seller_match_listings(is_active);
CREATE INDEX idx_buyer_profiles_active ON public.buyer_match_profiles(is_active);