set search_path = throulyscout, public, extensions;

ALTER PUBLICATION supabase_realtime ADD TABLE throulyscout.timeline_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE throulyscout.tasks;