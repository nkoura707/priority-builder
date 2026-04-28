-- Enable scheduling + HTTP from Postgres
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Auto-reply settings on locations
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS auto_reply_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_min_minutes integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS auto_reply_max_minutes integer NOT NULL DEFAULT 360,
  ADD COLUMN IF NOT EXISTS auto_reply_scope text NOT NULL DEFAULT 'all';

-- Scheduled publish time on each review
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_reviews_scheduled_publish
  ON public.reviews (scheduled_publish_at)
  WHERE reply_status = 'pending' AND scheduled_publish_at IS NOT NULL;