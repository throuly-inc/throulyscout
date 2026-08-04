set search_path = throulyscout, public, extensions;


-- 1. connection_requests: remove recipient PII read access + anonymous insert + duplicate insert
DROP POLICY IF EXISTS "Users can see own connection requests" ON throulyscout.connection_requests;
DROP POLICY IF EXISTS "Anon users can create connection requests" ON throulyscout.connection_requests;
DROP POLICY IF EXISTS "Users can insert connection requests" ON throulyscout.connection_requests;
-- "Users can read sent connection requests" (sender-only SELECT) and
-- "Authenticated users can create connection requests" (auth-only INSERT) remain.

-- 2. notifications: remove client-side INSERT; only service_role / SECURITY DEFINER funcs can insert
DROP POLICY IF EXISTS "Insert own notifications" ON throulyscout.notifications;
