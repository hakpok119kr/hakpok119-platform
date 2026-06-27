"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "hakpok119-reservations";
const ADMIN_AUTH_KEY = "hakpok119-admin-auth";
const ADMIN_PASSWORD = "119admin";

type Reservation = {
  id?: string;
  created_at?: string;
  createdAt?: string;
  name?: string;
  phone?: string;
  email?: string;
  product?: string;
  preferred_date?: string;
  preferred_time?: string;
  content?: string;
  summary?: string;
  reservation_status?: string;
  case_number?: string;
  case_status?: string;
  manager?: string;
  admin_memo?: string;
  submitted_documents?: string;
  consultation_log?: string;
  diagnosis_type?: string;
  diagnosisType?: string;
  diagnosis_result_id?: string;
  diagnosisResultId?: string;
  diagnosis_summary?: string;
  diagnosisSummary?: string;
  diagnosis_payload?: unknown;
  diagnosisPayload?: unknown;
};

const DEFAULT_RESERVATION_STATUS = "접수";
const DEFAULT_CASE_STATUS = "상담대기";

type EditableReservationField =
  | "reservation_status"
  | "case_number"
  | "case_status"
  | "manager"
  | "admin_memo"
  | "submitted_documents"
  | "consultation_log";

const editableFields: EditableReservationField[] = [
  "reservation_status",
  "case_number",
  "case_status",
  "manager",
  "admin_memo",
  "submitted_documents",
  "consultation_log",
];

const reservationStatusOptions = ["접수", "확인중", "상담확정", "상담완료", "수임검토", "종결"];
const caseStatusOptions = [
  "상담대기",
  "접수",
  "조사중",
  "자료요청",
  "상담완료",
  "수임검토",
  "수임진행",
  "행정심판",
  "종결",
];
const managerOptions = ["대표행정사", "홍길동 행정사", "김행정 행정사"];
const diagnosisTypeOptions = ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08"];

async function getSupabaseClient() {
  const { supabase } = await import("@/lib/supabase/client");
  return supabase;
}

function readLocalReservations() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Reservation[]) : [];
  } catch {
    return [];
  }
}

function writeLocalReservations(reservations: Reservation[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

function normalizeReservation(reservation: Reservation): Reservation {
  const normalizedEditableFields = editableFields.reduce(
    (normalized, field) => ({
      ...normalized,
      [field]: reservation[field] ?? "",
    }),
    reservation,
  );

  return {
    ...normalizedEditableFields,
    created_at: reservation.created_at ?? reservation.createdAt ?? "",
    reservation_status: reservation.reservation_status || DEFAULT_RESERVATION_STATUS,
    case_status: reservation.case_status || DEFAULT_CASE_STATUS,
    diagnosis_type: reservation.diagnosis_type ?? reservation.diagnosisType ?? "",
    diagnosis_result_id: reservation.diagnosis_result_id ?? reservation.diagnosisResultId ?? "",
    diagnosis_summary: reservation.diagnosis_summary ?? reservation.diagnosisSummary ?? "",
    diagnosis_payload: reservation.diagnosis_payload ?? reservation.diagnosisPayload ?? null,
  };
}

function normalizeReservations(reservations: Reservation[]) {
  const usedCaseNumbers = new Set<string>();
  const lastSequenceByDate = new Map<string, number>();

  reservations.forEach((reservation) => {
    const caseNumber = reservation.case_number?.trim();
    if (!caseNumber) {
      return;
    }

    usedCaseNumbers.add(caseNumber);
    const match = caseNumber.match(/^HP-(\d{8})-(\d{4})$/);
    if (match) {
      const [, dateCode, sequence] = match;
      lastSequenceByDate.set(
        dateCode,
        Math.max(lastSequenceByDate.get(dateCode) ?? 0, Number(sequence)),
      );
    }
  });

  return reservations.map((reservation) => {
    const normalizedReservation = normalizeReservation(reservation);
    if (normalizedReservation.case_number?.trim()) {
      return normalizedReservation;
    }

    const dateCode = getCaseNumberDateCode(normalizedReservation.created_at);
    let sequence = lastSequenceByDate.get(dateCode) ?? 0;
    let nextCaseNumber = "";

    do {
      sequence += 1;
      nextCaseNumber = `HP-${dateCode}-${String(sequence).padStart(4, "0")}`;
    } while (usedCaseNumbers.has(nextCaseNumber));

    usedCaseNumbers.add(nextCaseNumber);
    lastSequenceByDate.set(dateCode, sequence);

    return {
      ...normalizedReservation,
      case_number: nextCaseNumber,
    };
  });
}

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("");
  const [caseStatusFilter, setCaseStatusFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [diagnosisTypeFilter, setDiagnosisTypeFilter] = useState("");

  const filteredReservations = useMemo(() => {
    const keyword = normalizeSearchText(searchKeyword);

    return reservations.filter((reservation) => {
      if (keyword) {
        const searchableText = [
          reservation.name,
          reservation.phone,
          reservation.case_number,
          reservation.summary,
          reservation.admin_memo,
          reservation.consultation_log,
          reservation.diagnosis_summary,
        ]
          .map(normalizeSearchText)
          .join(" ");

        if (!searchableText.includes(keyword)) {
          return false;
        }
      }

      if (
        reservationStatusFilter &&
        reservation.reservation_status !== reservationStatusFilter
      ) {
        return false;
      }

      if (caseStatusFilter && reservation.case_status !== caseStatusFilter) {
        return false;
      }

      if (managerFilter === "미지정") {
        if (reservation.manager?.trim()) {
          return false;
        }
      } else if (managerFilter && reservation.manager !== managerFilter) {
        return false;
      }

      if (diagnosisTypeFilter === "진단없음") {
        if (getDiagnosisTypeCode(reservation.diagnosis_type)) {
          return false;
        }
      } else if (
        diagnosisTypeFilter &&
        getDiagnosisTypeCode(reservation.diagnosis_type) !== diagnosisTypeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    caseStatusFilter,
    diagnosisTypeFilter,
    managerFilter,
    reservationStatusFilter,
    reservations,
    searchKeyword,
  ]);

  const selectedReservation = useMemo(
    () => reservations.find((reservation) => getReservationKey(reservation) === selectedId),
    [reservations, selectedId],
  );

  useEffect(() => {
    setIsAuthed(window.localStorage.getItem(ADMIN_AUTH_KEY) === "true");
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    void loadReservations();
  }, [isAuthed]);

  async function loadReservations() {
    setIsLoading(true);
    setMessage("");

    const localReservations = normalizeReservations(readLocalReservations());

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const nextReservations = normalizeReservations(data ?? []);

      if (nextReservations.length === 0 && localReservations.length > 0) {
        setReservations(localReservations);
        setSelectedId(localReservations[0] ? getReservationKey(localReservations[0]) : null);
        writeLocalReservations(localReservations);
        return;
      }

      setReservations(nextReservations);
      if (nextReservations.length > 0) {
        writeLocalReservations(nextReservations);
      }
      setSelectedId(nextReservations[0] ? getReservationKey(nextReservations[0]) : null);
    } catch (error) {
      console.error("Failed to load reservations from Supabase:", error);
      setReservations(localReservations);
      setSelectedId(localReservations[0] ? getReservationKey(localReservations[0]) : null);
      if (localReservations.length > 0) {
        writeLocalReservations(localReservations);
      }
      setMessage("서버 예약정보를 불러오지 못해 브라우저 임시저장 데이터를 표시합니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== ADMIN_PASSWORD) {
      setMessage("관리자 비밀번호가 올바르지 않습니다.");
      return;
    }

    window.localStorage.setItem(ADMIN_AUTH_KEY, "true");
    setIsAuthed(true);
    setMessage("");
  }

  function updateLocalField(
    reservation: Reservation,
    field: EditableReservationField,
    value: string,
  ) {
    setReservations((current) => {
      const nextReservations = current.map((item) =>
        getReservationKey(item) === getReservationKey(reservation) ? { ...item, [field]: value } : item,
      );
      writeLocalReservations(nextReservations);
      return nextReservations;
    });
  }

  async function saveReservation(reservation: Reservation) {
    const key = getReservationKey(reservation);
    const payload = editableFields.reduce(
      (nextPayload, field) => ({
        ...nextPayload,
        [field]: reservation[field] ?? "",
      }),
      {} as Record<EditableReservationField, string>,
    );

    setSavingId(key);
    setMessage("");

    if (reservation.id) {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("reservations").update(payload).eq("id", reservation.id);

      if (error) {
        setMessage("Supabase 저장에 실패했습니다. localStorage 백업은 유지되었습니다.");
        setSavingId(null);
        return;
      }
    }

    setReservations((current) => {
      const nextReservations = current.map((item) =>
        getReservationKey(item) === key ? { ...item, ...payload } : item,
      );
      writeLocalReservations(nextReservations);
      return nextReservations;
    });

    setMessage(
      reservation.id
        ? "사건관리 정보가 Supabase와 localStorage에 저장되었습니다."
        : "id가 없어 localStorage 백업에만 저장되었습니다.",
    );
    setSavingId(null);
  }

  function resetFilters() {
    setSearchKeyword("");
    setReservationStatusFilter("");
    setCaseStatusFilter("");
    setManagerFilter("");
    setDiagnosisTypeFilter("");
  }

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-black">관리자 로그인</h1>
        <form className="card space-y-4" onSubmit={handleLogin}>
          <input
            className="w-full rounded-xl border border-slate-300 p-3"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="관리자 비밀번호"
            type="password"
            value={password}
          />
          <button className="btn-primary w-full" type="submit">
            로그인
          </button>
          {message ? <p className="text-sm font-semibold text-red-600">{message}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black">관리자 사건관리</h1>
          <p className="mt-2 text-sm text-slate-600">
            Supabase reservations 테이블과 localStorage 백업을 함께 관리합니다.
          </p>
        </div>
        <button className="btn-outline" disabled={isLoading} onClick={loadReservations} type="button">
          {isLoading ? "불러오는 중" : "새로고침"}
        </button>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          {message}
        </div>
      ) : null}

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(140px,1fr))_auto] lg:items-end">
          <Field label="검색">
            <input
              className="w-full rounded-xl border border-slate-300 p-3"
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="이름, 연락처, 사건번호, 상담요약 검색"
              value={searchKeyword}
            />
          </Field>
          <Field label="예약상태">
            <select
              className="w-full rounded-xl border border-slate-300 p-3"
              onChange={(event) => setReservationStatusFilter(event.target.value)}
              value={reservationStatusFilter}
            >
              <option value="">전체</option>
              {reservationStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="사건상태">
            <select
              className="w-full rounded-xl border border-slate-300 p-3"
              onChange={(event) => setCaseStatusFilter(event.target.value)}
              value={caseStatusFilter}
            >
              <option value="">전체</option>
              {caseStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="담당자">
            <select
              className="w-full rounded-xl border border-slate-300 p-3"
              onChange={(event) => setManagerFilter(event.target.value)}
              value={managerFilter}
            >
              <option value="">전체</option>
              <option value="미지정">미지정</option>
              {managerOptions.map((manager) => (
                <option key={manager} value={manager}>
                  {manager}
                </option>
              ))}
            </select>
          </Field>
          <Field label="진단유형">
            <select
              className="w-full rounded-xl border border-slate-300 p-3"
              onChange={(event) => setDiagnosisTypeFilter(event.target.value)}
              value={diagnosisTypeFilter}
            >
              <option value="">전체</option>
              {diagnosisTypeOptions.map((diagnosisType) => (
                <option key={diagnosisType} value={diagnosisType}>
                  {diagnosisType}
                </option>
              ))}
              <option value="진단없음">진단없음</option>
            </select>
          </Field>
          <button className="btn-outline whitespace-nowrap" onClick={resetFilters} type="button">
            필터 초기화
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          전체 {reservations.length}건 중 {filteredReservations.length}건 표시
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="space-y-3">
          {reservations.length === 0 ? (
            <div className="card text-sm text-slate-600">표시할 예약 데이터가 없습니다.</div>
          ) : filteredReservations.length === 0 ? (
            <div className="card text-sm text-slate-600">
              검색 조건에 맞는 상담예약이 없습니다.
            </div>
          ) : (
            filteredReservations.map((reservation) => {
              const key = getReservationKey(reservation);
              return (
                <button
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm ${
                    selectedId === key ? "border-navy ring-2 ring-navy/10" : "border-slate-200"
                  }`}
                  key={key}
                  onClick={() => setSelectedId(key)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-base">{reservation.name || "이름 없음"}</strong>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">
                      {reservation.reservation_status || "접수"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{reservation.phone || "연락처 없음"}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(reservation.created_at)}</p>
                </button>
              );
            })
          )}
        </section>

        <section className="card">
          {selectedReservation ? (
            <div>
              <div className="mb-6 grid gap-3 border-b border-slate-200 pb-5 md:grid-cols-2">
                <Info label="신청자" value={selectedReservation.name} />
                <Info label="연락처" value={selectedReservation.phone} />
                <Info label="이메일" value={selectedReservation.email} />
                <Info label="상담상품" value={selectedReservation.product} />
                <Info
                  label="희망일시"
                  value={[selectedReservation.preferred_date, selectedReservation.preferred_time]
                    .filter(Boolean)
                    .join(" ")}
                />
                <Info label="접수일" value={formatDate(selectedReservation.created_at)} />
              </div>

              <DiagnosisResult reservation={selectedReservation} />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="예약상태">
                  <select
                    className="w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) =>
                      updateLocalField(selectedReservation, "reservation_status", event.target.value)
                    }
                    value={selectedReservation.reservation_status || ""}
                  >
                    <option value="">선택</option>
                    {reservationStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="사건번호">
                  <input
                    className="w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) =>
                      updateLocalField(selectedReservation, "case_number", event.target.value)
                    }
                    value={selectedReservation.case_number || ""}
                  />
                </Field>
                <Field label="사건상태">
                  <select
                    className="w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) =>
                      updateLocalField(selectedReservation, "case_status", event.target.value)
                    }
                    value={selectedReservation.case_status || ""}
                  >
                    <option value="">선택</option>
                    {caseStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="담당자">
                  <select
                    className="w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) =>
                      updateLocalField(selectedReservation, "manager", event.target.value)
                    }
                    value={selectedReservation.manager || ""}
                  >
                    <option value="">미지정</option>
                    {managerOptions.map((manager) => (
                      <option key={manager} value={manager}>
                        {manager}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="제출서류">
                  <textarea
                    className="min-h-28 w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) =>
                      updateLocalField(selectedReservation, "submitted_documents", event.target.value)
                    }
                    value={selectedReservation.submitted_documents || ""}
                  />
                </Field>
                <Field label="상담기록">
                  <textarea
                    className="min-h-28 w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) =>
                      updateLocalField(selectedReservation, "consultation_log", event.target.value)
                    }
                    value={selectedReservation.consultation_log || ""}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="관리자 메모">
                    <textarea
                      className="min-h-32 w-full rounded-xl border border-slate-300 p-3"
                      onChange={(event) =>
                        updateLocalField(selectedReservation, "admin_memo", event.target.value)
                      }
                      value={selectedReservation.admin_memo || ""}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  className="btn-primary"
                  disabled={savingId === getReservationKey(selectedReservation)}
                  onClick={() => saveReservation(selectedReservation)}
                  type="button"
                >
                  {savingId === getReservationKey(selectedReservation) ? "저장 중" : "사건관리 저장"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">왼쪽에서 예약을 선택해주세요.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function DiagnosisResult({ reservation }: { reservation: Reservation }) {
  const diagnosisType = reservation.diagnosis_type || "";
  const diagnosisResultId = reservation.diagnosis_result_id || "";
  const diagnosisSummary = reservation.diagnosis_summary || "";
  const payloadText = formatDiagnosisPayload(reservation.diagnosis_payload);
  const hasDiagnosis = Boolean(diagnosisType || diagnosisResultId || diagnosisSummary || payloadText);

  if (!hasDiagnosis) {
    return (
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        무료진단 없이 접수된 상담예약입니다.
      </div>
    );
  }

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-sm font-black text-slate-800">연결된 무료진단 결과</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Info label="진단유형" value={diagnosisType} />
        <Info label="진단결과 ID" value={diagnosisResultId} />
        <Info label="진단요약" value={diagnosisSummary || "진단요약 없음"} />
      </div>
      {payloadText ? (
        <details className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-700">
            진단 원본 데이터 보기
          </summary>
          <p className="mt-2 text-xs text-slate-500">관리자 확인용 데이터입니다. 개인정보 취급에 유의해주세요.</p>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-xs leading-relaxed text-slate-100">
            {payloadText}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || "-"}</p>
    </div>
  );
}

function formatDiagnosisPayload(payload: unknown) {
  if (payload === null || payload === undefined || payload === "") {
    return "";
  }

  if (typeof payload === "string") {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR");
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getDiagnosisTypeCode(value?: string) {
  const match = value?.trim().toUpperCase().match(/^D0[1-8]/);
  return match?.[0] ?? "";
}

function getCaseNumberDateCode(value?: string) {
  const date = value ? new Date(value) : new Date();
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = validDate.getFullYear();
  const month = String(validDate.getMonth() + 1).padStart(2, "0");
  const day = String(validDate.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function getReservationKey(reservation: Reservation) {
  return reservation.id || `${reservation.created_at || "local"}-${reservation.phone || "unknown"}`;
}
