-- AI outputs schema.
-- Paste this file into the Supabase SQL Editor and run it once.

create extension if not exists pgcrypto;

create table if not exists public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  output_type text not null,
  title text not null,
  content text not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists ai_outputs_reservation_id_idx
on public.ai_outputs (reservation_id);

create index if not exists ai_outputs_output_type_idx
on public.ai_outputs (output_type);

create index if not exists ai_outputs_created_at_idx
on public.ai_outputs (created_at desc);

alter table public.ai_outputs enable row level security;

drop policy if exists "anon can insert ai outputs for admin ui"
on public.ai_outputs;

create policy "anon can insert ai outputs for admin ui"
on public.ai_outputs
for insert
to anon
with check (
  output_type <> ''
  and title <> ''
  and content <> ''
  and exists (
    select 1
    from public.reservations
    where reservations.id = ai_outputs.reservation_id
      and reservations.is_deleted = false
  )
);

drop policy if exists "anon can read ai outputs for admin ui"
on public.ai_outputs;

create policy "anon can read ai outputs for admin ui"
on public.ai_outputs
for select
to anon
using (
  exists (
    select 1
    from public.reservations
    where reservations.id = ai_outputs.reservation_id
      and reservations.is_deleted = false
  )
);

grant select, insert on public.ai_outputs to anon;

-- These policies are intentionally permissive for the current client-side
-- admin password MVP. Before production hardening, move AI output operations
-- behind Supabase Auth or server-side service-role APIs and narrow policies
-- to authenticated admin users.
