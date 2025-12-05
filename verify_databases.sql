-- Verify databases exist
SELECT datname FROM pg_database WHERE datname LIKE 'redcube%' ORDER BY datname;
