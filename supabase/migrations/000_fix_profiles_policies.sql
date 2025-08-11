-- Enable RLS and set strict policies on public.profiles
alter table if exists public.profiles enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
for select
using (true);

drop policy if exists profiles_upsert_own on public.profiles;
create policy profiles_upsert_own on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());


