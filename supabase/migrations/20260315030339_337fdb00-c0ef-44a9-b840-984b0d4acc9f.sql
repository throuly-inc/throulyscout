
CREATE TABLE IF NOT EXISTS public.pricing_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  desired_tier text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert waitlist entries"
  ON public.pricing_waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
