-- =============================================
-- SUPABASE CRON SETUP FOR AUTO-UPDATE PRICES
-- TEMPLATE FILE
-- =============================================
-- INSTRUKSI:
-- 1. COPY file ini ke update-prices-cron.local.sql
-- 2. Ganti YOUR_PROJECT_ID dan YOUR_SERVICE_ROLE_KEY
-- 3. JALANKAN di Supabase SQL Editor
-- 4. JANGAN upload file .local.sql ke GitHub!
-- =============================================

-- Enable required extensions
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

CREATE EXTENSION pg_cron;
CREATE EXTENSION pg_net;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;

-- =============================================
-- ⚙️ KONFIGURASI - GANTI NILAI DI BAWAH INI
-- =============================================
DO $$
DECLARE
    -- GANTI DENGAN PROJECT ID ANDA
    supabase_project_id TEXT := 'YOUR_PROJECT_ID';

    -- GANTI DENGAN SERVICE ROLE KEY ANDA
    -- Settings > API > Service Role Key
    supabase_service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY';
BEGIN
    -- Monday - Thursday Morning Session (02:00 - 05:00 UTC)
    PERFORM cron.schedule(
      'update-prices-mon-thu-morning',
      '* 2-4 * * 1-4',
      format(
        $sql$
        SELECT net.http_post(
          url:='https://%s.supabase.co/functions/v1/update-prices',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
          timeout_milliseconds:=30000
        )
        $sql$,
        supabase_project_id,
        supabase_service_role_key
      )
    );

    -- Monday - Thursday Afternoon Session Part 1 (06:30 - 07:00 UTC)
    PERFORM cron.schedule(
      'update-prices-mon-thu-afternoon-1',
      '* 6 * * 1-4',
      format(
        $sql$
        SELECT net.http_post(
          url:='https://%s.supabase.co/functions/v1/update-prices',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
          timeout_milliseconds:=30000
        )
        $sql$,
        supabase_project_id,
        supabase_service_role_key
      )
    );

    -- Monday - Thursday Afternoon Session Part 2 (07:00 - 09:30 UTC)
    PERFORM cron.schedule(
      'update-prices-mon-thu-afternoon-2',
      '* 7-9 * * 1-4',
      format(
        $sql$
        SELECT net.http_post(
          url:='https://%s.supabase.co/functions/v1/update-prices',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
          timeout_milliseconds:=30000
        )
        $sql$,
        supabase_project_id,
        supabase_service_role_key
      )
    );

    -- Friday Morning Session (02:00 - 04:30 UTC)
    PERFORM cron.schedule(
      'update-prices-fri-morning',
      '* 2-3 * * 5',
      format(
        $sql$
        SELECT net.http_post(
          url:='https://%s.supabase.co/functions/v1/update-prices',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
          timeout_milliseconds:=30000
        )
        $sql$,
        supabase_project_id,
        supabase_service_role_key
      )
    );

    -- Friday Morning Session Last (04:00 - 04:30 UTC)
    PERFORM cron.schedule(
      'update-prices-fri-morning-last',
      '* 4 * * 5',
      format(
        $sql$
        SELECT net.http_post(
          url:='https://%s.supabase.co/functions/v1/update-prices',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
          timeout_milliseconds:=30000
        )
        $sql$,
        supabase_project_id,
        supabase_service_role_key
      )
    );

    -- Friday Afternoon Session (07:00 - 09:30 UTC)
    PERFORM cron.schedule(
      'update-prices-fri-afternoon',
      '* 7-9 * * 5',
      format(
        $sql$
        SELECT net.http_post(
          url:='https://%s.supabase.co/functions/v1/update-prices',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
          timeout_milliseconds:=30000
        )
        $sql$,
        supabase_project_id,
        supabase_service_role_key
      )
    );
END $$;

-- Verification
-- SELECT job_name, schedule FROM cron.job;
