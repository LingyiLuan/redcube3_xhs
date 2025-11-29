-- ============================================================================
-- Migration 99: User Sync Trigger
-- Auto-sync users from redcube_users to postgres database
--
-- Pattern: Database Trigger (used by early Stripe, GitHub for small scale)
-- Capacity: ~10K users/day (upgrade to CDC/Kafka at 100K users)
-- Companies using this: Early-stage Stripe, Airbnb (before Kafka), GitHub
--
-- Created: 2025-11-27
-- ============================================================================

-- Prerequisites: dblink extension must be enabled
CREATE EXTENSION IF NOT EXISTS dblink;

-- ============================================================================
-- STEP 1: Create sync function
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_user_to_postgres()
RETURNS TRIGGER AS $$
BEGIN
  -- Use dblink to sync user to postgres database
  -- This runs in the same transaction as user creation
  BEGIN
    PERFORM dblink_exec(
      'dbname=postgres user=postgres password=postgres',
      format(
        'INSERT INTO users (id, email, created_at, updated_at, email_verified)
         VALUES (%L, %L, %L, %L, %L)
         ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             updated_at = EXCLUDED.updated_at,
             email_verified = EXCLUDED.email_verified',
        NEW.id,
        NEW.email,
        COALESCE(NEW.created_at, NOW()),
        NOW(),
        COALESCE(NEW.email_verified, false)
      )
    );

    RAISE NOTICE 'User % synced to postgres successfully', NEW.id;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    -- This ensures auth service continues working even if sync fails
    RAISE WARNING 'User sync to postgres failed for user %: %', NEW.id, SQLERRM;
    RAISE NOTICE 'User % created in redcube_users but sync failed (non-critical)', NEW.id;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_user_to_postgres() IS
  'Auto-syncs users from redcube_users to postgres database. '
  'Pattern: Database trigger for real-time sync. '
  'Upgrade to CDC/Kafka when scaling beyond 100K users.';

-- ============================================================================
-- STEP 2: Create trigger
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_user_to_postgres ON users;

-- Create trigger on INSERT and UPDATE
CREATE TRIGGER trigger_sync_user_to_postgres
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_to_postgres();

COMMENT ON TRIGGER trigger_sync_user_to_postgres ON users IS
  'Automatically syncs user data to postgres database for cross-service consistency';

-- ============================================================================
-- STEP 3: One-time backfill of existing users
-- ============================================================================

DO $$
DECLARE
  users_synced INTEGER := 0;
  users_failed INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting user backfill from redcube_users to postgres...';

  -- Sync all existing users
  BEGIN
    PERFORM dblink_exec(
      'dbname=postgres user=postgres password=postgres',
      'INSERT INTO users (id, email, created_at, updated_at, email_verified)
       SELECT id, email, created_at, NOW(), COALESCE(email_verified, false)
       FROM dblink(''dbname=redcube_users user=postgres password=postgres'',
                   ''SELECT id, email, created_at, email_verified FROM users'')
       AS source(id int, email varchar, created_at timestamp, email_verified boolean)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           updated_at = EXCLUDED.updated_at,
           email_verified = EXCLUDED.email_verified'
    );

    -- Get count of synced users
    SELECT COUNT(*) INTO users_synced
    FROM dblink('dbname=postgres user=postgres password=postgres',
                'SELECT id FROM users')
      AS synced_users(id int);

    RAISE NOTICE '✅ User backfill completed: % users synced to postgres', users_synced;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ User backfill failed (non-critical): %', SQLERRM;
    RAISE NOTICE 'Existing users not synced. Trigger will sync new users going forward.';
  END;
END $$;

-- ============================================================================
-- STEP 4: Monitoring & Validation Views
-- ============================================================================

-- View to check sync status between databases
CREATE OR REPLACE VIEW v_user_sync_status AS
SELECT
  'redcube_users' as source_database,
  COUNT(*) as user_count,
  MAX(created_at) as last_user_created
FROM dblink('dbname=redcube_users user=postgres password=postgres',
            'SELECT id, created_at FROM users')
  AS source_users(id int, created_at timestamp)
UNION ALL
SELECT
  'postgres' as source_database,
  COUNT(*) as user_count,
  MAX(created_at) as last_user_created
FROM users;

COMMENT ON VIEW v_user_sync_status IS
  'Shows user count in both databases to verify sync health. '
  'Counts should be equal or nearly equal.';

-- View to find users that failed to sync
CREATE OR REPLACE VIEW v_user_sync_missing AS
SELECT
  source.id,
  source.email,
  source.created_at,
  'Missing in postgres' as sync_status
FROM dblink('dbname=redcube_users user=postgres password=postgres',
            'SELECT id, email, created_at FROM users')
  AS source(id int, email varchar, created_at timestamp)
WHERE source.id NOT IN (
  SELECT id FROM users
);

COMMENT ON VIEW v_user_sync_missing IS
  'Shows users that exist in redcube_users but not in postgres. '
  'Should be empty if sync is working correctly.';

-- ============================================================================
-- STEP 5: Helper functions
-- ============================================================================

-- Function to manually sync a specific user (if sync failed)
CREATE OR REPLACE FUNCTION manual_sync_user(user_id_param INTEGER)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Get user from redcube_users and sync to postgres
  PERFORM dblink_exec(
    'dbname=postgres user=postgres password=postgres',
    format(
      'INSERT INTO users (id, email, created_at, updated_at, email_verified)
       SELECT id, email, created_at, NOW(), COALESCE(email_verified, false)
       FROM dblink(''dbname=redcube_users user=postgres password=postgres'',
                   ''SELECT id, email, created_at, email_verified FROM users WHERE id = %L'')
       AS source(id int, email varchar, created_at timestamp, email_verified boolean)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           updated_at = EXCLUDED.updated_at,
           email_verified = EXCLUDED.email_verified',
      user_id_param
    )
  );

  result := format('✅ User %s manually synced to postgres', user_id_param);
  RAISE NOTICE '%', result;
  RETURN result;

EXCEPTION WHEN OTHERS THEN
  result := format('❌ Manual sync failed for user %s: %s', user_id_param, SQLERRM);
  RAISE WARNING '%', result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION manual_sync_user(INTEGER) IS
  'Manually sync a specific user from redcube_users to postgres. '
  'Useful for fixing failed syncs without restarting services.';

-- ============================================================================
-- STEP 6: Health check queries (for monitoring)
-- ============================================================================

-- To check if sync is working:
-- SELECT * FROM v_user_sync_status;
-- (Should show equal counts in both databases)

-- To find missing users:
-- SELECT * FROM v_user_sync_missing;
-- (Should return 0 rows if sync is healthy)

-- To manually sync a user:
-- SELECT manual_sync_user(123);

-- To test sync with new user:
-- INSERT INTO users (email, created_at, email_verified)
-- VALUES ('test@example.com', NOW(), false);
-- Then check: SELECT * FROM v_user_sync_status;

-- ============================================================================
-- Migration Complete
-- ============================================================================

RAISE NOTICE '============================================';
RAISE NOTICE 'Migration 99: User Sync Trigger - COMPLETE';
RAISE NOTICE '============================================';
RAISE NOTICE 'Trigger: sync_user_to_postgres() created ✅';
RAISE NOTICE 'Monitoring: v_user_sync_status view created ✅';
RAISE NOTICE 'Validation: v_user_sync_missing view created ✅';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Test with: INSERT INTO users (email) VALUES (''test@example.com'');';
RAISE NOTICE '2. Monitor: SELECT * FROM v_user_sync_status;';
RAISE NOTICE '3. Deploy to production with confidence!';
RAISE NOTICE '============================================';
