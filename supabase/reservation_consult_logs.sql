-- Reservation consultation logs schema.
-- Paste this file into the Supabase SQL Editor and run it once.

create extension if not exists pgcrypto;

create table if not exists public.reservation_consult_logs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  consultation_type text not null default '전화',
  content text not null,
  counselor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservation_consult_logs_reservation_id_idx
on public.reservation_consult_logs (reservation_id);

create index if not exists reservation_consult_logs_created_at_idx
on public.reservation_consult_logs (created_at desc);

create or replace function public.update_reservation_consult_logs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_reservation_consult_logs_updated_at
on public.reservation_consult_logs;

create trigger update_reservation_consult_logs_updated_at
before update on public.reservation_consult_logs
for each row
execute function public.update_reservation_consult_logs_updated_at();

alter table public.reservation_consult_logs enable row level security;

create policy "anon can read consult logs for admin ui"
on public.reservation_consult_logs
for select
to anon
using (true);

create policy "anon can insert consult logs for admin ui"
on public.reservation_consult_logs
for insert
to anon
with check (
  content <> ''
  and exists (
    select 1
    from public.reservations
    where reservations.id = reservation_consult_logs.reservation_id
      and reservations.is_deleted = false
  )
);

create policy "anon can update consult logs for admin ui"
on public.reservation_consult_logs
for update
to anon
using (true)
with check (content <> '');

create policy "anon can delete consult logs for admin ui"
on public.reservation_consult_logs
for delete
to anon
using (true);

grant select, insert, update, delete on public.reservation_consult_logs to anon;

-- These policies are intentionally permissive for the current client-side
-- admin password MVP. Before production hardening, move consultation log
-- operations behind Supabase Auth or server-side service-role APIs and narrow
-- policies to authenticated admin users.
