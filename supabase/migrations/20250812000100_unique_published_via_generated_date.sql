-- Safer variant: use a generated column to avoid non-IMMUTABLE functions in index expressions

alter table public.logs
  add column if not exists created_on date generated always as (created_at::date) stored;

create unique index if not exists logs_one_published_per_day
  on public.logs (user_id, created_on)
  where is_published is true;


