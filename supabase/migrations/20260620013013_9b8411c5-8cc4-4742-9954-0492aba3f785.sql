
REVOKE ALL ON FUNCTION public.anonymous_messages_enforce_sender() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.connection_requests_enforce_sender() FROM PUBLIC, anon, authenticated;
