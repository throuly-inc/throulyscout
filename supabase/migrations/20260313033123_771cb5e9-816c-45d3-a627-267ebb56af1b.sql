
-- Create buyer_questionnaires table
CREATE TABLE public.buyer_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_states TEXT[] DEFAULT '{}',
  preferred_cities TEXT[] DEFAULT '{}',
  property_type TEXT DEFAULT 'any',
  bedrooms_min INTEGER DEFAULT 1,
  timeline TEXT DEFAULT 'just browsing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.buyer_questionnaires ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own questionnaire"
  ON public.buyer_questionnaires FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own questionnaire"
  ON public.buyer_questionnaires FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own questionnaire"
  ON public.buyer_questionnaires FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_buyer_questionnaires_updated_at
  BEFORE UPDATE ON public.buyer_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
