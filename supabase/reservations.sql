-- hakpok119 reservations final schema for Supabase SQL Editor.
-- Paste this whole file into the SQL Editor and run it once.

create extension if not exists pgcrypto;

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  phone text not null,
  email text,
  product text,
  consultation_type text,
  student_type text,
  preferred_date text,
  preferred_time text,
  summary text,
  privacy_agreed boolean not null default false,

  reservation_status text not null default U&'\C811\C218',
  case_number text,
  case_status text not null default U&'\C0C1\B2F4\B300\AE30',
  manager text not null default '',
  admin_memo text,
  submitted_documents text not null default '',
  consultation_log text,

  diagnosis_type text,
  diagnosis_result_id text,
  diagnosis_summary text,
  diagnosis_payload jsonb,

  reservation_source text not null default 'web',
  is_deleted boolean not null default false
);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_reservations_updated_at
before update on public.reservations
for each row
execute function public.update_updated_at_column();

create index reservations_created_at_idx on public.reservations (created_at);
create index reservations_phone_idx on public.reservations (phone);
create index reservations_case_number_idx on public.reservations (case_number);
create index reservations_status_idx on public.reservations (reservation_status);
create index reservations_case_status_idx on public.reservations (case_status);
create index reservations_is_deleted_idx on public.reservations (is_deleted);

alter table public.reservations enable row level security;

create policy "anon can insert reservations"
on public.reservations
for insert
to anon
with check (reservation_source = 'web' and is_deleted = false);

create policy "anon can read reservations for admin ui"
on public.reservations
for select
to anon
using (is_deleted = false);

create policy "anon can update reservations for admin ui"
on public.reservations
for update
to anon
using (is_deleted = false)
with check (is_deleted = false);

grant usage on schema public to anon;
grant insert, select, update on public.reservations to anon;

-- These policies are intentionally permissive for the current client-side
-- admin password MVP. Before production hardening, move admin reads/updates
-- behind Supabase Auth or server-side service-role APIs and narrow the policies.
