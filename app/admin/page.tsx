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
const eventTypeOptions = [
  "상담예약",
  "전화상담",
  "방문상담",
  "화상상담",
  "자료요청",
  "자료제출",
  "의견서 작성",
  "의견서 제출",
  "학폭위 개최",
  "조치결정",
  "행정심판 검토",
  "행정심판 청구",
  "종결",
  "기타",
];

type ConsultLogForm = {
  consultation_type: string;
  counselor: string;
  content: string;
};

type ReservationEventForm = {
  event_type: string;
  title: string;
  event_date: string;
  event_time: string;
  counselor: string;
  memo: string;
  completed: boolean;
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

type ReservationEvent = {
  id: string;
  reservation_id: string;
  event_type: string;
  title: string;
  event_date: string;
  event_time?: string | null;
  counselor?: string | null;
  memo?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

type WorkflowSuggestion = {
  counselor: string;
  current_step: string;
  event_type: string;
  message: string;
  reservation_id: string;
  title: string;
};

type DashboardData = {
  events: ReservationEvent[];
  consultLogs: ReservationConsultLog[];
  fileCount: number | null;
};

type DashboardSummary = {
  totalReservations: number;
  todayReservations: number;
  activeCases: number;
  todayEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  consultLogs: number;
  fileCount: number | null;
};

type AiCaseInsight = {
  caseHealthScore: number;
  caseCompleteness: number;
  evidenceSufficiency: number;
  aiConfidence: number;
  actionRiskLevel: "낮음" | "보통" | "높음" | "매우높음";
  appealPotential: "낮음" | "보통" | "높음";
  missingItems: string[];
  priorityActions: string[];
  warnings: string[];
  analyzedAt: string;
  analysisReasons: {
    label: string;
    score: number;
    maxScore: number;
    reason: string;
    status: "충족" | "부족" | "확인필요";
  }[];
  overallOpinion: string;
  coachAdvice: {
    priority: string[];
    recommendations: string[];
    caution: string[];
    expectedNextStep: string;
  };
};

type AiEvidenceInsight = {
  evidenceScore: number;
  evidenceGrade: "A" | "B" | "C" | "D";
  registeredEvidenceTypes: string[];
  missingEvidence: string[];
  recommendedEvidence: string[];
  usageDirection: string[];
  cautions: string[];
  analyzedAt: string;
};

type AiDocumentReadiness = {
  readinessScore: number;
  readinessLevel: "부족" | "보통" | "작성가능" | "작성적합";
  availableDocuments: string[];
  notReadyDocuments: string[];
  missingRequirements: string[];
  recommendedOrder: string[];
  cautionPoints: string[];
  analyzedAt: string;
};

type AiOpinionDraft = {
  opinionType: "피해학생 측" | "가해학생 측" | "보호자" | "일반 의견서";
  readinessScore: number;
  readinessLevel: "작성보류" | "보완필요" | "초안작성가능";
  sections: {
    caseOverview: string[];
    partyPosition: string[];
    keyIssues: string[];
    evidenceAndReferences: string[];
    requests: string[];
    supplementItems: string[];
    cautions: string[];
  };
  draftText: string;
  analyzedAt: string;
};

type DetailSectionKey =
  | "reservationInfo"
  | "diagnosis"
  | "consultLogs"
  | "timeline"
  | "checklist"
  | "events"
  | "evidence"
  | "adminMemo";

const defaultDetailSectionOpen: Record<DetailSectionKey, boolean> = {
  reservationInfo: true,
  diagnosis: false,
  consultLogs: true,
  timeline: true,
  checklist: true,
  events: false,
  evidence: false,
  adminMemo: false,
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

function createReservationEventForm(counselor = ""): ReservationEventForm {
  return {
    event_type: "상담예약",
    title: "",
    event_date: "",
    event_time: "",
    counselor,
    memo: "",
    completed: false,
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
  const [consultLogFormOpen, setConsultLogFormOpen] = useState<Record<string, boolean>>({});
  const [editingConsultLogForms, setEditingConsultLogForms] = useState<Record<string, ConsultLogForm>>({});
  const [loadingConsultLogsId, setLoadingConsultLogsId] = useState<string | null>(null);
  const [savingConsultLogId, setSavingConsultLogId] = useState<string | null>(null);
  const [editingConsultLogId, setEditingConsultLogId] = useState<string | null>(null);
  const [deletingConsultLogId, setDeletingConsultLogId] = useState<string | null>(null);
  const [eventsByReservation, setEventsByReservation] = useState<Record<string, ReservationEvent[]>>({});
  const [newEventForms, setNewEventForms] = useState<Record<string, ReservationEventForm>>({});
  const [eventFormOpen, setEventFormOpen] = useState<Record<string, boolean>>({});
  const [editingEventForms, setEditingEventForms] = useState<Record<string, ReservationEventForm>>({});
  const [eventCounselorFilters, setEventCounselorFilters] = useState<Record<string, string>>({});
  const [loadingEventsId, setLoadingEventsId] = useState<string | null>(null);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [workflowSuggestions, setWorkflowSuggestions] = useState<Record<string, WorkflowSuggestion | null>>({});
  const [creatingWorkflowEventKey, setCreatingWorkflowEventKey] = useState<string | null>(null);
  const [evidenceFilesByReservation, setEvidenceFilesByReservation] = useState<Record<string, ReservationFile[]>>({});
  const [selectedEvidenceFiles, setSelectedEvidenceFiles] = useState<Record<string, File | null>>({});
  const [evidenceUploadOpen, setEvidenceUploadOpen] = useState<Record<string, boolean>>({});
  const [loadingEvidenceId, setLoadingEvidenceId] = useState<string | null>(null);
  const [uploadingEvidenceId, setUploadingEvidenceId] = useState<string | null>(null);
  const [deletingEvidenceFileId, setDeletingEvidenceFileId] = useState<string | null>(null);
  const [evidenceInputVersion, setEvidenceInputVersion] = useState(0);
  const [aiCaseSummaries, setAiCaseSummaries] = useState<Record<string, string>>({});
  const [aiCaseSummaryApiLoadingId, setAiCaseSummaryApiLoadingId] = useState<string | null>(null);
  const [aiCaseSummaryApiErrors, setAiCaseSummaryApiErrors] = useState<Record<string, string>>({});
  const [aiCaseInsights, setAiCaseInsights] = useState<Record<string, AiCaseInsight>>({});
  const [aiEvidenceInsights, setAiEvidenceInsights] = useState<Record<string, AiEvidenceInsight>>({});
  const [aiDocumentReadiness, setAiDocumentReadiness] = useState<Record<string, AiDocumentReadiness>>({});
  const [aiOpinionDrafts, setAiOpinionDrafts] = useState<Record<string, AiOpinionDraft>>({});
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    events: [],
    consultLogs: [],
    fileCount: null,
  });
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [openDetailSections, setOpenDetailSections] =
    useState<Record<DetailSectionKey, boolean>>(defaultDetailSectionOpen);

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

  const dashboardSummary = useMemo(
    () => createDashboardSummary(reservations, dashboardData),
    [dashboardData, reservations],
  );
  const selectedReservationKey = selectedReservation ? getReservationKey(selectedReservation) : "";
  const selectedConsultLogs = selectedReservation?.id
    ? consultLogsByReservation[selectedReservation.id] ?? []
    : [];
  const selectedEvents = selectedReservation?.id ? eventsByReservation[selectedReservation.id] ?? [] : [];
  const selectedReservationFiles = selectedReservation?.id
    ? evidenceFilesByReservation[selectedReservation.id] ?? []
    : [];

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
    initializeNewEventForm(selectedReservation);
    void loadConsultLogs(selectedReservation.id);
    void loadReservationEvents(selectedReservation.id);
    void loadEvidenceFiles(selectedReservation.id);
  }, [dataSource, selectedReservation?.id]);

  function toggleDetailSection(section: DetailSectionKey) {
    setOpenDetailSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function setConsultLogFormVisibility(reservation: Reservation, isOpen: boolean) {
    setConsultLogFormOpen((current) => ({
      ...current,
      [getReservationKey(reservation)]: isOpen,
    }));
  }

  function setEventFormVisibility(reservation: Reservation, isOpen: boolean) {
    setEventFormOpen((current) => ({
      ...current,
      [getReservationKey(reservation)]: isOpen,
    }));
  }

  function setEvidenceUploadVisibility(reservation: Reservation, isOpen: boolean) {
    setEvidenceUploadOpen((current) => ({
      ...current,
      [getReservationKey(reservation)]: isOpen,
    }));
  }

  function setWorkflowSuggestion(reservation: Reservation, nextEventType?: string | null, currentStatus?: string | null) {
    const reservationId = reservation.id;
    if (!reservationId || !nextEventType) {
      return;
    }
    const currentStep = getTimelineCurrentStep(
      currentStatus ?? getCurrentReservationById(reservationId)?.case_status ?? reservation.case_status,
    );

    setWorkflowSuggestions((current) => ({
      ...current,
      [reservationId]: {
        counselor: reservation.manager || "",
        current_step: currentStep,
        event_type: nextEventType,
        message: `다음 단계로 ${nextEventType} 일정을 생성하시겠습니까?`,
        reservation_id: reservationId,
        title: `${reservation.name || "예약자"} ${nextEventType}`,
      },
    }));
    setOpenDetailSections((current) => ({ ...current, events: true }));
  }

  async function promoteCaseStatusIfHigher(
    reservation: Reservation,
    targetStatus: string,
    successMessage: string,
  ): Promise<"changed" | "skipped" | "failed"> {
    const reservationId = reservation.id;
    const currentStatus = getCurrentReservationById(reservationId)?.case_status ?? reservation.case_status;

    if (getCaseStatusRank(targetStatus) <= getCaseStatusRank(currentStatus)) {
      return "skipped";
    }

    if (!reservationId || dataSource !== "supabase" || !isUuid(reservationId)) {
      setReservations((current) =>
        current.map((item) => (getReservationKey(item) === getReservationKey(reservation) ? { ...item, case_status: targetStatus } : item)),
      );
      setMessage(successMessage);
      return "changed";
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { error } = await supabase
        .from("reservations")
        .update({ case_status: targetStatus })
        .eq("id", reservationId);

      if (error) {
        throw error;
      }

      setReservations((current) =>
        current.map((item) => (item.id === reservationId ? { ...item, case_status: targetStatus } : item)),
      );
      setMessage(successMessage);
      return "changed";
    } catch (error) {
      console.error("Failed to auto promote case status:", error);
      setMessage("사건상태 자동 변경에 실패했습니다. 필요 시 수동으로 변경해주세요.");
      return "failed";
    }
  }

  function getCurrentReservationById(reservationId?: string | null) {
    return reservationId ? reservations.find((reservation) => reservation.id === reservationId) : undefined;
  }

  async function createSuggestedWorkflowEvent(suggestion: WorkflowSuggestion) {
    const reservation = getCurrentReservationById(suggestion.reservation_id);
    if (!reservation?.id || dataSource !== "supabase" || !isUuid(reservation.id)) {
      setMessage("다음 일정을 생성할 수 없습니다. 예약 정보를 다시 확인해주세요.");
      return;
    }

    const existingEvents = eventsByReservation[reservation.id] ?? [];
    if (existingEvents.some((event) => !event.completed && event.event_type === suggestion.event_type)) {
      setMessage("이미 동일한 미완료 일정이 있습니다.");
      return;
    }

    const createKey = `${reservation.id}-${suggestion.event_type}`;
    setCreatingWorkflowEventKey(createKey);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { data: duplicateEvents, error: duplicateError } = await supabase
        .from("reservation_events")
        .select("id")
        .eq("reservation_id", reservation.id)
        .eq("event_type", suggestion.event_type)
        .eq("completed", false)
        .limit(1);

      if (duplicateError) {
        throw duplicateError;
      }

      if ((duplicateEvents ?? []).length > 0) {
        setMessage("이미 동일한 미완료 일정이 있습니다.");
        return;
      }

      const { error } = await supabase.from("reservation_events").insert({
        reservation_id: reservation.id,
        event_type: suggestion.event_type,
        title: suggestion.title,
        event_date: getTodayDateCode(),
        event_time: null,
        counselor: suggestion.counselor || reservation.manager || null,
        memo: "자동 제안으로 생성된 일정입니다.",
        completed: false,
      });

      if (error) {
        throw error;
      }

      await loadReservationEvents(reservation.id);
      await loadDashboardData();
      setWorkflowSuggestions((current) => ({ ...current, [reservation.id as string]: null }));
      setMessage(`${suggestion.event_type} 일정이 생성되었습니다.`);
    } catch (error) {
      console.error("Failed to create suggested workflow event:", error);
      setMessage("다음 일정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setCreatingWorkflowEventKey(null);
    }
  }

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
      setMessage("예약 데이터를 불러왔습니다.");
      void loadDashboardData();
    } catch (error) {
      console.error("Failed to load reservations from Supabase:", error);
      const localReservations = normalizeReservations(readLocalReservations());
      setDataSource("local");
      setReservations(localReservations);
      setSelectedId(localReservations[0] ? getReservationKey(localReservations[0]) : null);
      setDashboardData({ events: [], consultLogs: [], fileCount: null });
      setMessage("예약 데이터를 불러오지 못해 임시 저장 데이터를 표시합니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDashboardData() {
    setIsDashboardLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const [eventsResult, consultLogsResult, filesResult] = await Promise.allSettled([
        supabase.from("reservation_events").select("*"),
        supabase.from("reservation_consult_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("reservation_files").select("id", { count: "exact", head: true }),
      ]);

      let nextEvents: ReservationEvent[] = [];
      let nextConsultLogs: ReservationConsultLog[] = [];
      let nextFileCount: number | null = null;

      if (eventsResult.status === "fulfilled") {
        if (eventsResult.value.error) {
          console.error(eventsResult.value.error);
        } else {
          nextEvents = (eventsResult.value.data ?? []) as ReservationEvent[];
        }
      } else {
        console.error(eventsResult.reason);
      }

      if (consultLogsResult.status === "fulfilled") {
        if (consultLogsResult.value.error) {
          console.error(consultLogsResult.value.error);
        } else {
          nextConsultLogs = (consultLogsResult.value.data ?? []) as ReservationConsultLog[];
        }
      } else {
        console.error(consultLogsResult.reason);
      }

      if (filesResult.status === "fulfilled") {
        if (filesResult.value.error) {
          console.error(filesResult.value.error);
        } else {
          nextFileCount = filesResult.value.count ?? 0;
        }
      } else {
        console.error(filesResult.reason);
      }

      setDashboardData({
        events: nextEvents,
        consultLogs: nextConsultLogs,
        fileCount: nextFileCount,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setDashboardData({ events: [], consultLogs: [], fileCount: null });
    } finally {
      setIsDashboardLoading(false);
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

  function selectReservationById(reservationId?: string | null) {
    if (!reservationId) {
      return;
    }

    const reservation = reservations.find((item) => item.id === reservationId);
    if (reservation) {
      setSelectedId(getReservationKey(reservation));
    }
  }

  function handleAiFeatureClick(feature: "summary" | "evidence" | "readiness" | "draft") {
    if (feature === "evidence") {
      handleGenerateAiEvidenceInsight(selectedReservationKey);
      return;
    }

    if (feature === "readiness") {
      handleGenerateAiDocumentReadiness(selectedReservationKey);
      return;
    }

    if (feature === "draft") {
      handleGenerateAiOpinionDraft(selectedReservationKey);
      return;
    }

    const notice = "Ver.2.0에서 제공 예정인 기능입니다.";
    setMessage(notice);
    window.alert(notice);
  }

  function handleGenerateAiCaseSummary(caseId: string) {
    const reservation = reservations.find((item) => getReservationKey(item) === caseId);

    if (!reservation) {
      setMessage("AI 사건요약을 생성할 사건을 찾을 수 없습니다.");
      return;
    }

    const reservationId = reservation.id;
    const logs = reservationId ? consultLogsByReservation[reservationId] ?? [] : [];
    const events = reservationId ? eventsByReservation[reservationId] ?? [] : [];
    const files = reservationId ? evidenceFilesByReservation[reservationId] ?? [] : [];
    const aiSummary = buildAiCaseSummary(reservation, logs, events, files);

    setAiCaseSummaries((current) => ({
      ...current,
      [caseId]: aiSummary,
    }));
    setMessage("AI 사건요약 초안이 생성되었습니다.");
  }

  async function handleGenerateAiCaseSummaryWithApi(caseId: string) {
    const reservation = reservations.find((item) => getReservationKey(item) === caseId);

    if (!reservation) {
      setMessage("AI 사건요약을 생성할 사건을 찾을 수 없습니다.");
      return;
    }

    const reservationId = reservation.id;
    const logs = reservationId ? consultLogsByReservation[reservationId] ?? [] : [];
    const events = reservationId ? eventsByReservation[reservationId] ?? [] : [];
    const files = reservationId ? evidenceFilesByReservation[reservationId] ?? [] : [];
    const privateValues = [reservation.name, reservation.phone, reservation.email].filter(hasText) as string[];
    const sourceText = createPrivateSafeCaseText(
      [
        reservation.consultation_log,
        reservation.content,
        reservation.summary,
        reservation.admin_memo,
        ...logs.map((log) => log.content),
      ],
      privateValues,
    );
    const keyIssues = getAiIssueKeywords(sourceText);

    setAiCaseSummaryApiLoadingId(caseId);
    setAiCaseSummaryApiErrors((current) => {
      const next = { ...current };
      delete next[caseId];
      return next;
    });

    try {
      const response = await fetch("/api/ai/case-summary", {
        body: JSON.stringify({
          caseStatus: reservation.case_status,
          consultationType: reservation.consultation_type ?? reservation.consultationType,
          evidenceTypes: Array.from(new Set(files.map(getEvidenceTypeLabel))),
          hasAdminMemo: hasText(reservation.admin_memo),
          hasConsultation: logs.length > 0 || hasText(reservation.consultation_log),
          hasEvents: events.length > 0,
          hasEvidence: files.length > 0,
          keyIssues: keyIssues.length > 0 ? keyIssues : createCaseTextSnippets(sourceText),
          studentRole: getGeneralizedPartyLabel(reservation.student_type ?? reservation.studentRole),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as { ok: boolean; result?: string; error?: string };

      if (!data.ok || !data.result) {
        const errorMessage = data.error ?? "AI 응답 생성 중 오류가 발생했습니다.";
        setAiCaseSummaryApiErrors((current) => ({ ...current, [caseId]: errorMessage }));
        setMessage(errorMessage);
        setAiCaseSummaryApiLoadingId((current) => (current === caseId ? null : current));
        return;
        setMessage(data.error ?? "AI 응답 생성 중 오류가 발생했습니다.");
        return;
      }

      setAiCaseSummaries((current) => ({
        ...current,
        [caseId]: data.result ?? "",
      }));
      setAiCaseSummaryApiLoadingId((current) => (current === caseId ? null : current));
      setMessage("OpenAI API 기반 AI 사건요약 초안이 생성되었습니다.");
    } catch {
      const errorMessage = "AI 응답 생성 중 오류가 발생했습니다.";
      setAiCaseSummaryApiErrors((current) => ({ ...current, [caseId]: errorMessage }));
      setMessage(errorMessage);
      setAiCaseSummaryApiLoadingId((current) => (current === caseId ? null : current));
      return;
      setMessage("AI 응답 생성 중 오류가 발생했습니다.");
    }
  }

  function handleGenerateAiCaseInsight(caseId: string) {
    const reservation = reservations.find((item) => getReservationKey(item) === caseId);

    if (!reservation) {
      setMessage("AI 사건분석을 생성할 사건을 찾을 수 없습니다.");
      return;
    }

    const reservationId = reservation.id;
    const logs = reservationId ? consultLogsByReservation[reservationId] ?? [] : [];
    const events = reservationId ? eventsByReservation[reservationId] ?? [] : [];
    const files = reservationId ? evidenceFilesByReservation[reservationId] ?? [] : [];
    const insight = buildAiCaseInsight(reservation, logs, events, files);

    setAiCaseInsights((current) => ({
      ...current,
      [caseId]: insight,
    }));
    setMessage("AI 사건분석 대시보드가 생성되었습니다.");
  }

  function handleGenerateAiEvidenceInsight(caseId: string) {
    const reservation = reservations.find((item) => getReservationKey(item) === caseId);

    if (!reservation) {
      setMessage("AI 증거분석을 생성할 사건을 찾을 수 없습니다.");
      return;
    }

    const reservationId = reservation.id;
    const logs = reservationId ? consultLogsByReservation[reservationId] ?? [] : [];
    const files = reservationId ? evidenceFilesByReservation[reservationId] ?? [] : [];
    const insight = buildAiEvidenceInsight(reservation, logs, files);

    setAiEvidenceInsights((current) => ({
      ...current,
      [caseId]: insight,
    }));
    setMessage("AI 증거분석 결과가 생성되었습니다.");
  }

  function handleGenerateAiDocumentReadiness(caseId: string) {
    const reservation = reservations.find((item) => getReservationKey(item) === caseId);

    if (!reservation) {
      setMessage("AI 문서작성 준비도를 생성할 사건을 찾을 수 없습니다.");
      return;
    }

    const reservationId = reservation.id;
    const logs = reservationId ? consultLogsByReservation[reservationId] ?? [] : [];
    const events = reservationId ? eventsByReservation[reservationId] ?? [] : [];
    const files = reservationId ? evidenceFilesByReservation[reservationId] ?? [] : [];
    const readiness = buildAiDocumentReadiness(
      reservation,
      logs,
      events,
      files,
      aiEvidenceInsights[caseId],
      aiCaseInsights[caseId],
    );

    setAiDocumentReadiness((current) => ({
      ...current,
      [caseId]: readiness,
    }));
    setMessage("AI 문서작성 준비도 결과가 생성되었습니다.");
  }

  function handleGenerateAiOpinionDraft(caseId: string) {
    const reservation = reservations.find((item) => getReservationKey(item) === caseId);

    if (!reservation) {
      setMessage("AI 의견서 초안을 생성할 사건을 찾을 수 없습니다.");
      return;
    }

    const reservationId = reservation.id;
    const logs = reservationId ? consultLogsByReservation[reservationId] ?? [] : [];
    const events = reservationId ? eventsByReservation[reservationId] ?? [] : [];
    const files = reservationId ? evidenceFilesByReservation[reservationId] ?? [] : [];
    const draft = buildAiOpinionDraft(
      reservation,
      logs,
      events,
      files,
      aiDocumentReadiness[caseId],
      aiEvidenceInsights[caseId],
      aiCaseInsights[caseId],
    );

    setAiOpinionDrafts((current) => ({
      ...current,
      [caseId]: draft,
    }));
    setMessage("AI 의견서 초안이 생성되었습니다.");
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
      setMessage("상담기록을 확인할 수 없습니다.");
    } finally {
      setLoadingConsultLogsId(null);
    }
  }

  async function createConsultLog(reservation: Reservation) {
    const reservationId = reservation.id;

    if (!reservationId || dataSource !== "supabase") {
      setMessage("예약 정보를 다시 불러온 뒤 상담기록을 저장해주세요.");
      return;
    }

    if (!isUuid(reservationId)) {
      setMessage("상담기록 저장에 실패했습니다. 예약 정보를 다시 확인해주세요.");
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
      setConsultLogFormVisibility(reservation, false);
      await loadDashboardData();
      const consultationTargetStatus = getConsultationWorkflowTargetStatus(consultationType);
      if (consultationTargetStatus) {
        const promotionResult = await promoteCaseStatusIfHigher(
          reservation,
          consultationTargetStatus,
          "상담기록 저장으로 사건상태가 1차상담으로 변경되었습니다.",
        );
        setWorkflowSuggestion(
          reservation,
          "자료요청",
          promotionResult === "changed" ? consultationTargetStatus : undefined,
        );
        if (promotionResult === "skipped") {
          setMessage("상담기록이 저장되었습니다. 다음 단계로 자료요청 일정을 생성할 수 있습니다.");
        }
      } else {
        setMessage("상담기록이 저장되었습니다.");
      }
    } catch (error) {
      console.error("Failed to create consult log:", error);
      setMessage("상담기록 저장에 실패했습니다. 예약 정보를 다시 확인해주세요.");
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
      await loadDashboardData();
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
      await loadDashboardData();
      setMessage("상담기록이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete consult log:", error);
      setMessage("상담기록 삭제에 실패했습니다.");
    } finally {
      setDeletingConsultLogId(null);
    }
  }

  function initializeNewEventForm(reservation: Reservation) {
    const key = getReservationKey(reservation);
    setNewEventForms((current) => {
      if (current[key]) {
        return current;
      }

      return {
        ...current,
        [key]: createReservationEventForm(reservation.manager),
      };
    });
  }

  function updateNewEventForm(reservation: Reservation, field: keyof ReservationEventForm, value: string | boolean) {
    const key = getReservationKey(reservation);
    setNewEventForms((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? createReservationEventForm(reservation.manager)),
        [field]: value,
      },
    }));
  }

  function startEditEvent(event: ReservationEvent) {
    setEditingEventId(event.id);
    setEditingEventForms((current) => ({
      ...current,
      [event.id]: {
        event_type: event.event_type,
        title: event.title,
        event_date: event.event_date,
        event_time: event.event_time ?? "",
        counselor: event.counselor ?? "",
        memo: event.memo ?? "",
        completed: event.completed,
      },
    }));
  }

  function cancelEditEvent(eventId: string) {
    setEditingEventId(null);
    setEditingEventForms((current) => {
      const next = { ...current };
      delete next[eventId];
      return next;
    });
  }

  function updateEditingEventForm(eventId: string, field: keyof ReservationEventForm, value: string | boolean) {
    setEditingEventForms((current) => ({
      ...current,
      [eventId]: {
        ...(current[eventId] ?? createReservationEventForm()),
        [field]: value,
      },
    }));
  }

  function updateEventCounselorFilter(reservation: Reservation, value: string) {
    setEventCounselorFilters((current) => ({
      ...current,
      [getReservationKey(reservation)]: value,
    }));
  }

  async function loadReservationEvents(reservationId: string) {
    setLoadingEventsId(reservationId);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { data, error } = await supabase
        .from("reservation_events")
        .select("*")
        .eq("reservation_id", reservationId)
        .order("completed", { ascending: true })
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true });

      if (error) {
        console.error(error);
        throw error;
      }

      setEventsByReservation((current) => ({
        ...current,
        [reservationId]: (data ?? []) as ReservationEvent[],
      }));
    } catch (error) {
      console.error("Failed to load reservation events:", error);
      setMessage("사건 일정을 확인할 수 없습니다.");
    } finally {
      setLoadingEventsId(null);
    }
  }

  async function createReservationEvent(reservation: Reservation) {
    const reservationId = reservation.id;

    if (!reservationId || dataSource !== "supabase" || !isUuid(reservationId)) {
      setMessage("예약 정보를 다시 불러온 뒤 사건 일정을 저장해주세요.");
      return;
    }

    const key = getReservationKey(reservation);
    const form = newEventForms[key] ?? createReservationEventForm(reservation.manager);

    if (!form.event_type || !form.title.trim() || !form.event_date) {
      setMessage("일정유형, 일정제목, 일정일자를 입력해 주세요.");
      return;
    }

    setSavingEventId("new");
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { error } = await supabase.from("reservation_events").insert({
        reservation_id: reservationId,
        event_type: form.event_type,
        title: form.title.trim(),
        event_date: form.event_date,
        event_time: form.event_time.trim() || null,
        counselor: form.counselor.trim() || null,
        memo: form.memo.trim() || null,
        completed: false,
      });

      if (error) {
        console.error(error);
        throw error;
      }

      setNewEventForms((current) => ({
        ...current,
        [key]: createReservationEventForm(reservation.manager),
      }));
      setEventFormVisibility(reservation, false);
      await loadReservationEvents(reservationId);
      await loadDashboardData();
      setMessage("사건 일정이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to create reservation event:", error);
      setMessage("사건 일정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSavingEventId(null);
    }
  }

  async function updateReservationEvent(event: ReservationEvent) {
    const form = editingEventForms[event.id];

    if (!form?.event_type || !form.title.trim() || !form.event_date) {
      setMessage("일정유형, 일정제목, 일정일자를 입력해 주세요.");
      return;
    }

    setSavingEventId(event.id);
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { error } = await supabase
        .from("reservation_events")
        .update({
          event_type: form.event_type,
          title: form.title.trim(),
          event_date: form.event_date,
          event_time: form.event_time.trim() || null,
          counselor: form.counselor.trim() || null,
          memo: form.memo.trim() || null,
          completed: form.completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      if (error) {
        console.error(error);
        throw error;
      }

      cancelEditEvent(event.id);
      await loadReservationEvents(event.reservation_id);
      await loadDashboardData();
      setMessage("사건 일정이 수정되었습니다.");
    } catch (error) {
      console.error("Failed to update reservation event:", error);
      setMessage("사건 일정 수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSavingEventId(null);
    }
  }

  async function toggleReservationEventCompleted(event: ReservationEvent) {
    setSavingEventId(event.id);
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { error } = await supabase
        .from("reservation_events")
        .update({
          completed: !event.completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      if (error) {
        console.error(error);
        throw error;
      }

      await loadReservationEvents(event.reservation_id);
      await loadDashboardData();

      if (event.completed) {
        setMessage("사건 일정 완료가 취소되었습니다.");
        return;
      }

      const reservation = getCurrentReservationById(event.reservation_id);
      const targetStatus = getEventWorkflowTargetStatus(event.event_type);
      const nextEventType = getNextWorkflowEventType(event.event_type);

      let promotionResult: "changed" | "skipped" | "failed" = "skipped";
      if (reservation && targetStatus) {
        promotionResult = await promoteCaseStatusIfHigher(
          reservation,
          targetStatus,
          `${event.event_type} 완료로 사건상태가 ${targetStatus}로 변경되었습니다.`,
        );
        if (promotionResult === "skipped") {
          setMessage("사건 일정이 완료 처리되었습니다.");
        }
      } else {
        setMessage("사건 일정이 완료 처리되었습니다.");
      }

      if (reservation && nextEventType) {
        setWorkflowSuggestion(reservation, nextEventType, promotionResult === "changed" ? targetStatus : undefined);
      }
    } catch (error) {
      console.error("Failed to toggle reservation event:", error);
      setMessage("사건 일정 완료 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSavingEventId(null);
    }
  }

  async function deleteReservationEvent(event: ReservationEvent) {
    if (!window.confirm("일정을 삭제하시겠습니까?")) {
      return;
    }

    setDeletingEventId(event.id);
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Missing Supabase browser environment variables.");
      }

      const { error } = await supabase.from("reservation_events").delete().eq("id", event.id);

      if (error) {
        console.error(error);
        throw error;
      }

      setEventsByReservation((current) => ({
        ...current,
        [event.reservation_id]: (current[event.reservation_id] ?? []).filter((item) => item.id !== event.id),
      }));
      await loadDashboardData();
      setMessage("사건 일정이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete reservation event:", error);
      setMessage("사건 일정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setDeletingEventId(null);
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
      setMessage("증거자료를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoadingEvidenceId(null);
    }
  }

  async function uploadEvidenceFile(reservation: Reservation) {
    const key = getReservationKey(reservation);
    const file = selectedEvidenceFiles[key];

    if (!reservation.id || dataSource !== "supabase") {
      setMessage("예약 정보를 다시 불러온 뒤 증거자료를 업로드해주세요.");
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
      setMessage("증거자료 업로드를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
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
      setEvidenceUploadVisibility(reservation, false);
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
      setMessage("증거자료 다운로드를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
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
      setMessage("증거자료 삭제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
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
          setMessage("사건관리 정보가 저장되었습니다.");
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
    setMessage("사건관리 정보 저장에 실패해 임시 저장 데이터에 반영했습니다.");
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
            예약 데이터를 기준으로 관리하고, 연결 장애 시 임시 저장 데이터를 표시합니다.
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

      <AdminDashboard
        consultLogs={dashboardData.consultLogs}
        events={dashboardData.events}
        fileCount={dashboardData.fileCount}
        isLoading={isDashboardLoading}
        onSelectReservation={selectReservationById}
        reservations={reservations}
        summary={dashboardSummary}
      />

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
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                    selectedId === key
                      ? "border-navy bg-navy/5 ring-2 ring-navy/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  key={key}
                  onClick={() => setSelectedId(key)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong className="min-w-0 break-words text-base">{reservation.name || "이름 없음"}</strong>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">
                      {reservation.reservation_status || "접수"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{reservation.phone || "연락처 없음"}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(reservation.created_at)}</p>
                  <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                    {reservation.case_number ? (
                      <span className="break-words rounded-lg bg-navy/10 px-2 py-1 text-navy">{reservation.case_number}</span>
                    ) : null}
                    <span className="break-words rounded-lg bg-slate-100 px-2 py-1">
                      사건상태: {reservation.case_status || "-"}
                    </span>
                    <span className="break-words rounded-lg bg-slate-100 px-2 py-1">
                      담당자: {reservation.manager || "-"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </section>

        <section className="card">
          {selectedReservation ? (
            <div>
              <CaseSummaryPanel events={selectedEvents} reservation={selectedReservation} />
              <AiCaseSummaryApiPanel
                error={aiCaseSummaryApiErrors[selectedReservationKey]}
                isLoading={aiCaseSummaryApiLoadingId === selectedReservationKey}
                onGenerate={() => handleGenerateAiCaseSummaryWithApi(selectedReservationKey)}
              />
              <AiAssistantSection
                aiDocumentReadiness={aiDocumentReadiness[selectedReservationKey]}
                aiEvidenceInsight={aiEvidenceInsights[selectedReservationKey]}
                aiInsight={aiCaseInsights[selectedReservationKey]}
                aiOpinionDraft={aiOpinionDrafts[selectedReservationKey]}
                aiSummary={aiCaseSummaries[selectedReservationKey]}
                aiSummaryApiError={aiCaseSummaryApiErrors[selectedReservationKey]}
                isAiSummaryApiLoading={aiCaseSummaryApiLoadingId === selectedReservationKey}
                onFeatureClick={handleAiFeatureClick}
                onGenerateApiSummary={() => handleGenerateAiCaseSummaryWithApi(selectedReservationKey)}
                onGenerateDocumentReadiness={() => handleGenerateAiDocumentReadiness(selectedReservationKey)}
                onGenerateInsight={() => handleGenerateAiCaseInsight(selectedReservationKey)}
                onGenerateSummary={() => handleGenerateAiCaseSummary(selectedReservationKey)}
              />
              <AccordionSection
                isOpen={openDetailSections.reservationInfo}
                onToggle={() => toggleDetailSection("reservationInfo")}
                title="예약정보"
              >
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

              </AccordionSection>

              <AccordionSection
                isOpen={openDetailSections.diagnosis}
                onToggle={() => toggleDetailSection("diagnosis")}
                title="연결된 무료진단 결과"
              >
                <DiagnosisResult reservation={selectedReservation} />
              </AccordionSection>
              <AccordionSection
                count={selectedConsultLogs.length}
                isOpen={openDetailSections.consultLogs}
                onToggle={() => toggleDetailSection("consultLogs")}
                title="상담기록"
              >
              <ConsultationLogSection
                deletingLogId={deletingConsultLogId}
                editingLogForms={editingConsultLogForms}
                editingLogId={editingConsultLogId}
                isNewFormOpen={consultLogFormOpen[selectedReservationKey] ?? false}
                isLoading={loadingConsultLogsId === selectedReservation.id}
                isSupabaseReservation={dataSource === "supabase" && isUuid(selectedReservation.id)}
                logs={selectedConsultLogs}
                newLogForm={
                  newConsultLogForms[selectedReservationKey] ??
                  createConsultLogForm(selectedReservation.manager)
                }
                onCancelEdit={cancelEditConsultLog}
                onChangeEdit={updateEditingConsultLogForm}
                onChangeNew={(field, value) => updateNewConsultLogForm(selectedReservation, field, value)}
                onCreate={() => createConsultLog(selectedReservation)}
                onDelete={deleteConsultLog}
                onStartEdit={startEditConsultLog}
                onToggleNewForm={() =>
                  setConsultLogFormVisibility(selectedReservation, !(consultLogFormOpen[selectedReservationKey] ?? false))
                }
                onUpdate={updateConsultLog}
                reservation={selectedReservation}
                savingLogId={savingConsultLogId}
              />
              </AccordionSection>
              <AccordionSection
                isOpen={openDetailSections.timeline}
                onToggle={() => toggleDetailSection("timeline")}
                title="사건 진행 타임라인"
              >
                <CaseTimeline caseStatus={selectedReservation.case_status} />
              </AccordionSection>
              <AccordionSection
                isOpen={openDetailSections.checklist}
                onToggle={() => toggleDetailSection("checklist")}
                title="사건 체크리스트"
              >
                <CaseChecklist
                  events={selectedEvents}
                  logs={selectedConsultLogs}
                  reservation={selectedReservation}
                />
              </AccordionSection>
              <AccordionSection
                count={selectedEvents.length}
                isOpen={openDetailSections.events}
                onToggle={() => toggleDetailSection("events")}
                title="사건 일정"
              >
              <ReservationEventsSection
                counselorFilter={eventCounselorFilters[selectedReservationKey] ?? ""}
                deletingEventId={deletingEventId}
                editingEventForms={editingEventForms}
                editingEventId={editingEventId}
                events={selectedEvents}
                workflowSuggestion={selectedReservation.id ? workflowSuggestions[selectedReservation.id] ?? null : null}
                isCreatingWorkflowEvent={
                  selectedReservation.id
                    ? creatingWorkflowEventKey ===
                      `${selectedReservation.id}-${workflowSuggestions[selectedReservation.id]?.event_type ?? ""}`
                    : false
                }
                isNewFormOpen={eventFormOpen[selectedReservationKey] ?? false}
                isLoading={loadingEventsId === selectedReservation.id}
                isSupabaseReservation={dataSource === "supabase" && isUuid(selectedReservation.id)}
                newEventForm={
                  newEventForms[selectedReservationKey] ??
                  createReservationEventForm(selectedReservation.manager)
                }
                onCancelEdit={cancelEditEvent}
                onChangeEdit={updateEditingEventForm}
                onChangeFilter={(value) => updateEventCounselorFilter(selectedReservation, value)}
                onChangeNew={(field, value) => updateNewEventForm(selectedReservation, field, value)}
                onCreate={() => createReservationEvent(selectedReservation)}
                onDelete={deleteReservationEvent}
                onStartEdit={startEditEvent}
                onToggleNewForm={() =>
                  setEventFormVisibility(selectedReservation, !(eventFormOpen[selectedReservationKey] ?? false))
                }
                onToggleComplete={toggleReservationEventCompleted}
                onCreateWorkflowEvent={createSuggestedWorkflowEvent}
                onUpdate={updateReservationEvent}
                reservationName={selectedReservation.name || "이름 없음"}
                savingEventId={savingEventId}
              />
              </AccordionSection>
              <AccordionSection
                count={selectedReservationFiles.length}
                isOpen={openDetailSections.evidence}
                onToggle={() => toggleDetailSection("evidence")}
                title="증거자료"
              >
              <EvidenceFilesSection
                deletingFileId={deletingEvidenceFileId}
                files={selectedReservationFiles}
                isUploadOpen={evidenceUploadOpen[selectedReservationKey] ?? false}
                isLoading={loadingEvidenceId === selectedReservation.id}
                isSupabaseReservation={dataSource === "supabase" && Boolean(selectedReservation.id)}
                isUploading={uploadingEvidenceId === selectedReservation.id}
                onDelete={deleteEvidenceFile}
                onDownload={downloadEvidenceFile}
                onFileChange={(file) => updateSelectedEvidenceFile(selectedReservation, file)}
                onToggleUpload={() =>
                  setEvidenceUploadVisibility(selectedReservation, !(evidenceUploadOpen[selectedReservationKey] ?? false))
                }
                onUpload={() => uploadEvidenceFile(selectedReservation)}
                selectedFile={selectedEvidenceFiles[selectedReservationKey] ?? null}
                uploadInputKey={`${selectedReservationKey}-${evidenceInputVersion}`}
              />
              </AccordionSection>
              <AccordionSection
                isOpen={openDetailSections.adminMemo}
                onToggle={() => toggleDetailSection("adminMemo")}
                title="관리자 메모"
              >
              <AdminMemoSection
                onChange={(value) => updateLocalField(selectedReservation, "admin_memo", value)}
                value={selectedReservation.admin_memo || ""}
              />
              </AccordionSection>

              <div className="mt-6 flex justify-end">
                <button
                  className="btn-primary"
                  disabled={savingId === getReservationKey(selectedReservation)}
                  onClick={() => saveReservation(selectedReservation)}
                  type="button"
                >
                  {savingId === getReservationKey(selectedReservation) ? "저장 중..." : "사건관리 저장"}
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

function AdminDashboard({
  consultLogs,
  events,
  fileCount,
  isLoading,
  onSelectReservation,
  reservations,
  summary,
}: {
  consultLogs: ReservationConsultLog[];
  events: ReservationEvent[];
  fileCount: number | null;
  isLoading: boolean;
  onSelectReservation: (reservationId?: string | null) => void;
  reservations: Reservation[];
  summary: DashboardSummary;
}) {
  const reservationById = useMemo(() => createReservationByIdMap(reservations), [reservations]);
  const todayEvents = useMemo(() => getTodayDashboardEvents(events), [events]);
  const upcomingEvents = useMemo(() => getUpcomingDashboardEvents(events), [events]);
  const recentConsultLogs = useMemo(() => getRecentConsultLogs(consultLogs), [consultLogs]);
  const recentReservations = useMemo(() => reservations.slice(0, 5), [reservations]);
  const summaryCards = [
    { label: "전체 예약", value: summary.totalReservations },
    { label: "오늘 예약", value: summary.todayReservations },
    { label: "진행 중 사건", value: summary.activeCases },
    { label: "오늘 일정", value: summary.todayEvents },
    { label: "다가오는 일정", value: summary.upcomingEvents },
    { label: "완료 일정", value: summary.completedEvents },
    { label: "상담기록", value: summary.consultLogs },
    { label: "증거자료", value: fileCount === null ? "-" : summary.fileCount },
  ];
  const summaryCardTones = [
    "border-slate-200 bg-slate-50 text-slate-900",
    "border-blue-200 bg-blue-50 text-blue-950",
    "border-amber-200 bg-amber-50 text-amber-950",
    "border-rose-200 bg-rose-50 text-rose-950",
    "border-indigo-200 bg-indigo-50 text-indigo-950",
    "border-emerald-200 bg-emerald-50 text-emerald-950",
    "border-violet-200 bg-violet-50 text-violet-950",
    "border-slate-300 bg-white text-slate-800",
  ];

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-black text-slate-900">관리자 대시보드</h2>
        {isLoading ? <p className="text-xs font-bold text-slate-500">요약 데이터를 불러오는 중입니다.</p> : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <div className={`rounded-xl border p-4 ${summaryCardTones[index] ?? summaryCardTones[0]}`} key={card.label}>
            <p className="text-xs font-black opacity-70">{card.label}</p>
            <p className="mt-2 text-4xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <DashboardList title="오늘 일정">
          {todayEvents.length === 0 ? (
            <DashboardEmpty text="오늘 처리할 미완료 일정이 없습니다." />
          ) : (
            todayEvents.map((event) => {
              const reservation = reservationById.get(event.reservation_id);
              return (
                <DashboardButton
                  key={event.id}
                  onClick={() => onSelectReservation(event.reservation_id)}
                  variant={isImportantReservationEvent(event) ? "important" : "today"}
                >
                  <span className="font-black text-slate-900">{event.event_time || "-"}</span>
                  <span>{event.event_type}</span>
                  <span className="font-semibold text-slate-800">{event.title}</span>
                  <span>{event.counselor || "-"}</span>
                  <span>{reservation?.name || "예약자 없음"}</span>
                </DashboardButton>
              );
            })
          )}
        </DashboardList>

        <DashboardList title="다가오는 일정">
          {upcomingEvents.length === 0 ? (
            <DashboardEmpty text="다가오는 미완료 일정이 없습니다." />
          ) : (
            upcomingEvents.map((event) => {
              const reservation = reservationById.get(event.reservation_id);
              return (
                <DashboardButton
                  key={event.id}
                  onClick={() => onSelectReservation(event.reservation_id)}
                  variant={isImportantReservationEvent(event) ? "important" : "default"}
                >
                  <span className="font-black text-slate-900">{event.event_date}</span>
                  <span>{event.event_time || "-"}</span>
                  <span>{event.event_type}</span>
                  <span className="font-semibold text-slate-800">{event.title}</span>
                  <span>{event.counselor || "-"}</span>
                  <span>{reservation?.name || "예약자 없음"}</span>
                </DashboardButton>
              );
            })
          )}
        </DashboardList>

        <DashboardList title="최근 상담기록">
          {recentConsultLogs.length === 0 ? (
            <DashboardEmpty text="최근 상담기록이 없습니다." />
          ) : (
            recentConsultLogs.map((log) => {
              const reservation = reservationById.get(log.reservation_id);
              return (
                <DashboardButton key={log.id} onClick={() => onSelectReservation(log.reservation_id)}>
                  <span className="font-black text-slate-900">{formatDate(log.created_at)}</span>
                  <span>{log.consultation_type}</span>
                  <span>{log.counselor || "-"}</span>
                  <span className="font-semibold text-slate-800">{truncateText(log.content, 46)}</span>
                  <span>{reservation?.name || "예약자 없음"}</span>
                </DashboardButton>
              );
            })
          )}
        </DashboardList>

        <DashboardList title="최근 예약">
          {recentReservations.length === 0 ? (
            <DashboardEmpty text="최근 예약이 없습니다." />
          ) : (
            recentReservations.map((reservation) => (
              <DashboardButton key={getReservationKey(reservation)} onClick={() => onSelectReservation(reservation.id)}>
                <span className="font-black text-slate-900">{formatDate(reservation.created_at)}</span>
                <span>{reservation.name || "이름 없음"}</span>
                <span>{reservation.phone || "연락처 없음"}</span>
                <span>{reservation.product ?? reservation.consultation_type ?? "-"}</span>
                <span>{reservation.reservation_status || "-"}</span>
                <span>{reservation.case_status || "-"}</span>
              </DashboardButton>
            ))
          )}
        </DashboardList>
      </div>
    </section>
  );
}

function DashboardList({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-black text-slate-800">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function DashboardButton({
  children,
  onClick,
  variant = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "default" | "today" | "important";
}) {
  const variantClass =
    variant === "important"
      ? "border-amber-300 bg-amber-50 hover:border-amber-400"
      : variant === "today"
        ? "border-rose-200 bg-rose-50/70 hover:border-rose-300"
        : "border-slate-200 bg-white hover:border-navy";

  return (
    <button
      className={`grid w-full gap-1 rounded-lg border p-3 text-left text-xs font-semibold text-slate-600 hover:ring-2 hover:ring-navy/10 sm:grid-cols-2 lg:grid-cols-3 ${variantClass}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function DashboardEmpty({ text }: { text: string }) {
  return <p className="rounded-lg bg-white p-3 text-sm font-semibold text-slate-500">{text}</p>;
}

function AccordionSection({
  children,
  count,
  isOpen,
  onToggle,
  title,
}: {
  children: ReactNode;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="text-sm font-black text-slate-800">
          {isOpen ? "▼" : "▶"} {title}
          {typeof count === "number" ? ` (${count}건)` : ""}
        </span>
        <span className="text-xs font-bold text-slate-500">{isOpen ? "접기" : "펼치기"}</span>
      </button>
      {isOpen ? <div className="border-t border-slate-100 p-4">{children}</div> : null}
    </section>
  );
}

function CaseSummaryPanel({ events, reservation }: { events: ReservationEvent[]; reservation: Reservation }) {
  const progress = getCaseProgressInfo(reservation.case_status);
  const nextEvent = getNextReservationEvent(events);
  const nextEventText = nextEvent
    ? `${formatEventDateTime(nextEvent)} ${nextEvent.event_type}`
    : "등록된 다음 일정 없음";

  return (
    <section className="mb-4 rounded-2xl border border-navy/15 bg-navy/5 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900">사건 요약</h2>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <Info label="사건번호" value={reservation.case_number} />
            <Info label="신청자" value={reservation.name} />
            <Info label="연락처" value={reservation.phone} />
            <Info label="예약상태" value={reservation.reservation_status} />
            <Info label="사건상태" value={reservation.case_status} />
            <Info label="담당자" value={reservation.manager} />
            <Info label="현재 진행단계" value={progress.step} />
            <Info label="다음 일정" value={nextEventText} />
          </div>
        </div>
        <div className="w-full rounded-xl border border-white/80 bg-white p-4 shadow-sm lg:max-w-xs">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black text-slate-500">진행률</p>
              <p className="mt-1 text-3xl font-black text-navy">{progress.percent}%</p>
            </div>
            <p className="text-sm font-black text-slate-700">{progress.step}</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-navy" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {progress.index + 1}/{caseTimelineSteps.length} 단계
          </p>
        </div>
      </div>
    </section>
  );
}

function AiCaseSummaryApiPanel({
  error,
  isLoading,
  onGenerate,
}: {
  error?: string;
  isLoading: boolean;
  onGenerate: () => void;
}) {
  return (
    <section className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900">실제 OpenAI API 사건요약</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            이름, 연락처, 이메일, 전화번호를 제외한 사건자료만 전송합니다.
          </p>
        </div>
        <button
          className="btn-primary whitespace-nowrap px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={onGenerate}
          type="button"
        >
          {isLoading ? "AI 사건요약 생성 중..." : "AI 사건요약 생성"}
        </button>
      </div>
      {isLoading ? (
        <p className="mt-3 text-sm font-bold text-blue-700">/api/ai/case-summary를 호출해 사건요약을 생성하고 있습니다.</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function AiAssistantSection({
  aiDocumentReadiness,
  aiEvidenceInsight,
  aiInsight,
  aiOpinionDraft,
  aiSummary,
  aiSummaryApiError,
  isAiSummaryApiLoading,
  onFeatureClick,
  onGenerateApiSummary,
  onGenerateDocumentReadiness,
  onGenerateInsight,
  onGenerateSummary,
}: {
  aiDocumentReadiness?: AiDocumentReadiness;
  aiEvidenceInsight?: AiEvidenceInsight;
  aiInsight?: AiCaseInsight;
  aiOpinionDraft?: AiOpinionDraft;
  aiSummary?: string;
  aiSummaryApiError?: string;
  isAiSummaryApiLoading: boolean;
  onFeatureClick: (feature: "summary" | "evidence" | "readiness" | "draft") => void;
  onGenerateApiSummary: () => void;
  onGenerateDocumentReadiness: () => void;
  onGenerateInsight: () => void;
  onGenerateSummary: () => void;
}) {
  const features = [
    {
      description: "상담기록, 일정, 무료진단 결과를 바탕으로 사건 개요를 정리합니다.",
      id: "summary" as const,
      title: "AI 사건요약 생성",
    },
    {
      description: "사건 준비도, 증거충족도, 위험도와 우선업무를 규칙 기반으로 점검합니다.",
      id: "insight" as const,
      title: "AI 사건분석 생성",
    },
    {
      description: "업로드된 증거자료와 제출서류를 바탕으로 부족자료를 점검합니다.",
      id: "evidence" as const,
      title: "AI 증거분석",
    },
    {
      description: "의견서, 반성문, 탄원서, 행정심판 청구서 등 문서작성 가능 여부를 점검합니다.",
      id: "readiness" as const,
      title: "AI 문서작성 준비도",
    },
    {
      description: "사건 요약과 상담기록을 바탕으로 의견서 초안을 작성합니다.",
      id: "draft" as const,
      title: "AI 의견서 작성",
    },
  ];

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-black text-slate-900">AI 업무도우미</h2>
        <span className="text-xs font-bold text-slate-500">Ver.2.0 준비중</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <button
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-navy hover:bg-white hover:ring-2 hover:ring-navy/10"
            key={feature.id}
            onClick={() => {
              if (feature.id === "summary") {
                onGenerateSummary();
                return;
              }

              if (feature.id === "insight") {
                onGenerateInsight();
                return;
              }

              if (feature.id === "readiness") {
                onGenerateDocumentReadiness();
                return;
              }

              onFeatureClick(feature.id);
            }}
            type="button"
          >
            <span className="block text-sm font-black text-slate-900">{feature.title}</span>
            <span className="mt-2 block break-words text-xs font-semibold leading-5 text-slate-600">
              {feature.description}
            </span>
          </button>
        ))}
      </div>
      {false ? (
      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">실제 OpenAI API 사건요약</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              이름, 연락처, 이메일, 전화번호를 제외한 사건자료만 전송합니다.
            </p>
          </div>
          <button
            className="btn-primary whitespace-nowrap px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isAiSummaryApiLoading}
            onClick={onGenerateApiSummary}
            type="button"
          >
            {isAiSummaryApiLoading ? "AI 사건요약 생성 중..." : "AI 사건요약 생성"}
          </button>
        </div>
        {isAiSummaryApiLoading ? (
          <p className="mt-3 text-sm font-bold text-blue-700">OpenAI API로 사건요약을 생성하고 있습니다.</p>
        ) : null}
        {aiSummaryApiError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {aiSummaryApiError}
          </p>
        ) : null}
      </div>
      ) : null}
      {aiInsight ? <AiCaseInsightDashboard insight={aiInsight} /> : null}
      {aiEvidenceInsight ? <AiEvidenceInsightDashboard insight={aiEvidenceInsight} /> : null}
      {aiDocumentReadiness ? <AiDocumentReadinessDashboard readiness={aiDocumentReadiness} /> : null}
      {aiOpinionDraft ? <AiOpinionDraftDashboard draft={aiOpinionDraft} /> : null}
      {aiSummary ? (
        <div className="mt-4 rounded-xl border border-navy/15 bg-navy/5 p-4">
          <p className="text-sm font-black text-slate-900">AI 사건요약 결과</p>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
            {aiSummary}
          </pre>
        </div>
      ) : null}
    </section>
  );
}

function AiCaseInsightDashboard({ insight }: { insight: AiCaseInsight }) {
  const riskBadge = getRiskBadge(insight.actionRiskLevel);
  const appealBadge = getAppealBadge(insight.appealPotential);
  const metrics = [
    { label: "AI 사건점수", suffix: "점", value: insight.caseHealthScore },
    { label: "사건완성도", suffix: "%", value: insight.caseCompleteness },
    { label: "증거충족도", suffix: "%", value: insight.evidenceSufficiency },
    { label: "AI 신뢰도", suffix: "%", value: insight.aiConfidence },
  ];

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">🤖 AI 사건분석</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">현재 사건자료 기준 mock 분석 결과입니다.</p>
          {insight.analyzedAt ? (
            <p className="mt-1 text-xs font-bold text-slate-500">최종 분석시간: {insight.analyzedAt}</p>
          ) : null}
        </div>
        <div className="grid gap-2 text-xs font-black sm:grid-cols-2">
          <span className={`rounded-full border px-3 py-1 ${riskBadge.className}`}>
            {riskBadge.icon} 조치위험도: {insight.actionRiskLevel}
          </span>
          <span className={`rounded-full border px-3 py-1 ${appealBadge.className}`}>
            {appealBadge.icon} 행정심판 가능성: {insight.appealPotential}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-navy/15 bg-white p-4">
        <p className="text-sm font-black text-slate-900">AI 종합의견</p>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-slate-700">
          {insight.overallOpinion}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">🎯 AI 코치</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              현재 사건에서는 다음 순서로 진행하는 것을 추천합니다.
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800">
            다음 추천 단계
            <span className="mx-2 text-blue-400">↓</span>
            {insight.coachAdvice.expectedNextStep}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <p className="text-xs font-black text-slate-500">우선순위</p>
            <ol className="mt-3 space-y-2 text-sm font-bold text-slate-700">
              {insight.coachAdvice.priority.map((item, index) => (
                <li className="flex gap-2" key={`${item}-${index}`}>
                  <span className="font-black text-blue-700">{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <p className="text-xs font-black text-slate-500">추천업무</p>
            <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
              {insight.coachAdvice.recommendations.map((item, index) => (
                <li className="break-words" key={`${item}-${index}`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black text-slate-500">주의사항</p>
            <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-slate-700">
              {insight.coachAdvice.caution.map((item, index) => (
                <li className="break-words" key={`${item}-${index}`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div className="rounded-xl border border-slate-200 bg-white p-3" key={metric.label}>
            <div className="flex items-end justify-between gap-2">
              <p className="text-xs font-black text-slate-500">{metric.label}</p>
              <p className="text-lg font-black text-navy">
                {metric.value}
                {metric.suffix}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-navy" style={{ width: `${metric.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <AiInsightList items={insight.missingItems} title="부족자료" />
        <AiInsightList items={insight.priorityActions} title="다음 우선업무" />
        <AiInsightList items={insight.warnings} title="주의사항" />
      </div>

      <AiInsightReasonDetails insight={insight} />
    </div>
  );
}

function AiInsightReasonDetails({ insight }: { insight: AiCaseInsight }) {
  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-black text-slate-800">AI 분석 근거 보기</summary>
      <div className="mt-4 space-y-3">
        <p className="text-sm font-black text-slate-900">AI 분석 근거</p>
        {insight.analysisReasons.map((item) => {
          const badge = getReasonStatusBadge(item.status);

          return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={item.label}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-black text-slate-900">
                  {item.label}: {item.score}/{item.maxScore}점
                </p>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${badge.className}`}>
                  {badge.icon} {item.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">근거: {item.reason}</p>
            </div>
          );
        })}
        <div className="rounded-xl border border-navy/15 bg-navy/5 p-3 text-sm font-black text-navy">
          총점: {insight.caseHealthScore}/100점
        </div>
      </div>
    </details>
  );
}

function AiEvidenceInsightDashboard({ insight }: { insight: AiEvidenceInsight }) {
  const gradeBadgeClass =
    insight.evidenceGrade === "A"
      ? "border-green-200 bg-green-50 text-green-700"
      : insight.evidenceGrade === "B"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : insight.evidenceGrade === "C"
          ? "border-yellow-200 bg-yellow-50 text-yellow-700"
          : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">🧾 AI 증거분석</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">등록된 증거자료 기준 mock 분석 결과입니다.</p>
          {insight.analyzedAt ? (
            <p className="mt-1 text-xs font-bold text-slate-500">최종 분석시간: {insight.analyzedAt}</p>
          ) : null}
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${gradeBadgeClass}`}>
          증거등급 {insight.evidenceGrade}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-black text-slate-500">증거점수</p>
          <p className="mt-2 text-3xl font-black text-navy">{insight.evidenceScore}점</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-navy" style={{ width: `${insight.evidenceScore}%` }} />
          </div>
        </div>
        <AiInsightList items={insight.registeredEvidenceTypes} title="등록 증거유형" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <AiInsightList items={insight.missingEvidence} title="부족 증거" />
        <AiInsightList items={insight.recommendedEvidence} title="추가 확보 권장자료" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <AiInsightList items={insight.usageDirection} title="증거 활용 방향" />
        <AiInsightList items={insight.cautions} title="주의사항" />
      </div>
    </div>
  );
}

function AiDocumentReadinessDashboard({ readiness }: { readiness: AiDocumentReadiness }) {
  const levelBadge = getDocumentReadinessBadge(readiness.readinessLevel);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">📝 AI 문서작성 준비도</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">현재 사건자료 기준 mock 분석 결과입니다.</p>
          {readiness.analyzedAt ? (
            <p className="mt-1 text-xs font-bold text-slate-500">최종 분석시간: {readiness.analyzedAt}</p>
          ) : null}
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${levelBadge.className}`}>
          {levelBadge.icon} 준비도 등급: {readiness.readinessLevel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-black text-slate-500">준비도 점수</p>
          <p className="mt-2 text-3xl font-black text-navy">{readiness.readinessScore}점</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-navy" style={{ width: `${readiness.readinessScore}%` }} />
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <AiInsightList items={readiness.availableDocuments} title="작성 가능 문서" />
          <AiInsightList items={readiness.notReadyDocuments} title="아직 준비가 부족한 문서" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <AiInsightList items={readiness.missingRequirements} title="부족요건" />
        <AiInsightList items={readiness.recommendedOrder} title="추천 작성 순서" />
        <AiInsightList items={readiness.cautionPoints} title="주의사항" />
      </div>
    </div>
  );
}

function AiOpinionDraftDashboard({ draft }: { draft: AiOpinionDraft }) {
  const [copied, setCopied] = useState(false);
  const readinessBadge = getOpinionDraftReadinessBadge(draft.readinessLevel);
  const sectionGroups = [
    { items: draft.sections.caseOverview, title: "1. 사건 개요" },
    { items: draft.sections.partyPosition, title: "2. 당사자 입장" },
    { items: draft.sections.keyIssues, title: "3. 주요 쟁점" },
    { items: draft.sections.evidenceAndReferences, title: "4. 증거 및 참고자료" },
    { items: draft.sections.requests, title: "5. 요청사항" },
    { items: draft.sections.supplementItems, title: "6. 보완 필요사항" },
    { items: draft.sections.cautions, title: "7. 주의 문구" },
  ];

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft.draftText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      window.alert("초안 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">✍️ AI 의견서 초안</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">개인정보 직접 노출을 피한 mock 초안입니다.</p>
          {draft.analyzedAt ? (
            <p className="mt-1 text-xs font-bold text-slate-500">최종 생성시간: {draft.analyzedAt}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-fit rounded-full border border-navy/20 bg-white px-3 py-1 text-xs font-black text-navy">
            유형: {draft.opinionType}
          </span>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${readinessBadge.className}`}>
            {readinessBadge.icon} {draft.readinessLevel} · {draft.readinessScore}점
          </span>
          <button
            className="w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-black text-slate-700 transition hover:border-navy hover:text-navy"
            onClick={copyDraft}
            type="button"
          >
            {copied ? "복사됨" : "초안 복사"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {sectionGroups.map((section) => (
          <AiInsightList items={section.items} key={section.title} title={section.title} />
        ))}
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-800">전체 의견서 초안 보기</summary>
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
          {draft.draftText}
        </pre>
      </details>
    </div>
  );
}

function AiInsightList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-black text-slate-500">{title}</p>
      <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-slate-700">
        {items.map((item) => (
          <li className="break-words" key={item}>
            - {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CaseChecklist({
  events,
  logs,
  reservation,
}: {
  events: ReservationEvent[];
  logs: ReservationConsultLog[];
  reservation: Reservation;
}) {
  const items = getCaseChecklistItems(reservation, logs, events);
  const completedCount = items.filter((item) => item.completed).length;
  const percent = Math.round((completedCount / items.length) * 100);

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800">사건 체크리스트</h2>
          <p className="mt-1 text-sm font-bold text-slate-600">
            체크리스트 {completedCount}/{items.length} 완료
          </p>
        </div>
        <p className="text-2xl font-black text-navy">{percent}%</p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            className={`rounded-xl border p-3 text-sm font-bold ${
              item.completed
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            key={item.label}
          >
            <span className="mr-2">{item.completed ? "☑" : "☐"}</span>
            <span className="break-words">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConsultationLogSection({
  deletingLogId,
  editingLogForms,
  editingLogId,
  isNewFormOpen,
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
  onToggleNewForm,
  onUpdate,
  reservation,
  savingLogId,
}: {
  deletingLogId: string | null;
  editingLogForms: Record<string, ConsultLogForm>;
  editingLogId: string | null;
  isNewFormOpen: boolean;
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
  onToggleNewForm: () => void;
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

      <div className="mt-4">
        <button className="btn-outline px-3 py-2 text-sm" onClick={onToggleNewForm} type="button">
          {isNewFormOpen ? "새 상담기록 작성 닫기" : "＋ 새 상담기록 작성"}
        </button>
      </div>

      {isNewFormOpen ? (
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
            {savingLogId === "new" ? "저장 중..." : "상담기록 저장"}
          </button>
        </div>
        {!isSupabaseReservation ? (
          <p className="mt-3 text-xs font-semibold text-slate-500">
            예약 정보를 다시 불러온 뒤 새 상담기록을 저장할 수 있습니다.
          </p>
        ) : null}
      </div>

      ) : null}

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
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={log.id}>
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900">상담 #{logs.length - index}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{formatDate(log.created_at)}</p>
                  </div>
                  {!isEditing ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => onStartEdit(log)} type="button">
                        수정
                      </button>
                      <button
                        className="btn-outline px-3 py-1.5 text-xs"
                        disabled={deletingLogId === log.id}
                        onClick={() => onDelete(log)}
                        type="button"
                      >
                        {deletingLogId === log.id ? "삭제 중..." : "삭제"}
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
                    <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
                      <button className="btn-outline" onClick={() => onCancelEdit(log.id)} type="button">
                        취소
                      </button>
                      <button
                        className="btn-primary"
                        disabled={savingLogId === log.id || !editForm.content.trim()}
                        onClick={() => onUpdate(log)}
                        type="button"
                      >
                        {savingLogId === log.id ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
                      <div className="flex min-w-0 gap-2">
                        <dt className="shrink-0 font-black text-slate-500">유형:</dt>
                        <dd className="min-w-0 break-words font-semibold text-slate-800">
                          {log.consultation_type || "전화"}
                        </dd>
                      </div>
                      <div className="flex min-w-0 gap-2">
                        <dt className="shrink-0 font-black text-slate-500">담당:</dt>
                        <dd className="min-w-0 break-words font-semibold text-slate-800">{log.counselor || "-"}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
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

function ReservationEventsSection({
  counselorFilter,
  deletingEventId,
  editingEventForms,
  editingEventId,
  events,
  workflowSuggestion,
  isCreatingWorkflowEvent,
  isNewFormOpen,
  isLoading,
  isSupabaseReservation,
  newEventForm,
  onCancelEdit,
  onChangeEdit,
  onChangeFilter,
  onChangeNew,
  onCreate,
  onDelete,
  onCreateWorkflowEvent,
  onStartEdit,
  onToggleNewForm,
  onToggleComplete,
  onUpdate,
  reservationName,
  savingEventId,
}: {
  counselorFilter: string;
  deletingEventId: string | null;
  editingEventForms: Record<string, ReservationEventForm>;
  editingEventId: string | null;
  events: ReservationEvent[];
  workflowSuggestion: WorkflowSuggestion | null;
  isCreatingWorkflowEvent: boolean;
  isNewFormOpen: boolean;
  isLoading: boolean;
  isSupabaseReservation: boolean;
  newEventForm: ReservationEventForm;
  onCancelEdit: (eventId: string) => void;
  onChangeEdit: (eventId: string, field: keyof ReservationEventForm, value: string | boolean) => void;
  onChangeFilter: (value: string) => void;
  onChangeNew: (field: keyof ReservationEventForm, value: string | boolean) => void;
  onCreate: () => void;
  onDelete: (event: ReservationEvent) => void;
  onCreateWorkflowEvent: (suggestion: WorkflowSuggestion) => void;
  onStartEdit: (event: ReservationEvent) => void;
  onToggleNewForm: () => void;
  onToggleComplete: (event: ReservationEvent) => void;
  onUpdate: (event: ReservationEvent) => void;
  reservationName: string;
  savingEventId: string | null;
}) {
  const sortedEvents = sortReservationEvents(events);
  const counselorOptions = getEventCounselorOptions(events);
  const visibleEvents = counselorFilter
    ? sortedEvents.filter((event) => (event.counselor || "") === counselorFilter)
    : sortedEvents;
  const incompleteEvents = visibleEvents.filter((event) => !event.completed);
  const completedEvents = visibleEvents.filter((event) => event.completed);
  const upcomingEvents = getUpcomingReservationEvents(events);

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-black text-slate-800">사건 일정 ({events.length}건)</h2>
        <select
          className="rounded-xl border border-slate-300 bg-white p-2 text-sm font-semibold text-slate-700"
          onChange={(event) => onChangeFilter(event.target.value)}
          value={counselorFilter}
        >
          <option value="">전체</option>
          {counselorOptions.map((counselor) => (
            <option key={counselor} value={counselor}>
              {counselor}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-black text-slate-800">다가오는 일정</h3>
        {upcomingEvents.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-500">다가오는 미완료 일정이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcomingEvents.map((event) => (
              <li className="text-sm font-semibold text-slate-700" key={event.id}>
                {formatEventDateTime(event)} {event.event_type} / {reservationName} / {event.counselor || "-"}
              </li>
            ))}
          </ul>
        )}
      </div>

      {workflowSuggestion ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">{workflowSuggestion.message}</p>
          <dl className="mt-3 grid gap-2 text-xs font-bold text-blue-900 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg bg-white/70 p-2">
              <dt className="text-blue-600">현재 단계</dt>
              <dd className="mt-1 break-words">{workflowSuggestion.current_step}</dd>
            </div>
            <div className="rounded-lg bg-white/70 p-2">
              <dt className="text-blue-600">다음 단계</dt>
              <dd className="mt-1 break-words">{workflowSuggestion.event_type}</dd>
            </div>
            <div className="rounded-lg bg-white/70 p-2">
              <dt className="text-blue-600">생성될 제목</dt>
              <dd className="mt-1 break-words">{workflowSuggestion.title}</dd>
            </div>
            <div className="rounded-lg bg-white/70 p-2">
              <dt className="text-blue-600">담당자</dt>
              <dd className="mt-1 break-words">{workflowSuggestion.counselor || "-"}</dd>
            </div>
            <div className="rounded-lg bg-white/70 p-2">
              <dt className="text-blue-600">예정일</dt>
              <dd className="mt-1">오늘</dd>
            </div>
          </dl>
          <div className="mt-3 flex justify-end">
          <button
            className="btn-primary whitespace-nowrap px-3 py-2 text-sm"
            disabled={isCreatingWorkflowEvent}
            onClick={() => onCreateWorkflowEvent(workflowSuggestion)}
            type="button"
          >
            {isCreatingWorkflowEvent ? "생성 중..." : `${workflowSuggestion.event_type} 일정 생성`}
          </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <button className="btn-outline px-3 py-2 text-sm" onClick={onToggleNewForm} type="button">
          {isNewFormOpen ? "새 일정 등록 닫기" : "＋ 새 일정 등록"}
        </button>
      </div>

      {isNewFormOpen ? (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-black text-slate-800">새 일정 입력</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="일정유형">
            <select
              className="w-full rounded-xl border border-slate-300 p-3"
              disabled={!isSupabaseReservation || savingEventId === "new"}
              onChange={(event) => onChangeNew("event_type", event.target.value)}
              value={newEventForm.event_type}
            >
              {eventTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="일정제목">
            <input
              className="w-full rounded-xl border border-slate-300 p-3"
              disabled={!isSupabaseReservation || savingEventId === "new"}
              onChange={(event) => onChangeNew("title", event.target.value)}
              value={newEventForm.title}
            />
          </Field>
          <Field label="일정일자">
            <input
              className="w-full rounded-xl border border-slate-300 p-3"
              disabled={!isSupabaseReservation || savingEventId === "new"}
              onChange={(event) => onChangeNew("event_date", event.target.value)}
              type="date"
              value={newEventForm.event_date}
            />
          </Field>
          <Field label="일정시간">
            <input
              className="w-full rounded-xl border border-slate-300 p-3"
              disabled={!isSupabaseReservation || savingEventId === "new"}
              onChange={(event) => onChangeNew("event_time", event.target.value)}
              type="time"
              value={newEventForm.event_time}
            />
          </Field>
          <Field label="담당자">
            <input
              className="w-full rounded-xl border border-slate-300 p-3"
              disabled={!isSupabaseReservation || savingEventId === "new"}
              onChange={(event) => onChangeNew("counselor", event.target.value)}
              value={newEventForm.counselor}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="메모">
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-300 p-3"
                disabled={!isSupabaseReservation || savingEventId === "new"}
                onChange={(event) => onChangeNew("memo", event.target.value)}
                value={newEventForm.memo}
              />
            </Field>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            className="btn-primary"
            disabled={
              !isSupabaseReservation ||
              savingEventId === "new" ||
              !newEventForm.event_type ||
              !newEventForm.title.trim() ||
              !newEventForm.event_date
            }
            onClick={onCreate}
            type="button"
          >
            {savingEventId === "new" ? "저장 중..." : "일정 저장"}
          </button>
        </div>
      </div>

      ) : null}

      {isLoading ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          사건 일정을 불러오는 중입니다.
        </p>
      ) : visibleEvents.length === 0 ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          등록된 사건 일정이 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          <ReservationEventGroup
            deletingEventId={deletingEventId}
            editingEventForms={editingEventForms}
            editingEventId={editingEventId}
            events={incompleteEvents}
            onCancelEdit={onCancelEdit}
            onChangeEdit={onChangeEdit}
            onDelete={onDelete}
            onStartEdit={onStartEdit}
            onToggleComplete={onToggleComplete}
            onUpdate={onUpdate}
            savingEventId={savingEventId}
            title={`미완료 일정 (${incompleteEvents.length}건)`}
          />
          <ReservationEventGroup
            deletingEventId={deletingEventId}
            editingEventForms={editingEventForms}
            editingEventId={editingEventId}
            events={completedEvents}
            onCancelEdit={onCancelEdit}
            onChangeEdit={onChangeEdit}
            onDelete={onDelete}
            onStartEdit={onStartEdit}
            onToggleComplete={onToggleComplete}
            onUpdate={onUpdate}
            savingEventId={savingEventId}
            title={`완료 일정 (${completedEvents.length}건)`}
          />
        </div>
      )}
    </section>
  );
}

function ReservationEventGroup({
  deletingEventId,
  editingEventForms,
  editingEventId,
  events,
  onCancelEdit,
  onChangeEdit,
  onDelete,
  onStartEdit,
  onToggleComplete,
  onUpdate,
  savingEventId,
  title,
}: {
  deletingEventId: string | null;
  editingEventForms: Record<string, ReservationEventForm>;
  editingEventId: string | null;
  events: ReservationEvent[];
  onCancelEdit: (eventId: string) => void;
  onChangeEdit: (eventId: string, field: keyof ReservationEventForm, value: string | boolean) => void;
  onDelete: (event: ReservationEvent) => void;
  onStartEdit: (event: ReservationEvent) => void;
  onToggleComplete: (event: ReservationEvent) => void;
  onUpdate: (event: ReservationEvent) => void;
  savingEventId: string | null;
  title: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-black text-slate-800">{title}</h3>
      {events.length === 0 ? (
        <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          등록된 일정이 없습니다.
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          {events.map((event) => {
            const isEditing = editingEventId === event.id;
            const editForm = editingEventForms[event.id] ?? {
              event_type: event.event_type,
              title: event.title,
              event_date: event.event_date,
              event_time: event.event_time ?? "",
              counselor: event.counselor ?? "",
              memo: event.memo ?? "",
              completed: event.completed,
            };

            return (
              <article
                className={`rounded-xl border p-4 ${event.completed ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-200 bg-white text-slate-800"}`}
                key={event.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-500">{event.event_type}</p>
                    <h3 className="mt-1 break-words text-base font-black">{event.title}</h3>
                    <p className="mt-1 text-sm font-semibold">{formatEventDateTime(event)}</p>
                  </div>
                  {!isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-outline px-3 py-1.5 text-xs"
                        disabled={savingEventId === event.id}
                        onClick={() => onToggleComplete(event)}
                        type="button"
                      >
                        {event.completed ? "완료 취소" : "완료"}
                      </button>
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => onStartEdit(event)} type="button">
                        수정
                      </button>
                      <button
                        className="btn-outline px-3 py-1.5 text-xs"
                        disabled={deletingEventId === event.id}
                        onClick={() => onDelete(event)}
                        type="button"
                      >
                        {deletingEventId === event.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Field label="일정유형">
                      <select
                        className="w-full rounded-xl border border-slate-300 p-3"
                        disabled={savingEventId === event.id}
                        onChange={(changeEvent) => onChangeEdit(event.id, "event_type", changeEvent.target.value)}
                        value={editForm.event_type}
                      >
                        {eventTypeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="일정제목">
                      <input
                        className="w-full rounded-xl border border-slate-300 p-3"
                        disabled={savingEventId === event.id}
                        onChange={(changeEvent) => onChangeEdit(event.id, "title", changeEvent.target.value)}
                        value={editForm.title}
                      />
                    </Field>
                    <Field label="일정일자">
                      <input
                        className="w-full rounded-xl border border-slate-300 p-3"
                        disabled={savingEventId === event.id}
                        onChange={(changeEvent) => onChangeEdit(event.id, "event_date", changeEvent.target.value)}
                        type="date"
                        value={editForm.event_date}
                      />
                    </Field>
                    <Field label="일정시간">
                      <input
                        className="w-full rounded-xl border border-slate-300 p-3"
                        disabled={savingEventId === event.id}
                        onChange={(changeEvent) => onChangeEdit(event.id, "event_time", changeEvent.target.value)}
                        type="time"
                        value={editForm.event_time}
                      />
                    </Field>
                    <Field label="담당자">
                      <input
                        className="w-full rounded-xl border border-slate-300 p-3"
                        disabled={savingEventId === event.id}
                        onChange={(changeEvent) => onChangeEdit(event.id, "counselor", changeEvent.target.value)}
                        value={editForm.counselor}
                      />
                    </Field>
                    <label className="mt-7 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <input
                        checked={editForm.completed}
                        disabled={savingEventId === event.id}
                        onChange={(changeEvent) => onChangeEdit(event.id, "completed", changeEvent.target.checked)}
                        type="checkbox"
                      />
                      완료
                    </label>
                    <div className="md:col-span-2">
                      <Field label="메모">
                        <textarea
                          className="min-h-24 w-full rounded-xl border border-slate-300 p-3"
                          disabled={savingEventId === event.id}
                          onChange={(changeEvent) => onChangeEdit(event.id, "memo", changeEvent.target.value)}
                          value={editForm.memo}
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                      <button className="btn-outline" onClick={() => onCancelEdit(event.id)} type="button">
                        취소
                      </button>
                      <button
                        className="btn-primary"
                        disabled={savingEventId === event.id || !editForm.event_type || !editForm.title.trim() || !editForm.event_date}
                        onClick={() => onUpdate(event)}
                        type="button"
                      >
                        {savingEventId === event.id ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <dl className="grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-black text-slate-500">담당:</dt>
                        <dd className="break-words font-semibold">{event.counselor || "-"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-black text-slate-500">완료:</dt>
                        <dd className="font-semibold">{event.completed ? "완료" : "미완료"}</dd>
                      </div>
                    </dl>
                    {event.memo ? (
                      <p className="whitespace-pre-wrap break-words text-sm leading-7">{event.memo}</p>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EvidenceFilesSection({
  deletingFileId,
  files,
  isLoading,
  isUploadOpen,
  isSupabaseReservation,
  isUploading,
  onDelete,
  onDownload,
  onFileChange,
  onToggleUpload,
  onUpload,
  selectedFile,
  uploadInputKey,
}: {
  deletingFileId: string | null;
  files: ReservationFile[];
  isLoading: boolean;
  isUploadOpen: boolean;
  isSupabaseReservation: boolean;
  isUploading: boolean;
  onDelete: (file: ReservationFile) => void;
  onDownload: (file: ReservationFile) => void;
  onFileChange: (file?: File) => void;
  onToggleUpload: () => void;
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
        <button className="btn-outline whitespace-nowrap px-3 py-2 text-sm" onClick={onToggleUpload} type="button">
          {isUploadOpen ? "증거자료 업로드 닫기" : "＋ 증거자료 업로드"}
        </button>
      </div>

      {isUploadOpen ? (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
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
            {isUploading ? "업로드 중..." : "업로드"}
          </button>
        </div>
      ) : null}

      {!isSupabaseReservation ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          예약 정보를 다시 불러온 뒤 증거자료를 관리할 수 있습니다.
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
                      {deletingFileId === file.id ? "삭제 중..." : "삭제"}
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
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <Info label="진단요약" value={diagnosisSummary || "진단요약 없음"} />
      </div>
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
    <div className="min-w-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-800">{value || "-"}</p>
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

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${formatDateOnly(date)} ${formatTimeOnly(date)}`;
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeOnly(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${hour}:${minute}`;
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

function createDashboardSummary(reservations: Reservation[], data: DashboardData): DashboardSummary {
  const today = getTodayDateCode();

  return {
    totalReservations: reservations.length,
    todayReservations: reservations.filter((reservation) => getReservationDashboardDate(reservation) === today).length,
    activeCases: reservations.filter((reservation) => (reservation.case_status || DEFAULT_CASE_STATUS) !== "종결").length,
    todayEvents: data.events.filter((event) => event.event_date === today && !event.completed).length,
    upcomingEvents: data.events.filter((event) => event.event_date >= today && !event.completed).length,
    completedEvents: data.events.filter((event) => event.completed).length,
    consultLogs: data.consultLogs.length,
    fileCount: data.fileCount,
  };
}

function createReservationByIdMap(reservations: Reservation[]) {
  return new Map(reservations.filter((reservation) => reservation.id).map((reservation) => [reservation.id as string, reservation]));
}

function getTodayDashboardEvents(events: ReservationEvent[]) {
  const today = getTodayDateCode();
  return sortReservationEvents(events)
    .filter((event) => event.event_date === today && !event.completed)
    .slice(0, 5);
}

function getUpcomingDashboardEvents(events: ReservationEvent[]) {
  const today = getTodayDateCode();
  return sortReservationEvents(events)
    .filter((event) => event.event_date >= today && !event.completed)
    .slice(0, 5);
}

function getRecentConsultLogs(logs: ReservationConsultLog[]) {
  return [...logs]
    .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
    .slice(0, 5);
}

function getReservationDashboardDate(reservation: Reservation) {
  const preferredDate = reservation.preferred_date?.trim();
  if (preferredDate) {
    return preferredDate.slice(0, 10);
  }

  return getDateCode(reservation.created_at);
}

function getTodayDateCode() {
  return getDateCode(new Date().toISOString());
}

function getDateCode(value?: string) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function formatEventDateTime(event: Pick<ReservationEvent, "event_date" | "event_time">) {
  const eventDate = event.event_date || "-";
  const eventTime = event.event_time?.trim();

  return eventTime ? `${eventDate} ${eventTime.slice(0, 5)}` : eventDate;
}

function getEventComparableTime(event: ReservationEvent) {
  return new Date(`${event.event_date}T${event.event_time || "00:00"}`).getTime();
}

function sortReservationEvents(events: ReservationEvent[]) {
  return [...events].sort((first, second) => {
    if (first.completed !== second.completed) {
      return first.completed ? 1 : -1;
    }

    return getEventComparableTime(first) - getEventComparableTime(second);
  });
}

function getEventCounselorOptions(events: ReservationEvent[]) {
  const eventCounselors = events.map((event) => event.counselor?.trim()).filter(Boolean) as string[];
  return Array.from(new Set(["대표행정사", "황인동", ...eventCounselors]));
}

function getUpcomingReservationEvents(events: ReservationEvent[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return sortReservationEvents(events)
    .filter((event) => !event.completed && new Date(`${event.event_date}T00:00`).getTime() >= today.getTime())
    .slice(0, 5);
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

function isUuid(value?: string | null) {
  return Boolean(
    value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
  );
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getCaseStatusRank(caseStatus?: string) {
  const step = getTimelineCurrentStep(caseStatus);
  const index = caseTimelineSteps.indexOf(step);
  return index >= 0 ? index + 1 : 1;
}

function getCaseChecklistItems(
  reservation: Reservation,
  logs: ReservationConsultLog[] = [],
  events: ReservationEvent[] = [],
) {
  const hasCompletedEvent = (...eventTypes: string[]) =>
    events.some((event) => event.completed && eventTypes.includes(event.event_type));
  const statusRank = getCaseStatusRank(reservation.case_status);
  const submittedDocuments = asText(reservation.submitted_documents);
  const hasOpinionDocument = /의견서|진술서|소명서/.test(submittedDocuments);

  return [
    { completed: logs.length > 0, label: "상담 완료" },
    { completed: hasCompletedEvent("자료요청") || statusRank >= getCaseStatusRank("자료요청"), label: "자료요청 완료" },
    {
      completed: hasCompletedEvent("자료제출") || statusRank >= getCaseStatusRank("자료검토"),
      label: "자료수신/자료제출 확인",
    },
    {
      completed: hasCompletedEvent("의견서 작성") || statusRank >= getCaseStatusRank("심의준비"),
      label: "의견서 작성",
    },
    {
      completed:
        hasCompletedEvent("의견서 제출") || (statusRank >= getCaseStatusRank("심의준비") && hasOpinionDocument),
      label: "의견서 제출",
    },
    { completed: hasCompletedEvent("학폭위 개최") || statusRank >= getCaseStatusRank("심의완료"), label: "학폭위 개최" },
    { completed: hasCompletedEvent("조치결정") || statusRank >= getCaseStatusRank("심의완료"), label: "조치결정 확인" },
    {
      completed:
        hasCompletedEvent("행정심판 검토", "행정심판 청구") ||
        statusRank >= getCaseStatusRank("행정심판검토"),
      label: "행정심판 검토",
    },
    { completed: reservation.case_status === "종결" || hasCompletedEvent("종결"), label: "종결" },
  ];
}

function buildAiCaseInsight(
  caseItem: Reservation,
  logs: ReservationConsultLog[] = [],
  events: ReservationEvent[] = [],
  evidenceFiles: ReservationFile[] = [],
): AiCaseInsight {
  const consultationTexts = [
    caseItem.consultation_type,
    caseItem.consultationType,
    caseItem.summary,
    caseItem.consultation_log,
    caseItem.content,
    caseItem.admin_memo,
    ...logs.map((log) => log.content),
  ].filter(hasText);
  const checklistItems = getCaseChecklistItems(caseItem, logs, events);
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
  const checklistScore = Math.min(20, Math.round((completedChecklistCount / checklistItems.length) * 20));
  const hasConsultation = logs.length > 0 || hasText(caseItem.consultation_log);
  const hasEvidence = evidenceFiles.length > 0;
  const hasEvents = events.length > 0;
  const hasAdminMemo = hasText(caseItem.admin_memo);
  const hasDiagnosis = Boolean(
    hasText(caseItem.diagnosis_type) ||
      hasText(caseItem.diagnosis_result_id) ||
      hasText(caseItem.diagnosis_summary) ||
      caseItem.diagnosis_payload,
  );
  const hasCaseSummary = hasText(caseItem.summary) || hasText(caseItem.content);
  const analysisReasons: AiCaseInsight["analysisReasons"] = [
    {
      label: "상담기록",
      maxScore: 20,
      reason: hasConsultation
        ? "상담기록이 등록되어 사건 사실관계 확인이 가능합니다."
        : "상담기록이 없어 사건 흐름 확인이 어렵습니다.",
      score: hasConsultation ? 20 : 0,
      status: hasConsultation ? "충족" : "부족",
    },
    {
      label: "증거자료",
      maxScore: 20,
      reason: hasEvidence
        ? "증거자료가 등록되어 입증자료 검토가 가능합니다."
        : "증거자료가 없어 피해 주장 입증 가능성 검토가 제한됩니다.",
      score: hasEvidence ? 20 : 0,
      status: hasEvidence ? "충족" : "부족",
    },
    {
      label: "사건일정",
      maxScore: 10,
      reason: hasEvents
        ? "학폭위 또는 제출기한 관련 일정이 등록되어 있습니다."
        : "사건일정이 없어 학폭위 또는 제출기한 확인이 필요합니다.",
      score: hasEvents ? 10 : 0,
      status: hasEvents ? "충족" : "부족",
    },
    {
      label: "관리자 메모",
      maxScore: 10,
      reason: hasAdminMemo
        ? "담당자 검토 메모가 등록되어 실무 판단 근거를 확인할 수 있습니다."
        : "담당자 검토 메모가 없어 실무 판단 근거가 부족합니다.",
      score: hasAdminMemo ? 10 : 0,
      status: hasAdminMemo ? "충족" : "부족",
    },
    {
      label: "체크리스트",
      maxScore: 20,
      reason: `체크리스트 완료 항목 ${completedChecklistCount}/${checklistItems.length}건을 기준으로 산정되었습니다.`,
      score: checklistScore,
      status: checklistScore >= 14 ? "충족" : checklistScore > 0 ? "확인필요" : "부족",
    },
    {
      label: "무료진단",
      maxScore: 10,
      reason: hasDiagnosis ? "무료진단 결과가 연결되어 초기 진단 정보를 참고할 수 있습니다." : "무료진단 결과가 연결되지 않았습니다.",
      score: hasDiagnosis ? 10 : 0,
      status: hasDiagnosis ? "충족" : "부족",
    },
    {
      label: "사건요약",
      maxScore: 10,
      reason: hasCaseSummary ? "상담요약 또는 사건요약이 등록되어 있습니다." : "상담요약 또는 사건요약이 부족합니다.",
      score: hasCaseSummary ? 10 : 0,
      status: hasCaseSummary ? "충족" : "부족",
    },
  ];
  const caseHealthScore = clampScore(analysisReasons.reduce((total, item) => total + item.score, 0));
  const caseCompleteness = caseHealthScore;
  const evidenceSufficiency = getEvidenceSufficiency(evidenceFiles.length, hasConsultation, hasAdminMemo);
  const aiConfidence = getAiInsightConfidence({
    hasAdminMemo,
    hasConsultation,
    hasEvidence,
    hasEvents,
  });
  const riskKeywordCount = getUniqueKeywordMatchCount(consultationTexts.join(" "), [
    "지속",
    "반복",
    "고의",
    "상해",
    "진단서",
    "협박",
    "금품",
    "사이버",
    "성",
    "따돌림",
    "보복",
    "공포",
    "불안",
    "전학",
    "출석정지",
  ]);
  const actionRiskLevel = getActionRiskLevel(riskKeywordCount);
  const appealKeywordCount = getUniqueKeywordMatchCount(
    [caseItem.case_status, caseItem.consultation_type, caseItem.consultationType, caseItem.admin_memo].filter(hasText).join(" "),
    ["조치결정", "불복", "행정심판", "생기부", "4호", "5호", "6호", "7호", "8호", "9호"],
  );
  const appealPotential = getAppealPotential(appealKeywordCount, actionRiskLevel);
  const missingItems = [
    !hasConsultation ? "상담기록 추가 필요" : "",
    !hasEvidence ? "증거자료 등록 필요" : "",
    !hasEvents ? "학폭위 또는 제출기한 일정 확인 필요" : "",
    !hasAdminMemo ? "담당자 검토 메모 추가 필요" : "",
    !hasDiagnosis ? "무료진단 결과 연결 필요" : "",
  ].filter(hasText);
  const priorityActions = [
    !hasEvidence ? "증거자료 추가 등록" : "",
    !hasEvents ? "학폭위 일정 또는 의견서 제출기한 확인" : "",
    !hasConsultation ? "상담기록 보완" : "",
    !hasAdminMemo ? "관리자 메모로 검토사항 정리" : "",
    actionRiskLevel === "높음" || actionRiskLevel === "매우높음" ? "조치수위 및 생활기록부 영향 검토" : "",
    appealPotential === "보통" || appealPotential === "높음" ? "행정심판 가능성 검토" : "",
  ].filter(hasText);
  const coachAdvice = buildAiCoachAdvice({
    actionRiskLevel,
    appealPotential,
    hasAdminMemo,
    hasConsultation,
    hasEvidence,
    hasEvents,
  });
  const overallOpinion = buildOverallOpinion({
    actionRiskLevel,
    aiConfidence,
    appealPotential,
    caseCompleteness,
    caseHealthScore,
    evidenceSufficiency,
    missingItems,
    priorityActions,
  });

  return {
    actionRiskLevel,
    aiConfidence,
    analysisReasons,
    analyzedAt: new Date().toLocaleString("ko-KR", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    appealPotential,
    caseCompleteness,
    caseHealthScore,
    evidenceSufficiency,
    missingItems: missingItems.length > 0 ? missingItems : ["현재 필수 기초자료는 일부 확인되었습니다."],
    coachAdvice,
    overallOpinion,
    priorityActions: priorityActions.length > 0 ? priorityActions : ["담당 행정사가 입력자료를 최종 검토합니다."],
    warnings: ["본 분석은 mock 규칙 기반 분석이며, 최종 판단은 담당 행정사의 검토가 필요합니다."],
  };
}

function buildAiEvidenceInsight(
  caseItem: Reservation,
  logs: ReservationConsultLog[] = [],
  evidenceFiles: ReservationFile[] = [],
): AiEvidenceInsight {
  const registeredEvidenceTypes = Array.from(new Set(evidenceFiles.map(getEvidenceTypeLabel)));
  const hasConsultation = logs.length > 0 || hasText(caseItem.consultation_log);
  const hasAdminMemo = hasText(caseItem.admin_memo);
  const hasSubmittedDocuments = hasText(asText(caseItem.submitted_documents));
  const hasVideo = registeredEvidenceTypes.some((type) => ["CCTV/영상", "녹음/음성"].includes(type));
  const hasStatement = registeredEvidenceTypes.includes("진술서/문서");
  const hasImage = registeredEvidenceTypes.includes("사진/이미지");
  const hasSchoolDocument = hasSubmittedDocuments || registeredEvidenceTypes.includes("학교자료/공문");
  const evidenceScore = clampScore(
    Math.min(evidenceFiles.length * 18, 54) +
      (hasVideo ? 14 : 0) +
      (hasStatement ? 12 : 0) +
      (hasImage ? 8 : 0) +
      (hasSchoolDocument ? 8 : 0) +
      (hasConsultation ? 8 : 0) +
      (hasAdminMemo ? 6 : 0),
  );
  const evidenceGrade = getEvidenceGrade(evidenceScore);
  const missingEvidence = [
    !hasVideo ? "CCTV 또는 녹음 등 객관자료" : "",
    !hasStatement ? "학생 진술서" : "",
    "목격자 진술 또는 연락처",
    !hasSchoolDocument ? "학교자료 및 학폭위 관련 문서" : "",
    !hasConsultation ? "상담기록과 사실관계 정리" : "",
  ].filter(hasText);
  const recommendedEvidence = [
    !hasVideo ? "CCTV 원본 또는 캡처본 확보" : "",
    !hasStatement ? "피해학생·관련학생 진술서 확보" : "",
    "목격자 진술서 확보",
    !hasSchoolDocument ? "학교 조사자료, 통지서, 회의자료 확보" : "",
    !hasImage ? "상처, 훼손물, 대화 화면 등 사진자료 확보" : "",
  ].filter(hasText);
  const usageDirection = [
    hasVideo ? "영상·음성자료는 시간순 사실관계 확인에 우선 활용합니다." : "객관자료가 확보되기 전까지 진술 간 일치 여부를 먼저 정리합니다.",
    hasStatement ? "진술서는 행위, 일시, 장소, 목격자를 기준으로 쟁점을 분리합니다." : "진술서 확보 후 의견서의 사실관계 부분에 반영합니다.",
    hasSchoolDocument ? "학교자료는 절차 진행상황과 처분사유 검토에 활용합니다." : "학교자료 확보 후 제출기한과 절차상 쟁점을 확인합니다.",
  ];

  return {
    analyzedAt: new Date().toLocaleString("ko-KR", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    cautions: [
      "증거자료의 원본성, 촬영일시, 제출 가능 여부를 확인하십시오.",
      "현재 자료만으로 사실관계를 단정하지 말고 상담기록과 학교자료를 함께 검토하십시오.",
    ],
    evidenceGrade,
    evidenceScore,
    missingEvidence: missingEvidence.length > 0 ? missingEvidence : ["핵심 증거자료는 비교적 충실하게 등록되었습니다."],
    recommendedEvidence:
      recommendedEvidence.length > 0 ? recommendedEvidence : ["등록된 증거의 원본성, 제출기한, 개인정보 포함 여부를 최종 점검하십시오."],
    registeredEvidenceTypes:
      registeredEvidenceTypes.length > 0 ? registeredEvidenceTypes : ["등록된 증거자료 없음"],
    usageDirection,
  };
}

function buildAiDocumentReadiness(
  caseItem: Reservation,
  logs: ReservationConsultLog[] = [],
  events: ReservationEvent[] = [],
  evidenceFiles: ReservationFile[] = [],
  aiEvidenceInsight?: AiEvidenceInsight,
  aiCaseInsight?: AiCaseInsight,
): AiDocumentReadiness {
  const consultationTexts = [
    caseItem.student_type,
    caseItem.studentRole,
    caseItem.consultation_type,
    caseItem.consultationType,
    caseItem.case_status,
    caseItem.summary,
    caseItem.content,
    caseItem.consultation_log,
    caseItem.admin_memo,
    caseItem.diagnosis_summary,
    asText(caseItem.submitted_documents),
    ...logs.map((log) => log.content),
  ]
    .filter(hasText)
    .join(" ");
  const hasConsultation = logs.length > 0 || hasText(caseItem.consultation_log);
  const hasCaseSummary = hasText(caseItem.summary) || hasText(caseItem.content) || hasText(caseItem.diagnosis_summary);
  const hasEvidence = evidenceFiles.length > 0;
  const hasEvents = events.length > 0;
  const hasAdminMemo = hasText(caseItem.admin_memo);
  const readinessScore = clampScore(
    (hasConsultation ? 20 : 0) +
      (hasCaseSummary ? 15 : 0) +
      (hasEvidence ? 20 : 0) +
      (hasEvents ? 10 : 0) +
      (hasAdminMemo ? 10 : 0) +
      (aiEvidenceInsight ? 10 : 0) +
      (aiCaseInsight ? 15 : 0),
  );
  const readinessLevel = getDocumentReadinessLevel(readinessScore);
  const availableDocuments: string[] = [];
  const notReadyDocuments: string[] = [];
  const addDocumentStatus = (documentName: string, isAvailable: boolean) => {
    if (isAvailable) {
      availableDocuments.push(documentName);
      return;
    }

    notReadyDocuments.push(documentName);
  };
  const opinionReadyCount = [hasConsultation, hasCaseSummary, hasEvidence].filter(Boolean).length;
  const reflectionReady = /가해학생|상대학생|조치수위|반성/.test(consultationTexts);
  const petitionReady = /보호자|학부모|선처|반성|재발방지/.test(consultationTexts);
  const statementReady = hasConsultation || hasCaseSummary;
  const appealKeywordCount = getUniqueKeywordMatchCount(consultationTexts, [
    "불복",
    "조치결정",
    "생기부",
    "4호",
    "5호",
    "6호",
    "7호",
    "8호",
    "9호",
  ]);
  const appealReady = (aiCaseInsight?.appealPotential === "보통" || aiCaseInsight?.appealPotential === "높음") || appealKeywordCount > 0;

  addDocumentStatus("의견서", opinionReadyCount >= 2);
  addDocumentStatus("반성문", reflectionReady);
  addDocumentStatus("탄원서", petitionReady);
  addDocumentStatus("진술서", statementReady);
  addDocumentStatus("증거목록", hasEvidence);
  addDocumentStatus("행정심판 청구서", appealReady);

  const recommendedOrder = [
    !hasEvidence ? "증거자료 확보 후 문서작성 권장" : "",
    hasEvents ? "제출기한 기준으로 의견서 우선 작성 권장" : "",
    "사건개요 정리",
    "증거목록 작성",
    "의견서 초안 작성",
    "필요 시 반성문/탄원서 작성",
    "조치결정 후 행정심판 검토",
    aiCaseInsight?.appealPotential === "높음" || appealKeywordCount >= 2
      ? "조치결정서 확보 후 행정심판 청구서 검토 권장"
      : "",
  ].filter(hasText);

  return {
    analyzedAt: new Date().toLocaleString("ko-KR", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    availableDocuments: availableDocuments.length > 0 ? availableDocuments : ["현재 작성 가능 후보 문서 없음"],
    cautionPoints: [
      "본 문서작성 준비도는 등록된 사건자료를 기준으로 한 참고용 분석입니다.",
      "실제 제출 문서는 담당 행정사의 검토 후 확정해야 합니다.",
      "개인정보, 민감정보, 학생 이름은 제출 전 익명화 또는 최소공개 여부를 검토해야 합니다.",
      "증거 없는 사실은 문서에 단정적으로 기재하지 않도록 주의해야 합니다.",
    ],
    missingRequirements: [
      !hasConsultation ? "상담기록 보완 필요" : "",
      !hasEvidence ? "증거자료 등록 필요" : "",
      !hasEvents ? "의견서 제출기한 또는 학폭위 일정 확인 필요" : "",
      !hasAdminMemo ? "담당자 검토 메모 필요" : "",
      !hasCaseSummary ? "사건요약 정리 필요" : "",
    ].filter(hasText),
    notReadyDocuments: notReadyDocuments.length > 0 ? notReadyDocuments : ["현재 기준 준비 부족 문서 없음"],
    readinessLevel,
    readinessScore,
    recommendedOrder,
  };
}

function buildAiOpinionDraft(
  caseItem: Reservation,
  logs: ReservationConsultLog[] = [],
  events: ReservationEvent[] = [],
  evidenceFiles: ReservationFile[] = [],
  aiDocumentReadiness?: AiDocumentReadiness,
  aiEvidenceInsight?: AiEvidenceInsight,
  aiCaseInsight?: AiCaseInsight,
): AiOpinionDraft {
  const sourceText = [
    caseItem.student_type,
    caseItem.studentRole,
    caseItem.consultation_type,
    caseItem.consultationType,
    caseItem.case_status,
    caseItem.summary,
    caseItem.content,
    caseItem.consultation_log,
    caseItem.admin_memo,
    caseItem.diagnosis_summary,
    asText(caseItem.submitted_documents),
    ...logs.map((log) => log.content),
  ]
    .filter(hasText)
    .join(" ");
  const opinionType = getOpinionDraftType(caseItem, sourceText);
  const hasConsultation = logs.length > 0 || hasText(caseItem.consultation_log);
  const hasCaseSummary = hasText(caseItem.summary) || hasText(caseItem.content) || hasText(caseItem.diagnosis_summary);
  const hasEvidence = evidenceFiles.length > 0;
  const hasEvents = events.length > 0;
  const hasAdminMemo = hasText(caseItem.admin_memo);
  const readinessScore =
    aiDocumentReadiness?.readinessScore ??
    clampScore(
      (hasConsultation ? 25 : 0) +
        (hasCaseSummary ? 20 : 0) +
        (hasEvidence ? 25 : 0) +
        (hasEvents ? 10 : 0) +
        (hasAdminMemo ? 10 : 0) +
        (aiCaseInsight ? 10 : 0),
    );
  const readinessLevel = getOpinionDraftReadinessLevel(readinessScore, hasConsultation || hasCaseSummary);
  const timelineStep = getCaseProgressInfo(caseItem.case_status).step;
  const evidenceTypes = Array.from(new Set(evidenceFiles.map(getEvidenceTypeLabel)));
  const issueKeywords = getAiIssueKeywords(sourceText);
  const hasSubmittedDocuments = hasText(asText(caseItem.submitted_documents));
  const appealReviewNeeded =
    aiCaseInsight?.appealPotential === "보통" ||
    aiCaseInsight?.appealPotential === "높음" ||
    /불복|조치결정|생기부|4호|5호|6호|7호|8호|9호/.test(sourceText);
  const roleLabel =
    opinionType === "피해학생 측"
      ? "피해학생 측"
      : opinionType === "가해학생 측"
        ? "상대학생 측"
        : opinionType === "보호자"
          ? "보호자 측"
          : "당사자 측";
  const keyIssues = Array.from(
    new Set([
      ...issueKeywords,
      "학교폭력 해당성 및 사실관계 확인",
      hasEvidence ? "제출자료의 신빙성 및 사실관계 연결성" : "증거자료 보완 필요성",
      aiCaseInsight?.actionRiskLevel === "높음" || aiCaseInsight?.actionRiskLevel === "매우높음"
        ? "조치수위 및 생활기록부 영향"
        : "",
      appealReviewNeeded ? "조치결정 이후 불복 가능성" : "",
    ]),
  ).filter(hasText);
  const supplementItems = [
    !hasConsultation ? "상담기록 또는 구체 진술 보완 필요" : "",
    !hasCaseSummary ? "사건 발생 경위와 시간순 사건개요 정리 필요" : "",
    !hasEvidence ? "증거자료 등록 및 증거목록 정리 필요" : "",
    !hasEvents ? "학폭위 일정 또는 의견서 제출기한 확인 필요" : "",
    !hasAdminMemo ? "담당자 검토 메모 보완 필요" : "",
    readinessLevel === "작성보류" ? "현재 자료만으로 제출용 의견서 확정은 보류 권장" : "",
  ].filter(hasText);
  const requestsByType: Record<AiOpinionDraft["opinionType"], string[]> = {
    "가해학생 측": [
      "행위 경위와 관여 정도를 구체적으로 구분하여 판단해 주시기 바랍니다.",
      "반성, 재발방지 노력, 관계 회복 가능성을 함께 고려해 주시기 바랍니다.",
      "조치수위는 사실관계와 증거에 비례하여 신중하게 결정해 주시기 바랍니다.",
    ],
    "보호자": [
      "학생의 상황과 보호자의 지도·관리 계획을 함께 고려해 주시기 바랍니다.",
      "학생 보호와 교육적 회복에 필요한 절차가 충분히 보장되기를 요청합니다.",
      "불필요한 개인정보 공개가 확대되지 않도록 심의 과정에서 유의해 주시기 바랍니다.",
    ],
    "일반 의견서": [
      "확인된 사실관계와 제출자료를 중심으로 공정하게 판단해 주시기 바랍니다.",
      "당사자 진술과 객관자료가 서로 일치하는 부분을 우선 검토해 주시기 바랍니다.",
      "절차 진행 과정에서 제출기한과 의견진술 기회가 보장되기를 요청합니다.",
    ],
    "피해학생 측": [
      "피해 내용과 지속성, 학생의 심리적 영향을 충분히 고려해 주시기 바랍니다.",
      "재발 방지와 피해학생 보호조치가 실효성 있게 이루어지기를 요청합니다.",
      "객관자료와 진술자료를 종합하여 사실관계를 면밀히 확인해 주시기 바랍니다.",
    ],
  };
  const cautions = [
    "본 초안은 등록된 사건자료를 기준으로 한 mock 초안이며, 실제 제출 전 담당 행정사의 검토가 필요합니다.",
    "학생 이름, 연락처, 학교명 등 개인정보는 제출 전 익명화 또는 최소공개 여부를 확인해야 합니다.",
    "증거로 확인되지 않은 사실은 단정적으로 기재하지 말고 확인 필요 표현으로 조정해야 합니다.",
    "상담 원문과 증거 파일명은 개인정보가 포함될 수 있어 본 초안에 직접 노출하지 않았습니다.",
  ];
  const sections: AiOpinionDraft["sections"] = {
    caseOverview: [
      `본 건은 ${roleLabel} 의견서 초안으로, 현재 사건 단계는 ${timelineStep}로 분류됩니다.`,
      hasCaseSummary
        ? "등록된 사건요약 또는 상담요약을 기준으로 기본 사건 흐름을 정리할 수 있습니다."
        : "사건요약이 충분하지 않아 발생 경위와 시간순 정리가 우선 필요합니다.",
      hasEvents
        ? `등록된 일정 ${events.length}건을 기준으로 제출기한과 절차 진행상황을 확인해야 합니다.`
        : "제출기한 또는 학폭위 일정이 아직 명확히 등록되지 않았습니다.",
    ],
    evidenceAndReferences: [
      hasEvidence
        ? `현재 등록된 증거유형은 ${evidenceTypes.join(", ")}이며, 총 ${evidenceFiles.length}건의 자료가 확인됩니다.`
        : "현재 등록된 증거자료가 없어 증거목록 작성 전 자료 확보가 필요합니다.",
      hasSubmittedDocuments ? "제출서류 정보가 등록되어 있어 기존 제출자료와 중복 여부를 확인할 수 있습니다." : "제출서류 정보는 추가 확인이 필요합니다.",
      aiEvidenceInsight
        ? `AI 증거분석 기준 증거등급은 ${aiEvidenceInsight.evidenceGrade}, 증거점수는 ${aiEvidenceInsight.evidenceScore}점입니다.`
        : "AI 증거분석 결과가 없으므로 증거자료의 활용 방향은 별도 검토가 필요합니다.",
    ],
    keyIssues,
    partyPosition: [
      opinionType === "피해학생 측"
        ? "피해학생 측은 피해 사실, 지속성, 심리적 영향, 보호 필요성을 중심으로 의견을 정리합니다."
        : "",
      opinionType === "가해학생 측"
        ? "상대학생 측은 행위 경위, 관여 정도, 반성 여부, 재발방지 계획을 중심으로 의견을 정리합니다."
        : "",
      opinionType === "보호자"
        ? "보호자 측은 학생의 현재 상태, 보호자의 지도 계획, 교육적 회복 가능성을 중심으로 의견을 정리합니다."
        : "",
      opinionType === "일반 의견서"
        ? "당사자 측은 확인된 사실관계와 절차상 요청사항을 중심으로 의견을 정리합니다."
        : "",
      hasConsultation
        ? `상담기록 ${logs.length}건과 입력된 상담 내용을 기준으로 당사자 입장을 구조화할 수 있습니다.`
        : "상담기록이 부족하여 당사자 입장과 구체 진술 보완이 필요합니다.",
    ].filter(hasText),
    requests: requestsByType[opinionType],
    supplementItems: supplementItems.length > 0 ? supplementItems : ["현재 기준 필수 보완사항은 제한적이나, 제출 전 최신 사실관계와 증거 원본성을 재확인해야 합니다."],
    cautions,
  };
  const draftText = createOpinionDraftText({
    opinionType,
    readinessLevel,
    readinessScore,
    sections,
  });

  return {
    analyzedAt: new Date().toLocaleString("ko-KR", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    draftText,
    opinionType,
    readinessLevel,
    readinessScore,
    sections,
  };
}

function buildAiCaseSummary(
  caseItem: Reservation,
  logs: ReservationConsultLog[] = [],
  events: ReservationEvent[] = [],
  evidenceFiles: ReservationFile[] = [],
) {
  const consultationTexts = [
    caseItem.summary,
    caseItem.consultation_log,
    caseItem.content,
    caseItem.diagnosis_summary,
    ...logs.map((log) => log.content),
  ].filter(hasText);
  const adminMemo = caseItem.admin_memo?.trim() ?? "";
  const timelineStep = getCaseProgressInfo(caseItem.case_status).step;
  const sortedEvents = sortReservationEvents(events);
  const checklistItems = getCaseChecklistItems(caseItem, logs, events);
  const completedChecklistItems = checklistItems.filter((item) => item.completed).map((item) => item.label);
  const pendingChecklistItems = checklistItems.filter((item) => !item.completed).map((item) => item.label);
  const importantEvents = sortedEvents
    .filter((event) => isImportantReservationEvent(event) || !event.completed)
    .slice(0, 3)
    .map((event) => `${formatEventDateTime(event)} ${event.event_type}${event.completed ? " 완료" : " 예정"}`);

  const hasConsultation = consultationTexts.length > 0;
  const hasEvidence = evidenceFiles.length > 0;
  const hasEvents = events.length > 0;
  const hasAdminMemo = hasText(adminMemo);
  const issueKeywords = getAiIssueKeywords([...consultationTexts, adminMemo].join(" "));

  const overview = hasConsultation
    ? [
        `- 현재 사건은 ${caseItem.student_type || "학생구분 미확인"} 건으로 접수되어 ${timelineStep} 단계에서 관리 중입니다.`,
        `- 상담자료는 ${consultationTexts.length}건, 상담기록은 ${logs.length}건 확인되며 입력 내용 기준으로 사건 흐름을 검토할 수 있습니다.`,
        importantEvents.length > 0
          ? `- 주요 일정은 ${importantEvents.join(", ")}로 확인됩니다.`
          : "- 사건 타임라인상 세부 일정은 아직 충분히 등록되지 않았습니다.",
        completedChecklistItems.length > 0
          ? `- 체크리스트상 완료 항목은 ${completedChecklistItems.slice(0, 4).join(", ")}입니다.`
          : "- 체크리스트상 완료된 후속 절차는 아직 제한적입니다.",
      ]
    : ["- 현재 입력된 사건자료가 부족하여 추가 확인이 필요합니다."];

  const partyPosition = hasConsultation
    ? [
        `- 상담유형은 ${caseItem.consultation_type || caseItem.consultationType || "미확인"}이며, 학생구분은 ${
          caseItem.student_type || caseItem.studentRole || "미확인"
        }입니다.`,
        `- ${getGeneralizedPartyLabel(caseItem.student_type)} 측 진술을 중심으로 기초 사실관계가 접수된 상태입니다.`,
        "- 상대학생 측 입장, 보호자 의견, 학교 측 확인 내용은 별도 자료로 추가 확인이 필요합니다.",
      ]
    : ["- 당사자 입장은 추가 확인이 필요합니다."];

  const coreIssues = [
    ...issueKeywords.map((keyword) => `- ${keyword}`),
    "- 학교폭력 해당성 여부",
    "- 피해 주장 내용의 입증 가능성",
    "- 고의성·지속성 여부",
    "- 반성 및 화해 여부",
    "- 조치수위 및 생활기록부 영향",
  ];

  const missingInfo = [
    !hasConsultation ? "- 상담기록 추가 필요" : "",
    !hasEvidence ? "- 증거자료 등록 필요" : "",
    !hasEvents ? "- 학폭위 또는 제출기한 일정 확인 필요" : "",
    !hasAdminMemo ? "- 담당자 검토 메모 추가 필요" : "",
  ].filter(Boolean);

  const nextActions = [
    !hasConsultation ? "- 상담기록 보완" : "",
    !hasEvidence ? "- 증거자료 추가 등록" : "",
    !hasEvents || !events.some((event) => event.event_type === "학폭위 개최") ? "- 학폭위 일정 확인" : "",
    !events.some((event) => event.event_type === "의견서 제출") ? "- 의견서 제출기한 확인" : "",
    !hasAdminMemo ? "- 관리자 메모로 검토사항 정리" : "",
    pendingChecklistItems.length > 0 ? `- 미완료 체크리스트 확인: ${pendingChecklistItems.slice(0, 3).join(", ")}` : "",
  ].filter(Boolean);

  return [
    "AI 사건요약 결과",
    "",
    "1. 사건 개요",
    ...overview,
    "",
    "2. 당사자 입장",
    ...partyPosition,
    "",
    "3. 핵심 쟁점",
    ...Array.from(new Set(coreIssues)),
    "",
    "4. 부족 정보",
    ...(missingInfo.length > 0 ? missingInfo : ["- 현재 필수 기초자료는 일부 확인되나, 최신 사실관계와 제출기한은 계속 점검이 필요합니다."]),
    "",
    "5. 다음 조치",
    ...(nextActions.length > 0 ? nextActions : ["- 입력자료를 기준으로 담당 행정사가 최종 검토 후 후속 조치를 확정합니다."]),
    "",
    "6. 주의사항",
    "- 본 AI 사건요약은 입력된 사건자료를 바탕으로 자동 생성된 참고용 초안입니다. 최종 판단 및 제출 여부는 담당 행정사의 검토 후 결정해야 합니다.",
  ].join("\n");
}

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function createPrivateSafeCaseText(values: Array<string | null | undefined>, privateValues: string[]) {
  return removePrivateIdentifiers(values.filter(hasText).join("\n"), privateValues).slice(0, 1200);
}

function createCaseTextSnippets(text: string) {
  return text
    .split(/\n+|[.!?。！？]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8)
    .slice(0, 5)
    .map((item) => item.slice(0, 80));
}

function removePrivateIdentifiers(text: string, privateValues: string[]) {
  return privateValues.reduce((current, value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return current;
    }

    return current.split(trimmedValue).join("");
  }, text)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\b\d{2,3}-?\d{3,4}-?\d{4}\b/g, "")
    .trim();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getEvidenceSufficiency(evidenceCount: number, hasConsultation: boolean, hasAdminMemo: boolean) {
  const baseScore = evidenceCount <= 0 ? 20 : evidenceCount === 1 ? 40 : evidenceCount === 2 ? 60 : 80;
  const adjustedScore = baseScore + (hasConsultation ? 10 : 0) + (hasAdminMemo ? 10 : 0);
  return clampScore(adjustedScore);
}

function getEvidenceGrade(score: number): AiEvidenceInsight["evidenceGrade"] {
  if (score >= 85) {
    return "A";
  }

  if (score >= 70) {
    return "B";
  }

  if (score >= 50) {
    return "C";
  }

  return "D";
}

function getEvidenceTypeLabel(file: ReservationFile) {
  const fileName = file.file_name.toLowerCase();
  const mimeType = file.mime_type?.toLowerCase() ?? "";
  const extension = fileName.split(".").pop() ?? "";

  if (mimeType.startsWith("video/") || ["mp4", "mov", "avi", "webm"].includes(extension) || fileName.includes("cctv")) {
    return "CCTV/영상";
  }

  if (mimeType.startsWith("audio/") || ["mp3", "wav", "m4a"].includes(extension) || fileName.includes("녹음")) {
    return "녹음/음성";
  }

  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return "사진/이미지";
  }

  if (fileName.includes("학교") || fileName.includes("통지") || fileName.includes("회의") || fileName.includes("학폭")) {
    return "학교자료/공문";
  }

  if (["pdf", "doc", "docx", "hwp"].includes(extension)) {
    return "진술서/문서";
  }

  return "기타자료";
}

function getAiInsightConfidence({
  hasAdminMemo,
  hasConsultation,
  hasEvidence,
  hasEvents,
}: {
  hasAdminMemo: boolean;
  hasConsultation: boolean;
  hasEvidence: boolean;
  hasEvents: boolean;
}) {
  const coreDataCount = [hasConsultation, hasEvidence, hasEvents].filter(Boolean).length;

  if (hasConsultation && hasEvidence && hasEvents && hasAdminMemo) {
    return 85;
  }

  if (coreDataCount >= 2) {
    return 70;
  }

  if (coreDataCount === 1 || hasAdminMemo) {
    return 50;
  }

  return 40;
}

function buildAiCoachAdvice({
  actionRiskLevel,
  appealPotential,
  hasAdminMemo,
  hasConsultation,
  hasEvidence,
  hasEvents,
}: {
  actionRiskLevel: AiCaseInsight["actionRiskLevel"];
  appealPotential: AiCaseInsight["appealPotential"];
  hasAdminMemo: boolean;
  hasConsultation: boolean;
  hasEvidence: boolean;
  hasEvents: boolean;
}): AiCaseInsight["coachAdvice"] {
  const recommendations = [
    !hasConsultation ? "상담기록을 먼저 작성하세요." : "",
    !hasConsultation ? "사실관계를 먼저 정리하세요." : "",
    !hasEvidence ? "CCTV 확보" : "",
    !hasEvidence ? "학생 진술서 확보" : "",
    !hasEvidence ? "목격자 확보" : "",
    !hasEvidence ? "학교자료 확보" : "",
    !hasEvents ? "학폭위 일정 확인" : "",
    !hasEvents ? "제출기한 등록" : "",
    !hasAdminMemo ? "사건 핵심쟁점 메모" : "",
    !hasAdminMemo ? "담당자 검토사항 작성" : "",
    actionRiskLevel !== "낮음" ? "조치수위 검토" : "",
    actionRiskLevel !== "낮음" ? "생활기록부 영향 검토" : "",
    appealPotential !== "낮음" ? "처분사유 확인" : "",
    appealPotential !== "낮음" ? "불복 가능성 검토" : "",
  ].filter(hasText);
  const priority = [
    !hasEvidence ? "증거자료 확보" : "",
    !hasConsultation ? "상담기록 보완" : "",
    !hasEvents ? "학폭위 일정 등록" : "",
    !hasAdminMemo ? "사건 핵심쟁점 메모" : "",
    actionRiskLevel !== "낮음" ? "생활기록부 영향 검토" : "",
    appealPotential !== "낮음" ? "행정심판 검토" : "",
    "의견서 작성",
  ].filter(hasText);
  const uniquePriority = Array.from(new Set(priority));
  const uniqueRecommendations = Array.from(new Set(recommendations));
  const expectedNextStepByPriority: Record<string, string> = {
    "증거자료 확보": "증거자료 등록",
    "상담기록 보완": "상담기록 작성",
    "학폭위 일정 등록": "학폭위 일정 확인",
    "사건 핵심쟁점 메모": "관리자 메모 작성",
    "생활기록부 영향 검토": "생활기록부 영향 검토",
    "행정심판 검토": "행정심판 검토",
    "의견서 작성": "의견서 작성",
  };

  return {
    caution: [
      "현재 자료만으로 학교폭력 해당 여부를 단정하지 마십시오.",
      "증거 확보 후 의견서 작성을 권장합니다.",
    ],
    expectedNextStep: expectedNextStepByPriority[uniquePriority[0]] ?? "의견서 작성",
    priority: uniquePriority,
    recommendations: uniqueRecommendations.length > 0 ? uniqueRecommendations : ["입력자료를 최종 점검하고 의견서 작성을 준비하세요."],
  };
}

function buildOverallOpinion(
  insight: Pick<
    AiCaseInsight,
    | "actionRiskLevel"
    | "aiConfidence"
    | "appealPotential"
    | "caseCompleteness"
    | "caseHealthScore"
    | "evidenceSufficiency"
    | "missingItems"
    | "priorityActions"
  >,
) {
  const scoreOpinion =
    insight.caseHealthScore >= 80
      ? "현재 사건자료가 비교적 충실하게 정리되어 있어 의견서 작성 또는 심의 준비 단계로 진행할 수 있습니다."
      : insight.caseHealthScore >= 60
        ? "기본 사건자료는 일부 정리되어 있으나, 증거자료와 일정 등 보완자료를 추가 확인하는 것이 좋습니다."
        : insight.caseHealthScore >= 40
          ? "현재 사건자료가 일부 부족하여 추가 상담기록, 증거자료, 일정 확인이 우선 필요합니다."
          : "현재 입력자료가 부족하여 사건 판단이나 문서작성에 앞서 기본자료 보완이 필요합니다.";
  const evidenceOpinion =
    insight.evidenceSufficiency < 50
      ? "특히 증거자료가 부족하여 피해 주장 또는 사실관계 입증 가능성 검토가 제한될 수 있습니다."
      : insight.evidenceSufficiency < 80
        ? "일부 증거자료는 확보된 것으로 보이나, 핵심 입증자료가 충분한지 추가 확인이 필요합니다."
        : "증거자료는 비교적 충실하게 등록되어 있는 것으로 보입니다.";
  const riskOpinionByLevel: Record<AiCaseInsight["actionRiskLevel"], string> = {
    낮음: "현재 입력자료 기준 조치위험도는 낮은 편으로 표시됩니다.",
    보통: "조치위험도는 보통 수준으로, 사실관계와 증거자료에 따라 판단이 달라질 수 있습니다.",
    높음: "조치위험도가 높게 표시되므로 조치수위와 생활기록부 영향을 함께 검토할 필요가 있습니다.",
    매우높음: "조치위험도가 매우 높게 표시되므로 심의 전 대응전략과 제출자료를 신속히 점검해야 합니다.",
  };
  const appealOpinionByLevel: Record<AiCaseInsight["appealPotential"], string> = {
    낮음: "현재 자료만으로는 행정심판 쟁점이 뚜렷하게 확인되지는 않습니다.",
    보통: "향후 조치결정 내용에 따라 행정심판 가능성을 검토할 필요가 있습니다.",
    높음: "불복 또는 행정심판 가능성이 있으므로 처분 사유와 절차상 쟁점을 함께 검토해야 합니다.",
  };
  const priorityActionText =
    insight.priorityActions.length > 0 ? insight.priorityActions.slice(0, 2).join(", ") : "담당 행정사의 최종 검토";
  const missingOpinion =
    insight.missingItems.length > 0
      ? `우선 보완할 자료는 ${insight.missingItems.slice(0, 3).join(", ")}이며, 다음 우선업무는 ${priorityActionText}입니다.`
      : `현재 필수자료는 비교적 충실하게 입력된 상태이며, 다음 우선업무는 ${priorityActionText}입니다.`;

  return [
    `현재 사건점수는 ${insight.caseHealthScore}점, 사건완성도는 ${insight.caseCompleteness}%, AI 신뢰도는 ${insight.aiConfidence}%입니다.`,
    scoreOpinion,
    evidenceOpinion,
    riskOpinionByLevel[insight.actionRiskLevel],
    appealOpinionByLevel[insight.appealPotential],
    missingOpinion,
  ].join("\n");
}

function getUniqueKeywordMatchCount(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function getActionRiskLevel(riskKeywordCount: number): AiCaseInsight["actionRiskLevel"] {
  if (riskKeywordCount >= 6) {
    return "매우높음";
  }

  if (riskKeywordCount >= 4) {
    return "높음";
  }

  if (riskKeywordCount >= 2) {
    return "보통";
  }

  return "낮음";
}

function getAppealPotential(
  appealKeywordCount: number,
  actionRiskLevel: AiCaseInsight["actionRiskLevel"],
): AiCaseInsight["appealPotential"] {
  if (appealKeywordCount >= 2) {
    return "높음";
  }

  if (appealKeywordCount === 1 || actionRiskLevel === "높음" || actionRiskLevel === "매우높음") {
    return "보통";
  }

  return "낮음";
}

function getRiskBadge(level: AiCaseInsight["actionRiskLevel"]) {
  const badgeByLevel: Record<AiCaseInsight["actionRiskLevel"], { className: string; icon: string }> = {
    낮음: { className: "border-green-200 bg-green-50 text-green-700", icon: "🟢" },
    보통: { className: "border-yellow-200 bg-yellow-50 text-yellow-700", icon: "🟡" },
    높음: { className: "border-orange-200 bg-orange-50 text-orange-700", icon: "🟠" },
    매우높음: { className: "border-red-200 bg-red-50 text-red-700", icon: "🔴" },
  };

  return badgeByLevel[level] ?? { className: "border-slate-200 bg-slate-50 text-slate-700", icon: "⚪" };
}

function getAppealBadge(level: AiCaseInsight["appealPotential"]) {
  const badgeByLevel: Record<AiCaseInsight["appealPotential"], { className: string; icon: string }> = {
    낮음: { className: "border-green-200 bg-green-50 text-green-700", icon: "🟢" },
    보통: { className: "border-yellow-200 bg-yellow-50 text-yellow-700", icon: "🟡" },
    높음: { className: "border-red-200 bg-red-50 text-red-700", icon: "🔴" },
  };

  return badgeByLevel[level] ?? { className: "border-slate-200 bg-slate-50 text-slate-700", icon: "⚪" };
}

function getDocumentReadinessLevel(score: number): AiDocumentReadiness["readinessLevel"] {
  if (score >= 80) {
    return "작성적합";
  }

  if (score >= 60) {
    return "작성가능";
  }

  if (score >= 40) {
    return "보통";
  }

  return "부족";
}

function getDocumentReadinessBadge(level: AiDocumentReadiness["readinessLevel"]) {
  const badgeByLevel: Record<AiDocumentReadiness["readinessLevel"], { className: string; icon: string }> = {
    부족: { className: "border-red-200 bg-red-50 text-red-700", icon: "🔴" },
    보통: { className: "border-yellow-200 bg-yellow-50 text-yellow-700", icon: "🟡" },
    작성가능: { className: "border-green-200 bg-green-50 text-green-700", icon: "🟢" },
    작성적합: { className: "border-blue-200 bg-blue-50 text-blue-700", icon: "🔵" },
  };

  return badgeByLevel[level];
}

function getOpinionDraftType(caseItem: Reservation, sourceText: string): AiOpinionDraft["opinionType"] {
  const studentTypeText = [caseItem.student_type, caseItem.studentRole].filter(hasText).join(" ");
  const combinedText = [studentTypeText, sourceText].join(" ");

  if (/피해학생|피해자|피해/.test(combinedText)) {
    return "피해학생 측";
  }

  if (/가해학생|가해자|상대학생|조치수위|반성/.test(combinedText)) {
    return "가해학생 측";
  }

  if (/보호자|학부모|부모|선처|재발방지/.test(combinedText)) {
    return "보호자";
  }

  return "일반 의견서";
}

function getOpinionDraftReadinessLevel(score: number, hasBaseNarrative: boolean): AiOpinionDraft["readinessLevel"] {
  if (!hasBaseNarrative || score < 40) {
    return "작성보류";
  }

  if (score < 70) {
    return "보완필요";
  }

  return "초안작성가능";
}

function getOpinionDraftReadinessBadge(level: AiOpinionDraft["readinessLevel"]) {
  const badgeByLevel: Record<AiOpinionDraft["readinessLevel"], { className: string; icon: string }> = {
    작성보류: { className: "border-red-200 bg-red-50 text-red-700", icon: "🔴" },
    보완필요: { className: "border-yellow-200 bg-yellow-50 text-yellow-700", icon: "🟡" },
    초안작성가능: { className: "border-green-200 bg-green-50 text-green-700", icon: "🟢" },
  };

  return badgeByLevel[level];
}

function createOpinionDraftText({
  opinionType,
  readinessLevel,
  readinessScore,
  sections,
}: Pick<AiOpinionDraft, "opinionType" | "readinessLevel" | "readinessScore" | "sections">) {
  const formatSection = (title: string, items: string[]) => [
    title,
    ...items.map((item, index) => `${index + 1}. ${item}`),
  ];

  return [
    `[AI 의견서 초안 - ${opinionType}]`,
    `작성 준비도: ${readinessLevel} (${readinessScore}점)`,
    "",
    ...formatSection("1. 사건 개요", sections.caseOverview),
    "",
    ...formatSection("2. 당사자 입장", sections.partyPosition),
    "",
    ...formatSection("3. 주요 쟁점", sections.keyIssues),
    "",
    ...formatSection("4. 증거 및 참고자료", sections.evidenceAndReferences),
    "",
    ...formatSection("5. 요청사항", sections.requests),
    "",
    ...formatSection("6. 보완 필요사항", sections.supplementItems),
    "",
    ...formatSection("7. 주의 문구", sections.cautions),
  ].join("\n");
}

function getReasonStatusBadge(status: AiCaseInsight["analysisReasons"][number]["status"]) {
  const badgeByStatus: Record<AiCaseInsight["analysisReasons"][number]["status"], { className: string; icon: string }> = {
    충족: { className: "border-green-200 bg-green-50 text-green-700", icon: "🟢" },
    부족: { className: "border-red-200 bg-red-50 text-red-700", icon: "🔴" },
    확인필요: { className: "border-yellow-200 bg-yellow-50 text-yellow-700", icon: "🟡" },
  };

  return badgeByStatus[status];
}

function getGeneralizedPartyLabel(studentType?: string) {
  const normalizedType = studentType?.trim() ?? "";

  if (normalizedType.includes("피해")) {
    return "피해학생";
  }

  if (normalizedType.includes("가해")) {
    return "상대학생";
  }

  if (normalizedType.includes("학부모") || normalizedType.includes("보호자")) {
    return "보호자";
  }

  return "당사자";
}

function getAiIssueKeywords(text: string) {
  const issueRules = [
    { keyword: "폭행·상해 관련 사실관계", pattern: /폭행|상해|신체|때렸|맞았|밀쳤/ },
    { keyword: "언어폭력·모욕 관련 사실관계", pattern: /욕설|모욕|명예|비방|협박|언어/ },
    { keyword: "사이버폭력 또는 온라인 증거 확인", pattern: /카톡|카카오|메신저|SNS|온라인|문자|채팅|캡처|캡쳐/ },
    { keyword: "따돌림·지속성 여부", pattern: /따돌림|왕따|괴롭힘|지속|반복/ },
    { keyword: "증거자료의 신빙성 및 제출 가능성", pattern: /증거|녹음|영상|사진|진단서|자료/ },
    { keyword: "학교 조사 및 학폭위 절차 대응", pattern: /학폭위|학교|조사|위원회|심의|의견서/ },
  ];

  return issueRules.filter((rule) => rule.pattern.test(text)).map((rule) => rule.keyword);
}

function getConsultationWorkflowTargetStatus(consultationType: string) {
  return ["전화", "방문", "화상"].includes(consultationType) ? "1차상담" : null;
}

function getEventWorkflowTargetStatus(eventType: string) {
  const statusByEventType: Record<string, string> = {
    자료요청: "자료요청",
    자료제출: "자료검토",
    "의견서 작성": "심의준비",
    "의견서 제출": "심의준비",
    "학폭위 개최": "심의완료",
    조치결정: "심의완료",
    "행정심판 검토": "행정심판검토",
    "행정심판 청구": "행정심판검토",
    종결: "종결",
  };

  return statusByEventType[eventType] ?? null;
}

function getNextWorkflowEventType(eventType: string) {
  const nextEventTypeByEventType: Record<string, string> = {
    자료요청: "자료제출",
    자료제출: "의견서 작성",
    "의견서 작성": "학폭위 개최",
    "의견서 제출": "학폭위 개최",
    "학폭위 개최": "행정심판 검토",
    조치결정: "행정심판 검토",
    "행정심판 검토": "종결",
    "행정심판 청구": "종결",
  };

  return nextEventTypeByEventType[eventType] ?? null;
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

function getCaseProgressInfo(caseStatus?: string) {
  const step = getTimelineCurrentStep(caseStatus);
  const index = Math.max(caseTimelineSteps.indexOf(step), 0);
  const percent = Math.round(((index + 1) / caseTimelineSteps.length) * 100);

  return { index, percent, step };
}

function getNextReservationEvent(events: ReservationEvent[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return sortReservationEvents(events).find(
    (event) => !event.completed && new Date(`${event.event_date}T00:00`).getTime() >= today.getTime(),
  );
}

function isImportantReservationEvent(event: ReservationEvent) {
  return ["학폭위 개최", "의견서 제출", "행정심판 청구"].includes(event.event_type);
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
