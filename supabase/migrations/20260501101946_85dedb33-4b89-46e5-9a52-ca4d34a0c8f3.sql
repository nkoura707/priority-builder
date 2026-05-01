
-- Restrict client SELECT on sensitive token columns of locations.
-- RLS still scopes rows to the owner; column privileges block the token columns from being read by client roles.
-- Service role bypasses these grants, so edge functions are unaffected.

REVOKE SELECT ON public.locations FROM anon, authenticated;

GRANT SELECT (
  id,
  user_id,
  business_name,
  address,
  google_account_id,
  google_location_id,
  reply_tone,
  auto_reply_enabled,
  auto_reply_scope,
  auto_reply_min_minutes,
  auto_reply_max_minutes,
  created_at,
  updated_at
) ON public.locations TO anon, authenticated;

-- Allow client to write to all columns it needs during onboarding (tokens are written by client right after OAuth).
-- INSERT/UPDATE column privileges remain at table level; RLS still enforces ownership.
GRANT INSERT, UPDATE, DELETE ON public.locations TO authenticated;
