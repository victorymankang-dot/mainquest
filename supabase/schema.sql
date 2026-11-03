-- Templum Salutis — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Safe to re-run.

-- 1) Prayers (the "guestbook of intentions")
create table if not exists public.prayers (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  body         text not null check (char_length(body)  between 1 and 280),
  created_at   timestamptz not null default now()
);

alter table public.prayers enable row level security;

drop policy if exists "prayers are readable by everyone" on public.prayers;
create policy "prayers are readable by everyone"
  on public.prayers for select
  using (true);

drop policy if exists "signed-in users may add their own prayer" on public.prayers;
create policy "signed-in users may add their own prayer"
  on public.prayers for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can remove their own prayer" on public.prayers;
create policy "users can remove their own prayer"
  on public.prayers for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists prayers_created_at_idx
  on public.prayers (created_at desc);

-- 2) Done. No other tables needed: the pilgrim preference (monk/nun/child) is
-- stored in the user's auth metadata (supabase.auth.updateUser), not in a table.

-- Optional hardening (recommended for public release):
-- one prayer per signed-in user per 10 minutes, enforced server-side.
-- create or replace function public.throttle_prayers() returns trigger
-- language plpgsql security definer as $$
-- begin
--   if exists (select 1 from public.prayers
--              where user_id = auth.uid()
--                and created_at > now() - interval '10 minutes') then
--     raise exception 'Please wait before leaving another prayer.';
--   end if;
--   return new;
-- end $$;
-- drop trigger if exists prayers_throttle on public.prayers;
-- create trigger prayers_throttle before insert on public.prayers
--   for each row execute function public.throttle_prayers();
