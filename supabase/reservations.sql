-- hakpok119 reservations schema and MVP RLS policies.
-- Run this in the Supabase SQL Editor before testing Ver.1.4.

create extension if not exists pgcrypto;

create table if not exists public.reservations (
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

  reservation_status text not null default '접수',
  case_number text,
  case_status text not null default '상담대기',
  manager text not null default '',
  admin_memo text,
  submitted_documents text not null default '',
  consultation_log text,

  diagnosis_type text,
  diagnosis_result_id text,
  diagnosis_summary text,
  diagnosis_payload jsonb,

  source text not null default 'web',
  is_deleted boolean not null default false
);

alter table public.reservations
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists email text,
  add column if not exists product text,
  add column if not exists consultation_type text,
  add column if not exists student_type text,
  add column if not exists preferred_date text,
  add column if not exists preferred_time text,
  add column if not exists summary text,
  add column if not exists privacy_agreed boolean not null default false,
  add column if not exists reservation_status text not null default '접수',
  add column if not exists case_number text,
  add column if not exists case_status text not null default '상담대기',
  add column if not exists manager text not null default '',
  add column if not exists admin_memo text,
  add column if not exists submitted_documents text not null default '',
  add column if not exists consultation_log text,
  add column if not exists diagnosis_type text,
  add column if not exists diagnosis_result_id text,
  add column if not exists diagnosis_summary text,
  add column if not exists diagnosis_payload jsonb,
  add column if not exists source text not null default 'web',
  add column if not exists is_deleted boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservations'
      and column_name = 'submitted_documents'
      and data_type = 'ARRAY'
  ) then
    alter table public.reservations
      alter column submitted_documents drop default,
      alter column submitted_documents type text using array_to_string(submitted_documents, E'\n'),
      alter column submitted_documents set default '',
      alter column submitted_documents set not null;
  end if;
end $$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_reservations_updated_at on public.reservations;

create trigger update_reservations_updated_at
before update on public.reservations
for each row
execute function public.update_updated_at_column();

create index if not exists reservations_created_at_idx on public.reservations (created_at);
create index if not exists reservations_phone_idx on public.reservations (phone);
create index if not exists reservations_case_number_idx on public.reservations (case_number);
create index if not exists reservations_status_idx on public.reservations (reservation_status);
create index if not exists reservations_case_status_idx on public.reservations (case_status);
create index if not exists reservations_is_deleted_idx on public.reservations (is_deleted);

alter table public.reservations enable row level security;

drop policy if exists "anon can insert reservations" on public.reservations;
drop policy if exists "anon can read reservations for admin ui" on public.reservations;
drop policy if exists "anon can update reservations for admin ui" on public.reservations;

create policy "anon can insert reservations"
on public.reservations
for insert
to anon
with check (source = 'web' and is_deleted = false);

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

grant insert, select, update on public.reservations to anon;

-- Note: these policies are intentionally permissive for the current client-side
-- admin password MVP. Before production hardening, move admin reads/updates
-- behind Supabase Auth or server-side service-role APIs and narrow these policies.
