
-- Add missing columns to existing offers table
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS financing_type text NOT NULL DEFAULT 'conventional',
  ADD COLUMN IF NOT EXISTS expiration_date date,
  ADD COLUMN IF NOT EXISTS counter_price numeric,
  ADD COLUMN IF NOT EXISTS counter_notes text,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id);

-- Drop old restrictive RLS policies so we can replace them
DROP POLICY IF EXISTS "Users can create offers for their deals" ON public.offers;
DROP POLICY IF EXISTS "Users can update offers for their deals" ON public.offers;
DROP POLICY IF EXISTS "Users can view offers for their deals" ON public.offers;

-- Agents can CRUD offers on their deals
CREATE POLICY "Agents can read offers on their deals"
ON public.offers FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.agent_id = auth.uid()
));

CREATE POLICY "Agents can create offers on their deals"
ON public.offers FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.agent_id = auth.uid()
));

CREATE POLICY "Agents can update offers on their deals"
ON public.offers FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.agent_id = auth.uid()
));

CREATE POLICY "Agents can delete offers on their deals"
ON public.offers FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.agent_id = auth.uid()
));

-- Clients can read offers on their deals
CREATE POLICY "Clients can read offers on their deals"
ON public.offers FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.client_id = auth.uid()
));

-- Clients can update offer status (accept/reject) on their deals
CREATE POLICY "Clients can update offers on their deals"
ON public.offers FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.deals WHERE deals.id = offers.deal_id AND deals.client_id = auth.uid()
));
