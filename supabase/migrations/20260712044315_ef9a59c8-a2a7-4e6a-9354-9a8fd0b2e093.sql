set search_path = throulyscout, public, extensions;

CREATE TABLE throulyscout.roadmap_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tasks jsonb NOT NULL DEFAULT '{}'::jsonb,
  employment_type text,
  readiness_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON throulyscout.roadmap_progress TO authenticated;
GRANT ALL ON throulyscout.roadmap_progress TO service_role;

ALTER TABLE throulyscout.roadmap_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own roadmap" ON throulyscout.roadmap_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own roadmap" ON throulyscout.roadmap_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own roadmap" ON throulyscout.roadmap_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own roadmap" ON throulyscout.roadmap_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION throulyscout.roadmap_progress_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = throulyscout AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER roadmap_progress_touch_updated_at
  BEFORE UPDATE ON throulyscout.roadmap_progress
  FOR EACH ROW EXECUTE FUNCTION throulyscout.roadmap_progress_touch();