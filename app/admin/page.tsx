"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

const STORAGE_KEY = "hakpok119-reservations";
const ADMIN_AUTH_KEY = "hakpok119-admin-auth";
const ADMIN_PASSWORD = "119admin";

type DataSource = "supabase" | "local";

type Reservation = {
  id?: string;
  created_at?: string;
  createdAt?: string;
  name?: string;
  phone?: string;
  email?: string;
  product?: string;
  consultation_type?: string;
  consultationType?: string;
  student_type?: string;
  studentRole?: string;
  preferred_date?: string;
  preferredDate?: string;
  preferred_time?: string;
  preferredTime?: string;
  content?: string;
  summary?: string;
  privacy_agreed?: boolean;
  privacyAgreed?: boolean;
  reservation_status?: string;
  case_number?: string;
  case_status?: string;
  manager?: string;
  admin_memo?: string;
  submitted_documents?: string | string[];
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
const EVIDENCE_BUCKET = "reservation-files";
const MAX_EVIDENCE_FILE_SIZE = 30 * 1024 * 1024;
const allowedEvidenceExtensions = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp4",
  "mp3",
  "wav",
  "doc",
  "docx",
  "hwp",
]);

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
const caseTimelineSteps = [
  "접수",
  "자료요청",
  "자료검토",
  "1차상담",
  "심의준비",
  "심의완료",
  "행정심판검토",
  "종결",
];
const caseStatusOptions = ["상담대기", ...caseTimelineSteps];
const managerOptions = ["대표행정사", "학교폭력 행정팀", "김행정 행정사"];
const diagnosisTypeOptions = ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08"];
const consultationTypeOptions = ["전화", "방문", "화상", "문자", "기타"];

type ConsultLogForm = {
  consultation_type: string;
  counselor: string;
  content: string;
};

type ReservationFile = {
  id: string;
  reservation_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string | null;
  uploaded_at: string;
  uploaded_by?: string | null;
};

type ReservationConsultLog = {
  id: string;
  reservation_id: string;
  consultation_type: string;
  content: string;
  counselor?: string | null;
  created_at: string;
  updated_at: string;
};

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

function createConsultLogForm(counselor = ""): ConsultLogForm {
  return {
    consultation_type: "전화",
    counselor,
    content: "",
  };
}

function asText(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join("\n");
  }

  return String(value ?? "");
}

function normalizeReservation(reservation: Reservation): Reservation {
  return {
    ...reservation,
    created_at: reservation.created_at ?? reservation.createdAt ?? "",
    consultation_type: reservation.consultation_type ?? reservation.consultationType ?? "",
    student_type: reservation.student_type ?? reservation.studentRole ?? "",
    preferred_date: reservation.preferred_date ?? reservation.preferredDate ?? "",
    preferred_time: reservation.preferred_time ?? reservation.preferredTime ?? "",
    privacy_agreed: reservation.privacy_agreed ?? reservation.privacyAgreed ?? false,
    reservation_status: reservation.reservation_status || DEFAULT_RESERVATION_STATUS,
    case_number: reservation.case_number ?? "",
    case_status: reservation.case_status || DEFAULT_CASE_STATUS,
    manager: reservation.manager ?? "",
    admin_memo: reservation.admin_memo ?? "",
    submitted_documents: asText(reservation.submitted_documents),
    consultation_log: reservation.consultation_log ?? "",
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
      lastSequenceByDate.set(dateCode, Math.max(lastSequenceByDate.get(dateCode) ?? 0, Number(sequence)));
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
  const [dataSource, setDataSource] = useState<DataSource>("supabase");
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("");
  const [caseStatusFilter, setCaseStatusFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [diagnosisTypeFilter, setDiagnosisTypeFilter] = useState("");
  const [consultLogsByReservation, setConsultLogsByReservation] = useState<Record<string, ReservationConsultLog[]>>({});
  const [newConsultLogForms, setNewConsultLogForms] = useState<Record<string, ConsultLogForm>>({});
  const [editingConsultLogForms, setEditingConsultLogForms] = useState<Record<string, ConsultLogForm>>({});
  const [loadingConsultLogsId, setLoadingConsultLogsId] = useState<string | null>(null);
  const [savingConsultLogId, setSavingConsultLogId] = useState<string | null>(null);
  const [editingConsultLogId, setEditingConsultLogId] = useState<string | null>(null);
  const [deletingConsultLogId, setDeletingConsultLogId] = useState<string | null>(null);
  const [evidenceFilesByReservation, setEvidenceFilesByReservation] = useState<Record<string, ReservationFile[]>>({});
  const [selectedEvidenceFiles, setSelectedEvidenceFiles] = useState<Record<string, File | null>>({});
  const [loadingEvidenceId, setLoadingEvidenceId] = useState<string | null>(null);
  const [uploadingEvidenceId, setUploadingEvidenceId] = useState<string | null>(null);
  const [deletingEvidenceFileId, setDeletingEvidenceFileId] = useState<string | null>(null);
  const [evidenceInputVersion, setEvidenceInputVersion] = useState(0);

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

      if (reservationStatusFilter && reservation.reservation_status !== reservationStatusFilter) {
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
      } else if (diagnosisTypeFilter && getDiagnosisTypeCode(reservation.diagnosis_type) !== diagnosisTypeFilter) {
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

  useEffect(() => {
    if (!selectedReservation?.id || dataSource !== "supabase") {
      return;
    }

    initializeNewConsultLogForm(selectedReservation);
    void loadConsultLogs(selectedReservation.id);
    void loadEvidenceFiles(selectedReservation.id);
  }, [dataSource, selectedReservation?.id]);

  async function loadReservations() {
    setIsLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const nextReservations = normalizeReservations(data ?? []);
      setDataSource("supabase");
      setReservations(nextReservations);
      setSelectedId(nextReservations[0] ? getReservationKey(nextReservations[0]) : null);
      setMessage("Supabase reservations 테이블에서 데이터를 불러왔습니다.");
    } catch (error) {
      console.error("Failed to load reservations from Supabase:", error);
      const localReservations = normalizeReservations(readLocalReservations());
      setDataSource("local");
      setReservations(localReservations);
      setSelectedId(localReservations[0] ? getReservationKey(localReservations[0]) : null);
      setMessage("Supabase 조회에 실패해 localStorage fallback 데이터를 표시합니다.");
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

  function updateLocalField(reservation: Reservation, field: EditableReservationField, value: string) {
    setReservations((current) =>
      current.map((item) => (getReservationKey(item) === getReservationKey(reservation) ? { ...item, [field]: value } : item)),
    );
  }

  function updateSelectedEvidenceFile(reservation: Reservation, file?: File) {
    const key = getReservationKey(reservation);
    setSelectedEvidenceFiles((current) => ({
      ...current,
      [key]: file ?? null,
    }));
  }

  function initializeNewConsultLogForm(reservation: Reservation) {
    const key = getReservationKey(reservation);
    setNewConsultLogForms((current) => {
      if (current[key]) {
        return current;
      }

      return {
        ...current,
        [key]: createConsultLogForm(reservation.manager),
      };
    });
  }

  function updateNewConsultLogForm(reservation: Reservation, field: keyof ConsultLogForm, value: string) {
    const key = getReservationKey(reservation);
    setNewConsultLogForms((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? createConsultLogForm(reservation.manager)),
        [field]: value,
      },
    }));
  }

  function startEditConsultLog(log: ReservationConsultLog) {
    setEditingConsultLogId(log.id);
    setEditingConsultLogForms((current) => ({
      ...current,
      [log.id]: {
        consultation_type: log.consultation_type || "전화",
        counselor: log.counselor ?? "",
        content: log.content,
      },
    }));
  }

  function cancelEditConsultLog(logId: string) {
    setEditingConsultLogId(null);
    setEditingConsultLogForms((current) => {
      const next = { ...current };
      delete next[logId];
      return next;
    });
  }

  function updateEditingConsultLogForm(logId: string, field: keyof ConsultLogForm, value: string) {
    setEditingConsultLogForms((current) => ({
      ...current,
      [logId]: {
        ...(current[logId] ?? createConsultLogForm()),
        [field]: value,
      },
    }));
  }

  async function loadConsultLogs(reservationId: string) {
    setLoadingConsultLogsId(reservationId);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { data, error } = await supabase
        .from("reservation_consult_logs")
        .select("*")
        .eq("reservation_id", reservationId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setConsultLogsByReservation((current) => ({
        ...current,
        [reservationId]: (data ?? []) as ReservationConsultLog[],
      }));
    } catch (error) {
      console.error("Failed to load consult logs:", error);
      setMessage("상담기록 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingConsultLogsId(null);
    }
  }

  async function createConsultLog(reservation: Reservation) {
    const reservationId = reservation.id;

    if (!reservationId || dataSource !== "supabase") {
      setMessage("Supabase에 저장된 예약만 상담기록을 저장할 수 있습니다.");
      return;
    }

    if (!isUuid(reservationId)) {
      setMessage("상담기록 저장 실패: 예약 ID가 올바른 UUID 형식이 아닙니다.");
      return;
    }

    const key = getReservationKey(reservation);
    const form = newConsultLogForms[key] ?? createConsultLogForm(reservation.manager);
    const consultationType = form.consultation_type || "전화";
    const counselor = form.counselor.trim() || null;
    const content = form.content.trim();

    if (!content) {
      setMessage("상담내용을 입력해 주세요.");
      return;
    }

    setSavingConsultLogId("new");
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      console.log({
        reservationId,
        consultationType,
        counselor,
        content,
      });

      const { data, error } = await supabase
        .from("reservation_consult_logs")
        .insert({
          reservation_id: reservationId,
          consultation_type: consultationType,
          counselor,
          content,
        })
        .select("*");

      console.log({
        data,
        error,
      });

      if (error) {
        console.error(error);
        console.error(error.message);
        console.error(error.details);
        console.error(error.code);
        throw error;
      }

      const { data: refreshedLogs, error: refreshError } = await supabase
        .from("reservation_consult_logs")
        .select("*")
        .eq("reservation_id", reservationId)
        .order("created_at", { ascending: false });

      console.log({
        data: refreshedLogs,
        error: refreshError,
      });

      if (refreshError) {
        console.error(refreshError);
        console.error(refreshError.message);
        console.error(refreshError.details);
        console.error(refreshError.code);
        throw refreshError;
      }

      setNewConsultLogForms((current) => ({
        ...current,
        [key]: createConsultLogForm(reservation.manager),
      }));
      setConsultLogsByReservation((current) => ({
        ...current,
        [reservationId]: (refreshedLogs ?? []) as ReservationConsultLog[],
      }));
      setMessage("상담기록이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to create consult log:", error);
      setMessage(`상담기록 저장 실패: ${getSupabaseErrorMessage(error)}`);
    } finally {
      setSavingConsultLogId(null);
    }
  }

  async function updateConsultLog(log: ReservationConsultLog) {
    const form = editingConsultLogForms[log.id];

    if (!form?.content.trim()) {
      setMessage("상담내용을 입력해 주세요.");
      return;
    }

    setSavingConsultLogId(log.id);
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { error } = await supabase
        .from("reservation_consult_logs")
        .update({
          consultation_type: form.consultation_type || "전화",
          counselor: form.counselor.trim() || null,
          content: form.content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", log.id);

      if (error) {
        throw error;
      }

      cancelEditConsultLog(log.id);
      await loadConsultLogs(log.reservation_id);
      setMessage("상담기록이 수정되었습니다.");
    } catch (error) {
      console.error("Failed to update consult log:", error);
      setMessage("상담기록 수정에 실패했습니다.");
    } finally {
      setSavingConsultLogId(null);
    }
  }

  async function deleteConsultLog(log: ReservationConsultLog) {
    if (!window.confirm("상담기록을 삭제하시겠습니까?")) {
      return;
    }

    setDeletingConsultLogId(log.id);
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { error } = await supabase.from("reservation_consult_logs").delete().eq("id", log.id);

      if (error) {
        throw error;
      }

      setConsultLogsByReservation((current) => ({
        ...current,
        [log.reservation_id]: (current[log.reservation_id] ?? []).filter((item) => item.id !== log.id),
      }));
      setMessage("상담기록이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete consult log:", error);
      setMessage("상담기록 삭제에 실패했습니다.");
    } finally {
      setDeletingConsultLogId(null);
    }
  }

  async function loadEvidenceFiles(reservationId: string) {
    setLoadingEvidenceId(reservationId);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { data, error } = await supabase
        .from("reservation_files")
        .select("*")
        .eq("reservation_id", reservationId)
        .order("uploaded_at", { ascending: false });

      if (error) {
        throw error;
      }

      setEvidenceFilesByReservation((current) => ({
        ...current,
        [reservationId]: (data ?? []) as ReservationFile[],
      }));
    } catch (error) {
      console.error("Failed to load evidence files:", error);
      setMessage("증거자료 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingEvidenceId(null);
    }
  }

  async function uploadEvidenceFile(reservation: Reservation) {
    const key = getReservationKey(reservation);
    const file = selectedEvidenceFiles[key];

    if (!reservation.id || dataSource !== "supabase") {
      setMessage("Supabase에 저장된 예약만 증거자료를 업로드할 수 있습니다.");
      return;
    }

    if (!file) {
      setMessage("업로드할 증거자료 파일을 선택해 주세요.");
      return;
    }

    const extension = getFileExtension(file.name);
    if (!allowedEvidenceExtensions.has(extension)) {
      setMessage("지원하지 않는 파일 형식입니다.");
      return;
    }

    if (file.size > MAX_EVIDENCE_FILE_SIZE) {
      setMessage("증거자료 파일은 30MB 이하만 업로드할 수 있습니다.");
      return;
    }

    setUploadingEvidenceId(reservation.id);
    setMessage("");

    const supabase = getSupabaseClient();
    if (!supabase) {
      setUploadingEvidenceId(null);
      setMessage("Supabase 환경 변수가 없어 증거자료를 업로드할 수 없습니다.");
      return;
    }

    const safeFileName = sanitizeFileName(file.name);
    const storagePath = `${reservation.id}/${crypto.randomUUID()}-${safeFileName}`;
    const filePath = `${EVIDENCE_BUCKET}/${storagePath}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type || undefined,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: insertError } = await supabase.from("reservation_files").insert({
        reservation_id: reservation.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || null,
        uploaded_by: "admin",
      });

      if (insertError) {
        await supabase.storage.from(EVIDENCE_BUCKET).remove([storagePath]);
        throw insertError;
      }

      updateSelectedEvidenceFile(reservation);
      setEvidenceInputVersion((current) => current + 1);
      await loadEvidenceFiles(reservation.id);
      setMessage("증거자료가 업로드되었습니다.");
    } catch (error) {
      console.error("Failed to upload evidence file:", error);
      setMessage("증거자료 업로드에 실패했습니다.");
    } finally {
      setUploadingEvidenceId(null);
    }
  }

  async function downloadEvidenceFile(file: ReservationFile) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage("Supabase 환경 변수가 없어 증거자료를 다운로드할 수 없습니다.");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrl(getEvidenceStoragePath(file.file_path), 60);

      if (error) {
        throw error;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to download evidence file:", error);
      setMessage("증거자료 다운로드 링크를 만들지 못했습니다.");
    }
  }

  async function deleteEvidenceFile(file: ReservationFile) {
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage("Supabase 환경 변수가 없어 증거자료를 삭제할 수 없습니다.");
      return;
    }

    setDeletingEvidenceFileId(file.id);
    setMessage("");

    try {
      const { error: storageError } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .remove([getEvidenceStoragePath(file.file_path)]);

      if (storageError) {
        throw storageError;
      }

      const { error: deleteError } = await supabase.from("reservation_files").delete().eq("id", file.id);

      if (deleteError) {
        throw deleteError;
      }

      setEvidenceFilesByReservation((current) => ({
        ...current,
        [file.reservation_id]: (current[file.reservation_id] ?? []).filter((item) => item.id !== file.id),
      }));
      setMessage("증거자료가 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete evidence file:", error);
      setMessage("증거자료 삭제에 실패했습니다.");
    } finally {
      setDeletingEvidenceFileId(null);
    }
  }

  async function saveReservation(reservation: Reservation) {
    const key = getReservationKey(reservation);
    const payload = editableFields.reduce(
      (nextPayload, field) => ({
        ...nextPayload,
        [field]: asText(reservation[field]),
      }),
      {} as Record<EditableReservationField, string>,
    );

    setSavingId(key);
    setMessage("");

    if (dataSource === "supabase" && reservation.id) {
      const supabase = getSupabaseClient();

      if (supabase) {
        const { data, error } = await supabase
          .from("reservations")
          .update(payload)
          .eq("id", reservation.id)
          .select("*")
          .single();

        if (!error) {
          const updatedReservation = normalizeReservation(data as Reservation);
          setReservations((current) =>
            current.map((item) => (getReservationKey(item) === key ? updatedReservation : item)),
          );
          setMessage("사건관리 정보가 Supabase에 저장되었습니다.");
          setSavingId(null);
          return;
        }

        console.error("Failed to update reservation in Supabase:", error);
      }
    }

    setReservations((current) => {
      const nextReservations = current.map((item) =>
        getReservationKey(item) === key ? { ...item, ...payload } : item,
      );
      writeLocalReservations(nextReservations);
      return nextReservations;
    });
    setDataSource("local");
    setMessage("Supabase 저장에 실패해 localStorage fallback에 저장했습니다.");
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
            Supabase reservations 테이블을 기준으로 관리하고, 장애 시 localStorage fallback을 사용합니다.
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
            <div className="card text-sm text-slate-600">검색 조건에 맞는 상담예약이 없습니다.</div>
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
                <Info label="상담상품" value={selectedReservation.product ?? selectedReservation.consultation_type} />
                <Info
                  label="희망일시"
                  value={[selectedReservation.preferred_date, selectedReservation.preferred_time].filter(Boolean).join(" ")}
                />
                <Info label="접수일" value={formatDate(selectedReservation.created_at)} />
                <Info label="학생구분" value={selectedReservation.student_type} />
                <Info label="상담요약" value={selectedReservation.summary} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="예약상태">
                  <select
                    className="w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) => updateLocalField(selectedReservation, "reservation_status", event.target.value)}
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
                    onChange={(event) => updateLocalField(selectedReservation, "case_number", event.target.value)}
                    value={selectedReservation.case_number || ""}
                  />
                </Field>
                <Field label="사건상태">
                  <select
                    className="w-full rounded-xl border border-slate-300 p-3"
                    onChange={(event) => updateLocalField(selectedReservation, "case_status", event.target.value)}
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
                    onChange={(event) => updateLocalField(selectedReservation, "manager", event.target.value)}
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
                    onChange={(event) => updateLocalField(selectedReservation, "submitted_documents", event.target.value)}
                    value={asText(selectedReservation.submitted_documents)}
                  />
                </Field>
              </div>

              <DiagnosisResult reservation={selectedReservation} />
              <ConsultationLogSection
                deletingLogId={deletingConsultLogId}
                editingLogForms={editingConsultLogForms}
                editingLogId={editingConsultLogId}
                isLoading={loadingConsultLogsId === selectedReservation.id}
                isSupabaseReservation={dataSource === "supabase" && isUuid(selectedReservation.id)}
                logs={selectedReservation.id ? consultLogsByReservation[selectedReservation.id] ?? [] : []}
                newLogForm={
                  newConsultLogForms[getReservationKey(selectedReservation)] ??
                  createConsultLogForm(selectedReservation.manager)
                }
                onCancelEdit={cancelEditConsultLog}
                onChangeEdit={updateEditingConsultLogForm}
                onChangeNew={(field, value) => updateNewConsultLogForm(selectedReservation, field, value)}
                onCreate={() => createConsultLog(selectedReservation)}
                onDelete={deleteConsultLog}
                onStartEdit={startEditConsultLog}
                onUpdate={updateConsultLog}
                reservation={selectedReservation}
                savingLogId={savingConsultLogId}
              />
              <CaseTimeline caseStatus={selectedReservation.case_status} />
              <EvidenceFilesSection
                deletingFileId={deletingEvidenceFileId}
                files={selectedReservation.id ? evidenceFilesByReservation[selectedReservation.id] ?? [] : []}
                isLoading={loadingEvidenceId === selectedReservation.id}
                isSupabaseReservation={dataSource === "supabase" && Boolean(selectedReservation.id)}
                isUploading={uploadingEvidenceId === selectedReservation.id}
                onDelete={deleteEvidenceFile}
                onDownload={downloadEvidenceFile}
                onFileChange={(file) => updateSelectedEvidenceFile(selectedReservation, file)}
                onUpload={() => uploadEvidenceFile(selectedReservation)}
                selectedFile={selectedEvidenceFiles[getReservationKey(selectedReservation)] ?? null}
                uploadInputKey={`${getReservationKey(selectedReservation)}-${evidenceInputVersion}`}
              />
              <AdminMemoSection
                onChange={(value) => updateLocalField(selectedReservation, "admin_memo", value)}
                value={selectedReservation.admin_memo || ""}
              />

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

function ConsultationLogSection({
  deletingLogId,
  editingLogForms,
  editingLogId,
  isLoading,
  isSupabaseReservation,
  logs,
  newLogForm,
  onCancelEdit,
  onChangeEdit,
  onChangeNew,
  onCreate,
  onDelete,
  onStartEdit,
  onUpdate,
  reservation,
  savingLogId,
}: {
  deletingLogId: string | null;
  editingLogForms: Record<string, ConsultLogForm>;
  editingLogId: string | null;
  isLoading: boolean;
  isSupabaseReservation: boolean;
  logs: ReservationConsultLog[];
  newLogForm: ConsultLogForm;
  onCancelEdit: (logId: string) => void;
  onChangeEdit: (logId: string, field: keyof ConsultLogForm, value: string) => void;
  onChangeNew: (field: keyof ConsultLogForm, value: string) => void;
  onCreate: () => void;
  onDelete: (log: ReservationConsultLog) => void;
  onStartEdit: (log: ReservationConsultLog) => void;
  onUpdate: (log: ReservationConsultLog) => void;
  reservation: Reservation;
  savingLogId: string | null;
}) {
  const legacyLog = asText(reservation.consultation_log).trim();

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-black text-slate-800">상담기록 ({logs.length}건)</h2>
        <p className="text-xs font-bold text-slate-500">최신 상담기록이 위에 표시됩니다.</p>
      </div>

      {legacyLog ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-700">기존 상담기록</p>
          <pre className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-amber-900">
            {legacyLog}
          </pre>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-black text-slate-800">새 상담기록 입력</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="상담유형">
            <select
              className="w-full rounded-xl border border-slate-300 p-3"
              disabled={!isSupabaseReservation || savingLogId === "new"}
              onChange={(event) => onChangeNew("consultation_type", event.target.value)}
              value={newLogForm.consultation_type}
            >
              {consultationTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="담당자">
            <input
              className="w-full rounded-xl border border-slate-300 p-3"
              disabled={!isSupabaseReservation || savingLogId === "new"}
              onChange={(event) => onChangeNew("counselor", event.target.value)}
              value={newLogForm.counselor}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="상담내용">
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-300 p-3"
                disabled={!isSupabaseReservation || savingLogId === "new"}
                onChange={(event) => onChangeNew("content", event.target.value)}
                value={newLogForm.content}
              />
            </Field>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            className="btn-primary"
            disabled={!isSupabaseReservation || savingLogId === "new" || !newLogForm.content.trim()}
            onClick={onCreate}
            type="button"
          >
            {savingLogId === "new" ? "저장 중" : "상담기록 저장"}
          </button>
        </div>
        {!isSupabaseReservation ? (
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Supabase에 저장된 예약에서만 새 상담기록을 저장할 수 있습니다.
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          상담기록을 불러오는 중입니다.
        </p>
      ) : logs.length === 0 ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          등록된 상담기록이 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {logs.map((log, index) => {
            const isEditing = editingLogId === log.id;
            const editForm = editingLogForms[log.id] ?? {
              consultation_type: log.consultation_type || "전화",
              counselor: log.counselor ?? "",
              content: log.content,
            };

            return (
              <article className="rounded-xl border border-slate-200 bg-white p-4" key={log.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">상담 #{logs.length - index}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(log.created_at)}</p>
                  </div>
                  {!isEditing ? (
                    <div className="flex gap-2">
                      <button className="btn-outline px-3 py-2 text-xs" onClick={() => onStartEdit(log)} type="button">
                        수정
                      </button>
                      <button
                        className="btn-outline px-3 py-2 text-xs"
                        disabled={deletingLogId === log.id}
                        onClick={() => onDelete(log)}
                        type="button"
                      >
                        {deletingLogId === log.id ? "삭제 중" : "삭제"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Field label="상담유형">
                      <select
                        className="w-full rounded-xl border border-slate-300 p-3"
                        disabled={savingLogId === log.id}
                        onChange={(event) => onChangeEdit(log.id, "consultation_type", event.target.value)}
                        value={editForm.consultation_type}
                      >
                        {consultationTypeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="담당자">
                      <input
                        className="w-full rounded-xl border border-slate-300 p-3"
                        disabled={savingLogId === log.id}
                        onChange={(event) => onChangeEdit(log.id, "counselor", event.target.value)}
                        value={editForm.counselor}
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="상담내용">
                        <textarea
                          className="min-h-24 w-full rounded-xl border border-slate-300 p-3"
                          disabled={savingLogId === log.id}
                          onChange={(event) => onChangeEdit(log.id, "content", event.target.value)}
                          value={editForm.content}
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                      <button className="btn-outline" onClick={() => onCancelEdit(log.id)} type="button">
                        취소
                      </button>
                      <button
                        className="btn-primary"
                        disabled={savingLogId === log.id || !editForm.content.trim()}
                        onClick={() => onUpdate(log)}
                        type="button"
                      >
                        {savingLogId === log.id ? "저장 중" : "저장"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-xs font-bold text-slate-500">유형</dt>
                        <dd className="mt-1 font-semibold text-slate-800">{log.consultation_type || "전화"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-slate-500">담당</dt>
                        <dd className="mt-1 font-semibold text-slate-800">{log.counselor || "-"}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                      {log.content}
                    </p>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CaseTimeline({ caseStatus }: { caseStatus?: string }) {
  const currentStep = getTimelineCurrentStep(caseStatus);
  const currentStepIndex = caseTimelineSteps.indexOf(currentStep);
  const normalizedStatus = caseStatus?.trim() || DEFAULT_CASE_STATUS;
  const statusLabel = normalizedStatus === DEFAULT_CASE_STATUS ? "상담대기 · 1차상담 전" : normalizedStatus;

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-black text-slate-800">사건 진행 타임라인</h2>
        <p className="text-xs font-bold text-slate-500">현재 상태: {statusLabel}</p>
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {caseTimelineSteps.map((step, index) => {
          const isCurrent = step === currentStep;
          const isCompleted = currentStepIndex > index;

          return (
            <li
              className={`rounded-xl border p-3 ${
                isCurrent
                  ? "border-navy bg-white text-navy ring-2 ring-navy/10"
                  : isCompleted
                    ? "border-slate-300 bg-white text-slate-700"
                    : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
              key={step}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    isCurrent
                      ? "bg-navy text-white"
                      : isCompleted
                        ? "bg-slate-700 text-white"
                        : "bg-white text-slate-500"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-black">{step}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function EvidenceFilesSection({
  deletingFileId,
  files,
  isLoading,
  isSupabaseReservation,
  isUploading,
  onDelete,
  onDownload,
  onFileChange,
  onUpload,
  selectedFile,
  uploadInputKey,
}: {
  deletingFileId: string | null;
  files: ReservationFile[];
  isLoading: boolean;
  isSupabaseReservation: boolean;
  isUploading: boolean;
  onDelete: (file: ReservationFile) => void;
  onDownload: (file: ReservationFile) => void;
  onFileChange: (file?: File) => void;
  onUpload: () => void;
  selectedFile: File | null;
  uploadInputKey: string;
}) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800">증거자료</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            PDF, 이미지, 영상, 음성, 문서 파일을 30MB 이하로 업로드할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.mp3,.wav,.doc,.docx,.hwp"
            className="w-full rounded-xl border border-slate-300 bg-white p-2 text-sm sm:w-72"
            disabled={!isSupabaseReservation || isUploading}
            key={uploadInputKey}
            onChange={(event) => onFileChange(event.target.files?.[0])}
            type="file"
          />
          <button
            className="btn-primary whitespace-nowrap"
            disabled={!isSupabaseReservation || !selectedFile || isUploading}
            onClick={onUpload}
            type="button"
          >
            {isUploading ? "업로드 중" : "업로드"}
          </button>
        </div>
      </div>

      {!isSupabaseReservation ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          Supabase에 저장된 예약에서만 증거자료를 관리할 수 있습니다.
        </p>
      ) : isLoading ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          증거자료를 불러오는 중입니다.
        </p>
      ) : files.length === 0 ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          등록된 증거자료가 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-100 text-xs font-black text-slate-600">
              <tr>
                <th className="px-3 py-2">파일명</th>
                <th className="px-3 py-2">용량</th>
                <th className="px-3 py-2">등록일</th>
                <th className="px-3 py-2">다운로드</th>
                <th className="px-3 py-2">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="max-w-xs truncate px-3 py-2 font-semibold text-slate-800">{file.file_name}</td>
                  <td className="px-3 py-2 text-slate-600">{formatFileSize(file.file_size)}</td>
                  <td className="px-3 py-2 text-slate-600">{formatDate(file.uploaded_at)}</td>
                  <td className="px-3 py-2">
                    <button className="btn-outline px-3 py-2 text-xs" onClick={() => onDownload(file)} type="button">
                      다운로드
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="btn-outline px-3 py-2 text-xs"
                      disabled={deletingFileId === file.id}
                      onClick={() => onDelete(file)}
                      type="button"
                    >
                      {deletingFileId === file.id ? "삭제 중" : "삭제"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AdminMemoSection({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <Field label="관리자 메모">
        <textarea
          className="min-h-32 w-full rounded-xl border border-slate-300 p-3"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </Field>
    </section>
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
          <summary className="cursor-pointer text-sm font-bold text-slate-700">진단 원본 데이터 보기</summary>
          <p className="mt-2 text-xs text-slate-500">
            관리자 확인용 데이터입니다. 개인정보 취급에 유의해주세요.
          </p>
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

function formatConsultationLogDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.trim().toLowerCase() ?? "";
}

function sanitizeFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9가-힣._-]+/g, "-");
  const normalizedBaseName = baseName.replace(/^-+|-+$/g, "") || "file";

  return extension ? `${normalizedBaseName}.${extension}` : normalizedBaseName;
}

function getEvidenceStoragePath(filePath: string) {
  return filePath.startsWith(`${EVIDENCE_BUCKET}/`) ? filePath.slice(EVIDENCE_BUCKET.length + 1) : filePath;
}

function getSupabaseErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || "알 수 없는 오류");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error || "알 수 없는 오류");
}

function isUuid(value?: string | null) {
  return Boolean(
    value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
  );
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getTimelineCurrentStep(caseStatus?: string) {
  const normalizedStatus = caseStatus?.trim();

  if (!normalizedStatus || normalizedStatus === DEFAULT_CASE_STATUS) {
    return "접수";
  }

  if (caseTimelineSteps.includes(normalizedStatus)) {
    return normalizedStatus;
  }

  const legacyStatusMap: Record<string, string> = {
    조사중: "자료검토",
    상담완료: "1차상담",
    수임검토: "심의준비",
    수임진행: "심의준비",
    행정심판: "행정심판검토",
  };

  return legacyStatusMap[normalizedStatus] ?? "접수";
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
