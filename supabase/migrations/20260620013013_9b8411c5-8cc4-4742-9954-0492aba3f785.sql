set search_path = throulyscout, public, extensions;


REVOKE ALL ON FUNCTION throulyscout.anonymous_messages_enforce_sender() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION throulyscout.connection_requests_enforce_sender() FROM PUBLIC, anon, authenticated;
