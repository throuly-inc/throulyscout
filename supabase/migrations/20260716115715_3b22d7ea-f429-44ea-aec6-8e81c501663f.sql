set search_path = throulyscout, public, extensions;

CREATE TABLE throulyscout.strategy_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT strategy_suggestions_topic_len CHECK (char_length(topic) BETWEEN 3 AND 200),
  CONSTRAINT strategy_suggestions_note_len CHECK (note IS NULL OR char_length(note) <= 1000)
);

GRANT SELECT, INSERT, DELETE ON throulyscout.strategy_suggestions TO authenticated;
GRANT ALL ON throulyscout.strategy_suggestions TO service_role;

ALTER TABLE throulyscout.strategy_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own suggestions"
  ON throulyscout.strategy_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own suggestions"
  ON throulyscout.strategy_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suggestions"
  ON throulyscout.strategy_suggestions FOR SELECT TO authenticated
  USING (throulyscout.has_role(auth.uid(), 'admin'::throulyscout.app_role));

CREATE POLICY "Users can delete own suggestions"
  ON throulyscout.strategy_suggestions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any suggestion"
  ON throulyscout.strategy_suggestions FOR DELETE TO authenticated
  USING (throulyscout.has_role(auth.uid(), 'admin'::throulyscout.app_role));

CREATE INDEX strategy_suggestions_user_id_idx ON throulyscout.strategy_suggestions(user_id);
CREATE INDEX strategy_suggestions_created_at_idx ON throulyscout.strategy_suggestions(created_at DESC);