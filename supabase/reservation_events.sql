-- Reservation event calendar schema.
-- Paste this file into the Supabase SQL Editor and run it once.

create extension if not exists pgcrypto;

create table if not exists public.reservation_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  event_type text not null,
  title text not null,
  event_date date not null,
  event_time text,
  counselor text,
  memo text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservation_events_reservation_id_idx
on public.reservation_events (reservation_id);

create index if not exists reservation_events_event_date_idx
on public.reservation_events (event_date);

create index if not exists reservation_events_counselor_idx
on public.reservation_events (counselor);

create index if not exists reservation_events_completed_idx
on public.reservation_events (completed);

create or replace function public.update_reservation_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_reservation_events_updated_at
on public.reservation_events;

create trigger update_reservation_events_updated_at
before update on public.reservation_events
for each row
execute function public.update_reservation_events_updated_at();

alter table public.reservation_events enable row level security;

create policy "anon can read reservation events for admin ui"
on public.reservation_events
for select
to anon
using (true);

create policy "anon can insert reservation events for admin ui"
on public.reservation_events
for insert
to anon
with check (
  event_type <> ''
  and title <> ''
  and exists (
    select 1
    from public.reservations
    where reservations.id = reservation_events.reservation_id
      and reservations.is_deleted = false
  )
);

create policy "anon can update reservation events for admin ui"
on public.reservation_events
for update
to anon
using (true)
with check (event_type <> '' and title <> '');

create policy "anon can delete reservation events for admin ui"
on public.reservation_events
for delete
to anon
using (true);

grant select, insert, update, delete on public.reservation_events to anon;

-- These policies are intentionally permissive for the current client-side
-- admin password MVP. Before production hardening, move event operations
-- behind Supabase Auth or server-side service-role APIs and narrow policies
-- to authenticated admin users.
