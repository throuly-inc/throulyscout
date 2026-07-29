
ALTER TABLE public.saved_scenarios
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS saved_scenarios_touch_updated_at ON public.saved_scenarios;
CREATE TRIGGER saved_scenarios_touch_updated_at
  BEFORE UPDATE ON public.saved_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill updated_at to created_at for legacy rows
UPDATE public.saved_scenarios SET updated_at = created_at WHERE updated_at IS NULL OR updated_at = now();
