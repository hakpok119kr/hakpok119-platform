'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'hakpok119-reservations';
const DIAGNOSIS_STORAGE_KEY_PREFIX = 'diagnosis-result';

type DiagnosisPayload = Record<string, unknown>;

type LinkedDiagnosis = {
  diagnosis_type: string | null;
  diagnosis_result_id: string;
  diagnosis_summary: string;
  diagnosis_payload: DiagnosisPayload;
};

const consultationTypes = ['10분 무료상담', '20분 상담', '30분 상담', '60분 상담'];
const studentRoles = ['피해학생 측', '가해학생 측', '학부모', '기타'];

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
  status: '접수';
  createdAt: string;
  diagnosis_type?: string | null;
  diagnosis_result_id?: string | null;
  diagnosis_summary?: string | null;
  diagnosis_payload?: DiagnosisPayload | null;
};

type ReservationForm = Omit<Reservation, 'id' | 'status' | 'createdAt'>;

type ReservationInsertPayload = {
  name: string;
  phone: string;
  consultation_type: string;
  student_type: string;
  preferred_date: string;
  preferred_time: string;
  summary: string;
  privacy_agreed: boolean;
  reservation_status: '접수';
  source: 'web';
  diagnosis_type?: string | null;
  diagnosis_result_id?: string | null;
  diagnosis_summary?: string | null;
  diagnosis_payload?: DiagnosisPayload | null;
};

const initialForm: ReservationForm = {
  name: '',
  phone: '',
  consultationType: consultationTypes[0],
  studentRole: studentRoles[0],
  preferredDate: '',
  preferredTime: '',
  summary: '',
  privacyAgreed: false,
};

const readReservations = () => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as Reservation[];
  } catch {
    return [];
  }
};

const saveReservationToLocalStorage = (reservation: Reservation) => {
  const reservations = readReservations();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([reservation, ...reservations]));
};

const isRecord = (value: unknown): value is DiagnosisPayload =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toText = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

const compactText = (value: unknown, maxLength = 80) => {
  const text = toText(value).replace(/\s+/g, ' ');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
};

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    const text = compactText(value);
    if (text) {
      return text;
    }
  }

  return '';
};

const textList = (value: unknown, maxItems = 3) => {
  if (Array.isArray(value)) {
    return value.map((item) => compactText(item, 36)).filter(Boolean).slice(0, maxItems);
  }

  const text = toText(value);
  if (!text) {
    return [];
  }

  return text
    .split(/\n|,|ㆍ|·/)
    .map((item) => compactText(item, 36))
    .filter(Boolean)
    .slice(0, maxItems);
};

const createDiagnosisSummary = (payload: DiagnosisPayload) => {
  const sections = isRecord(payload.resultSections) ? payload.resultSections : {};
  const inputDetails = isRecord(sections.inputDetails) ? sections.inputDetails : {};
  const diagnosisType = firstText(
    sections.diagnosisType,
    payload.type,
    payload.diagnosisCode,
    payload.resultType
  );
  const result = firstText(
    sections.diagnosisResult,
    sections.expectedMeasure,
    sections.riskLevel,
    sections.appealLevel,
    sections.possibility,
    sections.recordRiskLevel,
    sections.admissionImpactLevel,
    payload.result
  );
  const coreItems = [
    ...textList(sections.reasoningPoints),
    ...textList(sections.riskFactors),
    ...textList(sections.admissionImpactFactors),
    compactText(inputDetails.persistence),
    compactText(inputDetails.intentionality),
    compactText(inputDetails.severity),
    compactText(inputDetails.factSummary),
  ].filter(Boolean);

  return [
    `진단유형: ${diagnosisType || '무료진단'}`,
    `결과: ${result || '진단 결과 확인'}`,
    `핵심요약: ${coreItems.length ? coreItems.slice(0, 3).join(', ') : '입력 내용 및 판정 결과 확인'}`,
  ].join('\n');
};

const readLinkedDiagnosis = (resultId: string): LinkedDiagnosis | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = window.sessionStorage.getItem(`${DIAGNOSIS_STORAGE_KEY_PREFIX}:${resultId}`);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    const sections = isRecord(parsed.resultSections) ? parsed.resultSections : {};
    const diagnosisType = firstText(
      sections.diagnosisType,
      parsed.type,
      parsed.diagnosisCode,
      parsed.resultType
    );

    return {
      diagnosis_type: diagnosisType || null,
      diagnosis_result_id: resultId,
      diagnosis_summary: createDiagnosisSummary(parsed),
      diagnosis_payload: parsed,
    };
  } catch {
    return null;
  }
};

const toReservationInsertPayload = (reservation: Reservation): ReservationInsertPayload => ({
  name: reservation.name,
  phone: reservation.phone,
  consultation_type: reservation.consultationType,
  student_type: reservation.studentRole,
  preferred_date: reservation.preferredDate,
  preferred_time: reservation.preferredTime,
  summary: reservation.summary,
  privacy_agreed: reservation.privacyAgreed,
  reservation_status: '접수',
  source: 'web',
  diagnosis_type: reservation.diagnosis_type ?? null,
  diagnosis_result_id: reservation.diagnosis_result_id ?? null,
  diagnosis_summary: reservation.diagnosis_summary ?? null,
  diagnosis_payload: reservation.diagnosis_payload ?? null,
});

const saveReservation = async (reservation: Reservation) => {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { error } = await supabase.from('reservations').insert(toReservationInsertPayload(reservation));

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to save reservation to Supabase:', error);
    return false;
  }
};

export default function ReservationPage() {
  const [form, setForm] = useState<ReservationForm>(initialForm);
  const [linkedDiagnosis, setLinkedDiagnosis] = useState<LinkedDiagnosis | null>(null);
  const [message, setMessage] = useState('');

  const linkedDiagnosisDisplay = useMemo(
    () => linkedDiagnosis?.diagnosis_summary.split('\n').join(' / ') ?? '',
    [linkedDiagnosis]
  );

  useEffect(() => {
    const resultId = new URLSearchParams(window.location.search).get('diagnosisResultId');
    if (!resultId) {
      return;
    }

    setLinkedDiagnosis(readLinkedDiagnosis(resultId));
  }, []);

  const updateField = <K extends keyof ReservationForm>(key: K, value: ReservationForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextReservation: Reservation = {
      ...form,
      id: `${Date.now()}-${crypto.randomUUID()}`,
      status: '접수',
      createdAt: new Date().toISOString(),
      diagnosis_type: linkedDiagnosis?.diagnosis_type ?? null,
      diagnosis_result_id: linkedDiagnosis?.diagnosis_result_id ?? null,
      diagnosis_summary: linkedDiagnosis?.diagnosis_summary ?? null,
      diagnosis_payload: linkedDiagnosis?.diagnosis_payload ?? null,
    };

    const savedToSupabase = await saveReservation(nextReservation);
    saveReservationToLocalStorage(nextReservation);

    setForm(initialForm);
    setMessage(
      savedToSupabase
        ? '상담예약이 정상적으로 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.'
        : '일시적인 서버 오류가 발생했습니다. 예약은 이 브라우저에 임시 저장되었습니다.'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-point">hakpok119 상담예약</p>
        <h1 className="mt-2 text-3xl font-black">상담예약</h1>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      {linkedDiagnosis ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
          <p className="font-bold">무료진단 결과가 상담예약과 함께 전달됩니다.</p>
          <dl className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-600">진단유형</dt>
              <dd>{linkedDiagnosis.diagnosis_type ?? '무료진단'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">진단요약</dt>
              <dd>{linkedDiagnosisDisplay}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">결과 ID</dt>
              <dd>{linkedDiagnosis.diagnosis_result_id}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold">이름</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
              placeholder="예약자 이름"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">연락처</span>
            <input
              required
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
              placeholder="010-0000-0000"
              type="tel"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">상담유형</span>
            <select
              required
              value={form.consultationType}
              onChange={(event) => updateField('consultationType', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
            >
              {consultationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">학생 구분</span>
            <select
              required
              value={form.studentRole}
              onChange={(event) => updateField('studentRole', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
            >
              {studentRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">상담 희망일</span>
            <input
              required
              value={form.preferredDate}
              onChange={(event) => updateField('preferredDate', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
              type="date"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">상담 희망시간</span>
            <input
              required
              value={form.preferredTime}
              onChange={(event) => updateField('preferredTime', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
              type="time"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-bold">상담 내용 요약</span>
          <textarea
            required
            value={form.summary}
            onChange={(event) => updateField('summary', event.target.value)}
            className="min-h-36 w-full rounded-lg border border-slate-300 p-3"
            placeholder="상담받고 싶은 내용을 간단히 적어주세요."
          />
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <input
            required
            checked={form.privacyAgreed}
            onChange={(event) => updateField('privacyAgreed', event.target.checked)}
            className="mt-1 h-4 w-4"
            type="checkbox"
          />
          <span className="text-sm text-slate-700">
            개인정보 수집 및 이용에 동의합니다. 입력한 정보는 상담예약 확인 및 연락을 위해 저장됩니다.
          </span>
        </label>

        <button type="submit" className="btn-primary">
          예약 신청
        </button>
      </form>
    </div>
  );
}
