'use client';

import { FormEvent, useEffect, useState } from 'react';

const STORAGE_KEY = 'hakpok119-reservations';
const ADMIN_AUTH_KEY = 'hakpok119-admin-authenticated';
const TEMP_ADMIN_PASSWORD = '1190';

const reservationStatuses = ['접수', '확인중', '상담확정', '상담완료', '수임검토', '종결'] as const;
const caseStatuses = ['접수', '조사중', '자료요청', '상담완료', '수임검토', '수임진행', '행정심판', '종결'] as const;
const managers = ['미지정', '대표행정사', '홍길동 행정사', '김행정 행정사'] as const;
const documentChecklist = [
  '학교폭력 신고서',
  '사실확인서',
  '진술서',
  '반성문',
  '탄원서',
  '생활기록부',
  '진단서',
  '증거자료',
  '기타자료',
] as const;

type ReservationStatus = (typeof reservationStatuses)[number];
type CaseStatus = (typeof caseStatuses)[number];
type Manager = (typeof managers)[number];
type ReservationSource = 'supabase' | 'localStorage';

type Reservation = {
  id: string;
  name: string;
  phone: string;
  consultationType: string;
  studentRole: string;
  preferredDate: string;
  preferredTime: string;
  summary: string;
  privacyAgreed: boolean;
  status: ReservationStatus;
  createdAt: string;
  updatedAt?: string;
  caseNumber?: string;
  caseStatus?: CaseStatus;
  manager?: Manager;
  adminMemo?: string;
  submittedDocuments?: string[];
  consultationLog?: string;
  diagnosisType?: string;
  diagnosisResultId?: string;
  diagnosisSummary?: string;
  source?: string;
  isDeleted?: boolean;
};

type ReservationRecord = Partial<Reservation> & {
  created_at?: string;
  updated_at?: string;
  consultation_type?: string;
  student_type?: string;
  studentRole?: string;
  preferred_date?: string;
  preferred_time?: string;
  privacy_agreed?: boolean;
  reservation_status?: string;
  case_number?: string;
  case_status?: string;
  admin_memo?: string;
  submitted_documents?: string[];
  consultation_log?: string;
  diagnosis_type?: string;
  diagnosis_result_id?: string;
  diagnosis_summary?: string;
  is_deleted?: boolean;
};

const isReservationStatus = (value: unknown): value is ReservationStatus => {
  return typeof value === 'string' && reservationStatuses.includes(value as ReservationStatus);
};

const isCaseStatus = (value: unknown): value is CaseStatus => {
  return typeof value === 'string' && caseStatuses.includes(value as CaseStatus);
};

const isManager = (value: unknown): value is Manager => {
  return typeof value === 'string' && managers.includes(value as Manager);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const createCaseNumber = (year: number, index: number) => {
  return `HP${year}-${String(index + 1).padStart(4, '0')}`;
};

const normalizeReservation = (reservation: ReservationRecord, index: number): Reservation => {
  const year = new Date().getFullYear();
  const status = reservation.reservation_status ?? reservation.status;
  const caseStatus = reservation.case_status ?? reservation.caseStatus;
  const manager = reservation.manager;

  return {
    id: reservation.id ?? `${Date.now()}-${index}`,
    name: reservation.name ?? '',
    phone: reservation.phone ?? '',
    consultationType: reservation.consultation_type ?? reservation.consultationType ?? '',
    studentRole: reservation.student_type ?? reservation.studentRole ?? '',
    preferredDate: reservation.preferred_date ?? reservation.preferredDate ?? '',
    preferredTime: reservation.preferred_time ?? reservation.preferredTime ?? '',
    summary: reservation.summary ?? '',
    privacyAgreed: reservation.privacy_agreed ?? reservation.privacyAgreed ?? false,
    status: isReservationStatus(status) ? status : '접수',
    createdAt: reservation.created_at ?? reservation.createdAt ?? new Date().toISOString(),
    updatedAt: reservation.updated_at ?? reservation.updatedAt,
    caseNumber: reservation.case_number ?? reservation.caseNumber ?? createCaseNumber(year, index),
    caseStatus: isCaseStatus(caseStatus) ? caseStatus : '접수',
    manager: isManager(manager) ? manager : '미지정',
    adminMemo: reservation.admin_memo ?? reservation.adminMemo ?? '',
    submittedDocuments: Array.isArray(reservation.submitted_documents)
      ? reservation.submitted_documents
      : Array.isArray(reservation.submittedDocuments)
        ? reservation.submittedDocuments
        : [],
    consultationLog: reservation.consultation_log ?? reservation.consultationLog ?? '',
    diagnosisType: reservation.diagnosis_type ?? reservation.diagnosisType,
    diagnosisResultId: reservation.diagnosis_result_id ?? reservation.diagnosisResultId,
    diagnosisSummary: reservation.diagnosis_summary ?? reservation.diagnosisSummary,
    source: reservation.source,
    isDeleted: reservation.is_deleted ?? reservation.isDeleted ?? false,
  };
};

const normalizeReservations = (reservations: ReservationRecord[]) => {
  return reservations.map((reservation, index) => normalizeReservation(reservation, index));
};

const readLocalReservations = () => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    return normalizeReservations(JSON.parse(saved) as ReservationRecord[]);
  } catch {
    return [];
  }
};

const readSupabaseReservations = async () => {
  const { supabase } = await import('../../lib/supabase');
  const { data, error } = await supabase
    .from('reservations')
    .select(
      [
        'id',
        'created_at',
        'updated_at',
        'name',
        'phone',
        'consultation_type',
        'student_type',
        'preferred_date',
        'preferred_time',
        'summary',
        'privacy_agreed',
        'reservation_status',
        'case_number',
        'case_status',
        'manager',
        'admin_memo',
        'submitted_documents',
        'consultation_log',
        'diagnosis_type',
        'diagnosis_result_id',
        'diagnosis_summary',
        'source',
        'is_deleted',
      ].join(', ')
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeReservations((data ?? []) as ReservationRecord[]);
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [reservationSource, setReservationSource] = useState<ReservationSource>('localStorage');
  const [loadMessage, setLoadMessage] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    setIsAuthenticated(sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true');
    setIsAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    const loadReservations = async () => {
      setIsLoadingReservations(true);
      setLoadMessage('');

      try {
        const supabaseReservations = await readSupabaseReservations();

        if (!isMounted) {
          return;
        }

        setReservations(supabaseReservations);
        setReservationSource('supabase');
        setLoadMessage('Supabase에서 불러온 예약 목록입니다.');
      } catch (error) {
        console.error('Failed to load reservations from Supabase:', error);

        if (!isMounted) {
          return;
        }

        const localReservations = readLocalReservations();
        setReservations(localReservations);
        setReservationSource('localStorage');
        setLoadMessage('Supabase 연결 실패로 이 브라우저의 임시 저장 데이터를 표시 중입니다.');
      } finally {
        if (isMounted) {
          setIsLoadingReservations(false);
        }
      }
    };

    loadReservations();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== TEMP_ADMIN_PASSWORD) {
      setAuthError('관리자 비밀번호가 올바르지 않습니다.');
      return;
    }

    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    setIsAuthenticated(true);
    setPassword('');
    setAuthError('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthenticated(false);
    setReservations([]);
    setLoadMessage('');
    setReservationSource('localStorage');
  };

  const updateReservation = (id: string, updates: Partial<Reservation>) => {
    setReservations((current) => {
      const next = current.map((reservation) => (reservation.id === id ? { ...reservation, ...updates } : reservation));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleDocument = (reservation: Reservation, documentName: string) => {
    const currentDocuments = reservation.submittedDocuments ?? [];
    const submittedDocuments = currentDocuments.includes(documentName)
      ? currentDocuments.filter((item) => item !== documentName)
      : [...currentDocuments, documentName];

    updateReservation(reservation.id, { submittedDocuments });
  };

  if (!isAuthChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md">
        <form onSubmit={handleLogin} className="card space-y-5">
          <div>
            <p className="text-sm font-bold text-point">hakpok119 관리자</p>
            <h1 className="mt-2 text-3xl font-black">관리자 접근</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              상담예약 및 사건관리 정보 보호를 위해 관리자 인증이 필요합니다.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold">관리자 비밀번호</span>
            <input
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setAuthError('');
              }}
              className="w-full rounded-lg border border-slate-300 p-3"
              placeholder="관리자 비밀번호"
              type="password"
            />
          </label>

          {authError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {authError}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full">
            관리자 로그인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-point">hakpok119 관리자</p>
          <h1 className="mt-2 text-3xl font-black">상담예약 임시 관리자</h1>
        </div>
        <button type="button" onClick={handleLogout} className="btn-outline">
          로그아웃
        </button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        현재 데이터는 Supabase 조회를 우선 사용하며, 연결 실패 시 브라우저 localStorage 임시 저장 데이터를 표시합니다.
      </div>

      {loadMessage ? (
        <div
          className={`rounded-lg border p-4 text-sm font-semibold ${
            reservationSource === 'supabase'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-sky-200 bg-sky-50 text-sky-800'
          }`}
        >
          {loadMessage}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">예약 및 상담사건 목록</h2>
          <p className="text-sm text-slate-500">총 {reservations.length}건</p>
        </div>

        {isLoadingReservations ? (
          <div className="card border-dashed text-center text-slate-500">예약 목록을 불러오는 중입니다.</div>
        ) : reservations.length === 0 ? (
          <div className="card border-dashed text-center text-slate-500">아직 접수된 상담예약이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <article key={reservation.id} className="card space-y-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-500">{formatDateTime(reservation.createdAt)}</p>
                        <h3 className="mt-1 text-2xl font-black">{reservation.name}</h3>
                      </div>
                      <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-black text-navy">
                        {reservation.caseNumber}
                      </div>
                    </div>

                    <dl className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="font-bold text-slate-500">연락처</dt>
                        <dd className="mt-1 font-semibold">{reservation.phone}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-500">상담유형</dt>
                        <dd className="mt-1 font-semibold">{reservation.consultationType}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-500">학생구분</dt>
                        <dd className="mt-1 font-semibold">{reservation.studentRole}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-500">희망일/시간</dt>
                        <dd className="mt-1 font-semibold">
                          {reservation.preferredDate} {reservation.preferredTime}
                        </dd>
                      </div>
                    </dl>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-500">상담요약</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{reservation.summary}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <label className="space-y-2">
                      <span className="text-sm font-bold">사건상태</span>
                      <select
                        value={reservation.caseStatus ?? '접수'}
                        onChange={(event) => updateReservation(reservation.id, { caseStatus: event.target.value as CaseStatus })}
                        className="w-full rounded-lg border border-slate-300 bg-white p-3"
                      >
                        {caseStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold">담당자</span>
                      <select
                        value={reservation.manager ?? '미지정'}
                        onChange={(event) => updateReservation(reservation.id, { manager: event.target.value as Manager })}
                        className="w-full rounded-lg border border-slate-300 bg-white p-3"
                      >
                        {managers.map((manager) => (
                          <option key={manager} value={manager}>
                            {manager}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold">예약상태</p>
                  <div className="flex flex-wrap gap-2">
                    {reservationStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateReservation(reservation.id, { status })}
                        className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                          reservation.status === status
                            ? 'border-navy bg-navy text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                  <div className="space-y-3">
                    <p className="text-sm font-bold">제출자료 체크리스트</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {documentChecklist.map((documentName) => (
                        <label
                          key={documentName}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold"
                        >
                          <input
                            checked={(reservation.submittedDocuments ?? []).includes(documentName)}
                            onChange={() => toggleDocument(reservation, documentName)}
                            className="h-4 w-4"
                            type="checkbox"
                          />
                          <span>{documentName}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <label className="space-y-2">
                      <span className="text-sm font-bold">관리자 메모</span>
                      <textarea
                        value={reservation.adminMemo ?? ''}
                        onChange={(event) => updateReservation(reservation.id, { adminMemo: event.target.value })}
                        className="min-h-28 w-full rounded-lg border border-slate-300 p-3"
                        placeholder="학생측 전화 완료, 반성문 작성 안내, 증거자료 요청, 학폭위 일정 확인 필요"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold">상담기록</span>
                      <textarea
                        value={reservation.consultationLog ?? ''}
                        onChange={(event) => updateReservation(reservation.id, { consultationLog: event.target.value })}
                        className="min-h-32 w-full rounded-lg border border-slate-300 p-3"
                        placeholder="1차 상담 내용, 추가 상담 필요사항, 학부모 요청사항 등을 기록하세요."
                      />
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
