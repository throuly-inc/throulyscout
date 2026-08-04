set search_path = throulyscout, public, extensions;

-- Create sellers table to store seller information
CREATE TABLE throulyscout.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  state TEXT NOT NULL,
  listing_price NUMERIC NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'single-family',
  bedrooms INTEGER DEFAULT 3,
  bathrooms NUMERIC DEFAULT 2,
  square_feet INTEGER,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE throulyscout.sellers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (sellers are publicly visible)
CREATE POLICY "Sellers are publicly readable" 
ON throulyscout.sellers 
FOR SELECT 
USING (is_active = true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION throulyscout.update_sellers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = throulyscout;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON throulyscout.sellers
FOR EACH ROW
EXECUTE FUNCTION throulyscout.update_sellers_updated_at();

-- Insert some sample sellers
INSERT INTO throulyscout.sellers (name, email, phone, state, listing_price, property_type, bedrooms, bathrooms, square_feet, city, description) VALUES
('Sarah Johnson', 'sarah.j@email.com', '(555) 123-4567', 'CA', 650000, 'single-family', 4, 2.5, 2200, 'Los Angeles', 'Beautiful modern home in prime location'),
('Michael Chen', 'mchen@email.com', '(555) 234-5678', 'CA', 480000, 'condo', 2, 2, 1100, 'San Diego', 'Luxury condo with ocean views'),
('Emily Rodriguez', 'emily.r@email.com', '(555) 345-6789', 'TX', 320000, 'single-family', 3, 2, 1800, 'Austin', 'Charming home near downtown'),
('David Thompson', 'david.t@email.com', '(555) 456-7890', 'TX', 275000, 'townhouse', 3, 2.5, 1600, 'Houston', 'Modern townhouse with garage'),
('Jessica Martinez', 'jmartinez@email.com', '(555) 567-8901', 'FL', 425000, 'single-family', 4, 3, 2400, 'Miami', 'Spacious family home with pool'),
('Robert Wilson', 'rwilson@email.com', '(555) 678-9012', 'NY', 550000, 'condo', 2, 1, 950, 'New York', 'Manhattan studio with views'),
('Amanda Lee', 'amanda.lee@email.com', '(555) 789-0123', 'WA', 385000, 'single-family', 3, 2, 1750, 'Seattle', 'Cozy home in quiet neighborhood'),
('James Brown', 'jbrown@email.com', '(555) 890-1234', 'CO', 445000, 'single-family', 4, 2, 2100, 'Denver', 'Mountain views and modern amenities');