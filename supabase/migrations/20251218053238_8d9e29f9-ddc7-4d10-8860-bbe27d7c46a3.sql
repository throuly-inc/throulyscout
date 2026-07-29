-- Create deals table for transaction tracking
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID,
  property_address TEXT NOT NULL,
  city TEXT,
  state TEXT NOT NULL,
  zip_code TEXT,
  listing_price NUMERIC NOT NULL,
  offer_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'offer_submitted', 'under_contract', 'inspection', 'financing', 'clear_to_close', 'closing', 'closed', 'dead')),
  stage TEXT NOT NULL DEFAULT 'Offer Submitted',
  client_type TEXT NOT NULL DEFAULT 'buyer' CHECK (client_type IN ('buyer', 'seller')),
  closing_date DATE,
  days_in_stage INTEGER DEFAULT 0,
  inspection_status TEXT CHECK (inspection_status IN ('pending', 'passed', 'failed', 'waived')),
  financing_status TEXT CHECK (financing_status IN ('pending', 'approved', 'denied')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table for buyer/seller management
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  client_type TEXT NOT NULL DEFAULT 'buyer' CHECK (client_type IN ('buyer', 'seller')),
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'under_contract', 'closed', 'inactive')),
  preferred_states TEXT[],
  min_price NUMERIC,
  max_price NUMERIC,
  property_types TEXT[],
  notes TEXT,
  last_contact_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table for tracking all offers on deals
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  offer_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'countered', 'accepted', 'declined', 'withdrawn')),
  contingencies TEXT[],
  closing_date_proposed DATE,
  earnest_money NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal_timeline table for tracking deal progress
CREATE TABLE public.deal_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('completed', 'current', 'upcoming', 'alert')),
  event_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
CREATE POLICY "Agents can view own deals" ON public.deals
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can create own deals" ON public.deals
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own deals" ON public.deals
  FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete own deals" ON public.deals
  FOR DELETE USING (auth.uid() = agent_id);

-- RLS Policies for clients
CREATE POLICY "Agents can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can create own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = agent_id);

-- RLS Policies for offers
CREATE POLICY "Users can view offers for their deals" ON public.offers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.agent_id = auth.uid())
  );

CREATE POLICY "Users can create offers for their deals" ON public.offers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.agent_id = auth.uid())
  );

CREATE POLICY "Users can update offers for their deals" ON public.offers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.agent_id = auth.uid())
  );

-- RLS Policies for deal_timeline
CREATE POLICY "Users can view timeline for their deals" ON public.deal_timeline
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_timeline.deal_id AND deals.agent_id = auth.uid())
  );

CREATE POLICY "Users can create timeline events for their deals" ON public.deal_timeline
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_timeline.deal_id AND deals.agent_id = auth.uid())
  );

-- Create updated_at triggers
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();