# 학폭119 Supabase DB 설계 및 연결 준비 (Ver.1.7)

## 목적

Ver.1.6에서는 현재 브라우저 `localStorage`에 임시 저장 중인 상담예약 및 사건관리 데이터를 Supabase DB로 이전하기 위한 테이블 설계 문서와 SQL 초안을 추가했다.

Ver.1.7에서는 실제 insert/select/update/delete 구현 없이 Supabase 연결을 위한 기본 환경만 준비한다. 현재 상담예약과 관리자 사건관리 화면은 계속 `localStorage` 기반으로 동작한다.

## 현재 임시 저장 구조

- 현재 저장 위치: 브라우저 `localStorage`
- 현재 저장 key: `hakpok119-reservations`
- 현재 저장 방식은 Ver.1.7에서도 유지한다.

주요 데이터 범위:
- 상담예약 기본정보
- 예약상태
- 사건번호
- 사건상태
- 담당자
- 관리자 메모
- 제출자료 체크리스트
- 상담기록
- 향후 진단결과 연계 가능 정보

## Ver.1.7 Supabase 환경 준비

이번 단계에서 추가한 항목:
- `lib/supabase.ts`: 공통 Supabase client
- `.env.example`: Supabase 환경변수 예시

사용할 환경변수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

개발자는 실제 환경에서 `.env.local`에 위 값을 설정해야 한다.

예시:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

환경변수가 누락된 상태에서 `lib/supabase.ts`를 import하면 명확한 오류 메시지를 던지도록 구성했다. 단, Ver.1.7에서는 아직 앱 화면에서 Supabase client를 사용하지 않는다.

## MVP 1단계 테이블 구성

MVP 1단계에서는 `reservations` 테이블 하나로 시작한다.

현재 화면 구조가 상담예약과 사건관리 기능을 하나의 localStorage 객체로 관리하고 있으므로, 초기 DB 이전 단계에서도 하나의 테이블에 예약정보와 사건관리정보를 함께 저장한다. 이를 통해 Ver.1.8, Ver.1.9에서 기존 화면 흐름을 크게 바꾸지 않고 Supabase insert/select로 전환할 수 있다.

## reservations 테이블 주요 필드

예약정보:
- `name`
- `phone`
- `consultation_type`
- `student_type`
- `preferred_date`
- `preferred_time`
- `summary`
- `privacy_agreed`

예약상태:
- `reservation_status`

사건관리정보:
- `case_number`
- `case_status`
- `manager`
- `admin_memo`
- `submitted_documents`
- `consultation_log`

진단결과 연계 대비:
- `diagnosis_type`
- `diagnosis_result_id`
- `diagnosis_summary`
- `diagnosis_payload`

기타 관리 필드:
- `source`
- `is_deleted`
- `created_at`
- `updated_at`

## 추후 확장 방향

운영 기능이 커지면 다음과 같이 테이블을 분리할 수 있다.

- `cases`: 사건번호, 사건상태, 담당자, 사건 진행 단계 중심 관리
- `admin_users`: 관리자 계정, 역할, 권한 관리
- `consultation_logs`: 상담기록을 날짜별/상담자별로 누적 관리
- `reservation_documents`: 제출자료를 파일 업로드 및 검토 상태와 함께 관리
- `diagnosis_results`: 무료진단 결과와 상담예약/사건을 정식으로 연결

## 개인정보 보호 주의사항

상담예약 데이터에는 이름, 연락처, 상담내용, 사건 관련 민감 정보가 포함될 수 있다.

- 운영 전 반드시 접근 권한을 제한해야 한다.
- Supabase Row Level Security(RLS)를 반드시 적용해야 한다.
- 관리자 조회/수정 권한과 일반 사용자 입력 권한을 분리해야 한다.
- 상담기록, 관리자 메모, 진단 payload에는 민감한 학교폭력 사건 정보가 포함될 수 있으므로 로그 출력과 외부 노출을 최소화해야 한다.
- 실제 운영 전 개인정보 처리방침, 수집 동의 문구, 보관 기간 정책을 함께 점검해야 한다.

## RLS 적용 메모

현재 SQL은 MVP 개발용 초안이다. 운영 전에는 반드시 RLS 정책을 적용해야 한다.

필요한 정책 방향:
- 관리자만 예약 목록을 `select` 할 수 있어야 한다.
- 관리자만 예약 및 사건관리 필드를 `update` 할 수 있어야 한다.
- 일반 사용자는 본인 예약을 `insert` 할 수 있어야 한다.
- 일반 사용자의 전체 예약 목록 조회는 차단해야 한다.
- 삭제는 실제 삭제보다 `is_deleted` soft delete를 우선 고려한다.

## 단계별 전환 계획

### Ver.1.6

- DB 설계 문서와 SQL 초안 추가

### Ver.1.7

- Supabase client 설정
- 환경변수 예시 추가
- 실제 데이터 저장/조회 로직은 아직 연결하지 않음

### Ver.1.8

- 상담예약 저장을 Supabase insert로 전환
- localStorage fallback 유지

### Ver.1.9

- 관리자 목록 조회를 Supabase select로 전환
- localStorage fallback 유지

### Ver.2.0

- Supabase Auth + RLS 적용

## 현재 문서의 범위

이 문서는 Ver.1.7 기준 설계 및 연결 준비 문서다. 실제 Supabase 프로젝트 연결값, 인증, RLS 운영 정책, 데이터 마이그레이션 스크립트, 화면의 Supabase 연동은 이후 버전에서 별도로 구현한다.
