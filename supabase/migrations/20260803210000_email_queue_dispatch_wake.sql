-- Codify the email queue dispatch/wake machinery that existed in production
-- but was never captured in a migration (it was created manually by Lovable's
-- email tooling).
--
-- How it works:
--   * enqueue_email inserts into a pgmq queue; AFTER INSERT statement triggers
--     on the queue tables call email_queue_wake().
--   * email_queue_wake() schedules a pg_cron job (every 5 seconds) that runs
--     email_queue_dispatch(), and immediately pokes the edge function once.
--   * email_queue_dispatch() calls the throulyscout-process-email-queue edge
--     function while there are messages, and unschedules the cron job when
--     both queues are empty (so the cron table stays clean while idle).
--
-- Environment-specific configuration comes from two vault secrets that must
-- be created once per project (see README):
--   * edge_functions_url            e.g. https://<ref>.supabase.co/functions/v1
--   * email_queue_service_role_key  the project's service role key
-- Production hardcodes its URL instead; this parameterized version behaves
-- identically once the secrets are set.

-- Queues must exist before we can attach triggers (idempotent).
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION throulyscout.email_queue_dispatch()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pgmq.q_auth_emails)
     AND NOT EXISTS (SELECT 1 FROM pgmq.q_transactional_emails) THEN
    BEGIN
      PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000002);
      IF EXISTS (SELECT 1 FROM pgmq.q_auth_emails)
         OR EXISTS (SELECT 1 FROM pgmq.q_transactional_emails) THEN
        RETURN;
      END IF;
      PERFORM cron.unschedule('throulyscout-process-email-queue');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'email_queue_dispatch: cron unschedule failed: %', SQLERRM;
    END;
    RETURN;
  END IF;

  IF (SELECT retry_after_until FROM throulyscout.email_send_state WHERE id = 1) > now() THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'edge_functions_url')
           || '/throulyscout-process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
END;
$function$;

CREATE OR REPLACE FUNCTION throulyscout.email_queue_wake()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000002);
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'throulyscout-process-email-queue') THEN
    BEGIN
      PERFORM cron.schedule('throulyscout-process-email-queue', '5 seconds', $cron$ SELECT throulyscout.email_queue_dispatch(); $cron$);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'email_queue_wake: cron schedule failed: %', SQLERRM;
    END;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'edge_functions_url')
             || '/throulyscout-process-email-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'email_queue_wake failed (enqueue preserved): %', SQLERRM;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION throulyscout.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.email_queue_dispatch() TO service_role;
REVOKE ALL ON FUNCTION throulyscout.email_queue_wake() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.email_queue_wake() TO service_role;

DROP TRIGGER IF EXISTS email_queue_wake_auth ON pgmq.q_auth_emails;
CREATE TRIGGER email_queue_wake_auth
  AFTER INSERT ON pgmq.q_auth_emails
  FOR EACH STATEMENT EXECUTE FUNCTION throulyscout.email_queue_wake();

DROP TRIGGER IF EXISTS email_queue_wake_transactional ON pgmq.q_transactional_emails;
CREATE TRIGGER email_queue_wake_transactional
  AFTER INSERT ON pgmq.q_transactional_emails
  FOR EACH STATEMENT EXECUTE FUNCTION throulyscout.email_queue_wake();
