-- 학폭119 상담예약/사건관리 Supabase schema draft (Ver.1.6)
-- Supabase SQL Editor에서 실행 가능한 PostgreSQL SQL 초안입니다.
-- 실제 운영 전에는 RLS, 권한, 개인정보 보호 정책을 반드시 보완해야 합니다.

create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 예약정보
  name text not null,
  phone text not null,
  consultation_type text,
  student_type text,
  preferred_date text,
  preferred_time text,
  summary text,
  privacy_agreed boolean not null default false,

  -- 예약상태
  reservation_status text not null default '접수',

  -- 사건관리정보
  case_number text,
  case_status text not null default '접수',
  manager text not null default '미지정',
  admin_memo text,
  submitted_documents text[] not null default '{}',
  consultation_log text,

  -- 진단결과 연계 대비 필드
  diagnosis_type text,
  diagnosis_result_id text,
  diagnosis_summary text,
  diagnosis_payload jsonb,

  -- 기타
  source text not null default 'web',
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

-- RLS 초안 메모
-- 운영 전 public.reservations 테이블에 Row Level Security 활성화가 필요합니다.
-- 관리자만 select/update 가능하도록 정책을 추가해야 합니다.
-- 일반 사용자는 본인 예약 insert만 가능하도록 정책을 추가해야 합니다.
-- 현재 MVP 개발 중에는 정책 적용 전 테스트가 가능하지만, 운영 배포 전에는 반드시 보안정책을 확정해야 합니다.
--
-- 예시:
-- alter table public.reservations enable row level security;
-- create policy "Admins can read reservations" on public.reservations for select using (...);
-- create policy "Admins can update reservations" on public.reservations for update using (...);
-- create policy "Users can create reservations" on public.reservations for insert with check (...);
