"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

const STORAGE_KEY = "hakpok119-reservations";
const ADMIN_AUTH_KEY = "hakpok119-admin-auth";
const ADMIN_PASSWORD = "119admin";

type Reservation = {
  id?: string;
  created_at?: string;
  name?: string;
  phone?: string;
  email?: string;
  product?: string;
  preferred_date?: string;
  preferred_time?: string;
  content?: string;
  reservation_status?: string;
  case_number?: string;
  case_status?: string;
  manager?: string;
  admin_memo?: string;
  submitted_documents?: string;
  consultation_log?: string;
};

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

const reservationStatusOptions = ["접수", "확인중", "예약확정", "상담완료", "취소"];
const caseStatusOptions = ["미배정", "검토중", "진행중", "보완요청", "종결"];

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
  return editableFields.reduce(
    (normalized, field) => ({
      ...normalized,
      [field]: reservation[field] ?? "",
    }),
    reservation,
  );
}

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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

    const localReservations = readLocalReservations().map(normalizeReservation);

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setReservations(localReservations);
      setSelectedId(localReservations[0] ? getReservationKey(localReservations[0]) : null);
      setMessage("Supabase 조회에 실패해 localStorage 백업 데이터를 표시합니다.");
      setIsLoading(false);
      return;
    }

    const nextReservations = (data ?? []).map((reservation) =>
      normalizeReservation(reservation as Reservation),
    );

    setReservations(nextReservations);
    writeLocalReservations(nextReservations);
    setSelectedId(nextReservations[0] ? getReservationKey(nextReservations[0]) : null);
    setIsLoading(false);
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

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="space-y-3">
          {reservations.length === 0 ? (
            <div className="card text-sm text-slate-600">표시할 예약 데이터가 없습니다.</div>
          ) : (
            reservations.map((reservation) => {
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
                  <input
                    className="w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) =>
                      updateLocalField(selectedReservation, "manager", event.target.value)
                    }
                    value={selectedReservation.manager || ""}
                  />
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

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR");
}

function getReservationKey(reservation: Reservation) {
  return reservation.id || `${reservation.created_at || "local"}-${reservation.phone || "unknown"}`;
}
