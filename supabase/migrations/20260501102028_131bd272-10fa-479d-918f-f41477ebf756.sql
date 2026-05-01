
-- Insert a placeholder; the real value will be updated via vault.update_secret right after.
SELECT vault.create_secret('PLACEHOLDER_REPLACE_ME', 'cron_secret', 'Shared secret used by pg_cron jobs to authenticate to cron-* edge functions');
