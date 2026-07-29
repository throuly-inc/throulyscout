
-- Fix security definer view by setting it to SECURITY INVOKER
ALTER VIEW public.seller_listings_safe SET (security_invoker = on);
