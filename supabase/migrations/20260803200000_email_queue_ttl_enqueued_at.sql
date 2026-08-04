set search_path = throulyscout, public, extensions;

-- Fix the email queue TTL check, which never fired:
-- process-email-queue computes message age from `payload.queued_at ?? msg.enqueued_at`,
-- but enqueue_email never stamped queued_at and read_email_batch didn't return
-- pgmq's enqueued_at column, so both sides were always undefined.

-- 1) Stamp queued_at into the payload at enqueue time (kept if caller already set it).
CREATE OR REPLACE FUNCTION throulyscout.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = throulyscout, pgmq
AS $function$
DECLARE
  stamped jsonb := CASE
    WHEN payload ? 'queued_at' THEN payload
    ELSE payload || jsonb_build_object('queued_at', now())
  END;
BEGIN
  RETURN pgmq.send(queue_name, stamped);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, stamped);
END;
$function$;

-- 2) Also return pgmq's enqueued_at so the TTL fallback works for messages
-- already in the queue (enqueued before this migration). The return table
-- changes, so the function must be dropped and recreated, and its grants
-- (service_role only, per 20260716054501) re-applied.
DROP FUNCTION IF EXISTS throulyscout.read_email_batch(text, integer, integer);

CREATE FUNCTION throulyscout.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, enqueued_at timestamptz, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = throulyscout, pgmq
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.enqueued_at, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

REVOKE ALL ON FUNCTION throulyscout.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.read_email_batch(text, integer, integer) TO service_role;
