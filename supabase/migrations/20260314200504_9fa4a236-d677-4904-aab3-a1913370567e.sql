set search_path = throulyscout, public, extensions;


-- Fix security definer view by setting it to SECURITY INVOKER
ALTER VIEW throulyscout.seller_listings_safe SET (security_invoker = on);
