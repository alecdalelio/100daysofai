-- Enforce at most one published log per calendar day (UTC) per user
-- Uses a partial UNIQUE index on (user_id, created_at::date) when is_published = true

create unique index if not exists logs_one_published_per_day
  on public.logs (user_id, (created_at::date))
  where is_published is true;


