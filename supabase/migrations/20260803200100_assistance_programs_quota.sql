-- Add an 'assistance_programs' feature to consume_usage so the
-- get-assistance-programs edge function can enforce a monthly quota like the
-- other AI endpoints (it previously had none — unlimited Gemini spend).
-- This redefines the latest version of consume_usage (20260620012931) with the
-- new feature added to the whitelist and limits.
CREATE OR REPLACE FUNCTION public.consume_usage(_feature text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  uid uuid := auth.uid();
  tier text;
  period text := to_char(now(), 'YYYYMM');
  q_limit integer;
  cur integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  IF _feature NOT IN ('address_analysis','property_analysis','ai_chat','assistance_programs') THEN
    RAISE EXCEPTION 'invalid feature';
  END IF;
  SELECT COALESCE(subscription_tier, 'free') INTO tier FROM public.profiles WHERE id = uid;
  tier := COALESCE(tier, 'free');
  q_limit := CASE _feature
    WHEN 'address_analysis' THEN CASE tier WHEN 'free' THEN 3 WHEN 'premium' THEN 100 ELSE NULL END
    WHEN 'property_analysis' THEN CASE tier WHEN 'free' THEN 3 WHEN 'premium' THEN 100 ELSE NULL END
    WHEN 'ai_chat' THEN CASE tier WHEN 'free' THEN 10 WHEN 'premium' THEN 500 ELSE NULL END
    WHEN 'assistance_programs' THEN CASE tier WHEN 'free' THEN 10 WHEN 'premium' THEN 200 ELSE NULL END
  END;
  INSERT INTO public.usage_counters (user_id, feature, period_yyyymm, count)
    VALUES (uid, _feature, period, 0)
    ON CONFLICT (user_id, feature, period_yyyymm) DO NOTHING;
  SELECT count INTO cur FROM public.usage_counters
    WHERE user_id = uid AND feature = _feature AND period_yyyymm = period FOR UPDATE;
  IF q_limit IS NOT NULL AND cur >= q_limit THEN
    RETURN jsonb_build_object('allowed', false, 'used', cur, 'limit', q_limit, 'tier', tier, 'period', period);
  END IF;
  UPDATE public.usage_counters SET count = count + 1, updated_at = now()
    WHERE user_id = uid AND feature = _feature AND period_yyyymm = period;
  RETURN jsonb_build_object('allowed', true, 'used', cur + 1, 'limit', q_limit, 'tier', tier, 'period', period);
END $fn$;
