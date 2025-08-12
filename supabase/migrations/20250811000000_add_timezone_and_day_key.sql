-- 1) Time zone on profile
alter table public.profiles
  add column if not exists time_zone text not null default 'UTC';

-- 2) Day key on logs (what day the entry counts toward)
alter table public.logs
  add column if not exists day_key date;

-- 3) Function: compute effective local day with 3h grace
create or replace function public.effective_day_for_user(p_user_id uuid)
returns date language plpgsql as $$
declare
  tz text;
  d  date;
begin
  select coalesce(time_zone, 'UTC') into tz
  from public.profiles where id = p_user_id;

  -- "Now" in user's TZ, subtract 3h, then take the date
  d := ( (now() at time zone tz) - interval '3 hours')::date;
  return d;
end $$;

-- 4) Trigger: when publishing, set day_key if null
create or replace function public.logs_set_day_key()
returns trigger language plpgsql as $$
begin
  if (new.is_published is true) and (new.day_key is null) then
    new.day_key := public.effective_day_for_user(new.user_id);
  end if;
  return new;
end $$;

drop trigger if exists trg_logs_set_day_key on public.logs;
create trigger trg_logs_set_day_key
before insert or update of is_published on public.logs
for each row execute function public.logs_set_day_key();

-- 5) One published log per calendar day per user
create unique index if not exists logs_unique_published_per_day
on public.logs (user_id, day_key)
where is_published = true;


