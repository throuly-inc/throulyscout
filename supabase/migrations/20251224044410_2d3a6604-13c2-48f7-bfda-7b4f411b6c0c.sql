-- Create table for storing property analyses
CREATE TABLE public.property_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_url TEXT NOT NULL,
  property_address TEXT,
  property_price NUMERIC,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  square_feet INTEGER,
  property_type TEXT,
  state TEXT,
  city TEXT,
  zip_code TEXT,
  down_payment_percent NUMERIC DEFAULT 20,
  monthly_mortgage NUMERIC,
  monthly_property_tax NUMERIC,
  monthly_insurance NUMERIC,
  monthly_pmi NUMERIC,
  monthly_hoa NUMERIC DEFAULT 0,
  total_monthly_payment NUMERIC,
  closing_costs NUMERIC,
  cash_to_close NUMERIC,
  qualifies BOOLEAN,
  dti_ratio NUMERIC,
  assistance_programs JSONB,
  external_resources JSONB,
  raw_property_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.property_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own property analyses" 
ON public.property_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property analyses" 
ON public.property_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property analyses" 
ON public.property_analyses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own property analyses" 
ON public.property_analyses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_property_analyses_updated_at
BEFORE UPDATE ON public.property_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();