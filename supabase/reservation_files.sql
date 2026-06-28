-- Reservation evidence files schema and storage setup.
-- Paste this file into the Supabase SQL Editor and run it once.

create extension if not exists pgcrypto;

create table if not exists public.reservation_files (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  file_size bigint not null check (file_size <= 31457280),
  mime_type text,
  uploaded_at timestamptz not null default now(),
  uploaded_by text not null default 'admin'
);

create index if not exists reservation_files_reservation_id_idx
on public.reservation_files (reservation_id);

create index if not exists reservation_files_uploaded_at_idx
on public.reservation_files (uploaded_at desc);

alter table public.reservation_files enable row level security;

create policy "anon can read reservation files for admin ui"
on public.reservation_files
for select
to anon
using (true);

create policy "anon can insert reservation files for admin ui"
on public.reservation_files
for insert
to anon
with check (
  uploaded_by = 'admin'
  and file_size <= 31457280
  and exists (
    select 1
    from public.reservations
    where reservations.id = reservation_files.reservation_id
      and reservations.is_deleted = false
  )
);

create policy "anon can delete reservation files for admin ui"
on public.reservation_files
for delete
to anon
using (true);

grant select, insert, delete on public.reservation_files to anon;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'reservation-files',
  'reservation-files',
  false,
  31457280,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/x-hwp',
    'application/haansofthwp',
    'application/vnd.hancom.hwp',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "anon can upload reservation files"
on storage.objects
for insert
to anon
with check (bucket_id = 'reservation-files');

create policy "anon can read reservation files"
on storage.objects
for select
to anon
using (bucket_id = 'reservation-files');

create policy "anon can delete reservation files"
on storage.objects
for delete
to anon
using (bucket_id = 'reservation-files');

-- These policies match the current client-side admin password MVP. Before
-- production hardening, move file operations behind Supabase Auth or
-- service-role server APIs and narrow access to authenticated admin users.
