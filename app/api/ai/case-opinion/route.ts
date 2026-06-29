import { NextResponse } from "next/server";

type CaseOpinionRequest = {
  caseStatus?: string;
  consultationType?: string;
  studentRole?: string;
  consultationContent?: string;
  caseContent?: string;
  hasSubmittedDocuments?: boolean;
  hasEvidence?: boolean;
  existingCaseSummary?: string;
  checklistStatus?: {
    completed?: string[];
    pending?: string[];
  };
  submittedDocumentStatus?: string;
  evidenceTypes?: string[];
};

type AiCaseOpinionResponse = {
  ok: boolean;
  result?: string;
  error?: string;
  model?: string;
  promptVersion?: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const PROMPT_VERSION = "case_opinion_v1";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonResponse({ ok: false, error: "OPENAI_API_KEY가 설정되지 않았습니다." });
  }

  let payload: CaseOpinionRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "요청 데이터를 확인할 수 없습니다." }, 400);
  }

  try {
    const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
    const response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify({
        input: [
          {
            content: [
              {
                text: buildCaseOpinionPrompt(sanitizePayload(payload)),
                type: "input_text",
              },
            ],
            role: "user",
          },
        ],
        model,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("OpenAI Responses API error", response.status, errorText);
      return jsonResponse({ ok: false, error: "AI 상담의견서 생성 중 오류가 발생했습니다." }, 502);
    }

    const data = await response.json();
    const result = extractResponseText(data);

    if (!result) {
      return jsonResponse({ ok: false, error: "AI 상담의견서 생성 중 오류가 발생했습니다." }, 502);
    }

    return jsonResponse({ ok: true, model, promptVersion: PROMPT_VERSION, result });
  } catch (error) {
    console.error("OpenAI Responses API request failed", error);
    return jsonResponse({ ok: false, error: "AI 상담의견서 생성 중 오류가 발생했습니다." }, 502);
  }
}

function jsonResponse(body: AiCaseOpinionResponse, status = body.ok ? 200 : 500) {
  return NextResponse.json(body, { status });
}

function sanitizePayload(payload: CaseOpinionRequest): CaseOpinionRequest {
  return {
    caseContent: safeLongText(payload.caseContent),
    caseStatus: safeText(payload.caseStatus),
    checklistStatus: {
      completed: safeList(payload.checklistStatus?.completed),
      pending: safeList(payload.checklistStatus?.pending),
    },
    consultationContent: safeLongText(payload.consultationContent),
    consultationType: safeText(payload.consultationType),
    evidenceTypes: safeList(payload.evidenceTypes),
    existingCaseSummary: safeLongText(payload.existingCaseSummary),
    hasEvidence: Boolean(payload.hasEvidence),
    hasSubmittedDocuments: Boolean(payload.hasSubmittedDocuments),
    studentRole: generalizeStudentRole(payload.studentRole),
    submittedDocumentStatus: safeLongText(payload.submittedDocumentStatus),
  };
}

function safeList(values?: string[]) {
  return Array.isArray(values) ? values.map(safeText).filter(Boolean).slice(0, 12) : [];
}

function safeText(value?: string) {
  return removeSensitiveText(String(value ?? "")).slice(0, 120);
}

function safeLongText(value?: string) {
  return removeSensitiveText(String(value ?? "")).slice(0, 1800);
}

function removeSensitiveText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\b\d{2,3}-?\d{3,4}-?\d{4}\b/g, "")
    .replace(/\b\d{6}-?[1-4]\d{6}\b/g, "")
    .replace(/[가-힣A-Za-z0-9]+(?:초등학교|중학교|고등학교|초|중|고|대학교|학교)/g, "학교")
    .replace(/\b\d{1,2}\s*학년\s*\d{1,2}\s*반\b/g, "학급")
    .replace(/[가-힣A-Za-z]+(?:동|로|길)\s*\d+(?:-\d+)?/g, "주소")
    .replace(/(?:피해|가해|관련)?학생\s*[가-힣]{2,4}(?=\s|은|는|이|가|을|를|과|와|,|\.|$)/g, "학생")
    .trim();
}

function generalizeStudentRole(value?: string) {
  const text = safeText(value);

  if (text.includes("피해")) {
    return "피해학생";
  }

  if (text.includes("가해") || text.includes("상대")) {
    return "가해학생";
  }

  if (text.includes("관련")) {
    return "관련학생";
  }

  if (text.includes("보호자") || text.includes("학부모")) {
    return "보호자";
  }

  return "관련학생";
}

function buildCaseOpinionPrompt(payload: CaseOpinionRequest) {
  const completedChecklist = payload.checklistStatus?.completed?.length
    ? payload.checklistStatus.completed.join(", ")
    : "완료 항목 미확인";
  const pendingChecklist = payload.checklistStatus?.pending?.length
    ? payload.checklistStatus.pending.join(", ")
    : "미완료 항목 미확인";

  return [
    "학교폭력 행정 사건을 관리하는 담당자를 위한 상담의견서 초안을 작성해 주세요.",
    "개인정보 보호가 최우선입니다. 이름, 연락처, 전화번호, 이메일, 주소, 주민등록번호, 학교명, 구체적 학급명, 학생 실명은 포함하지 마세요.",
    "학생은 피해학생, 가해학생, 관련학생, 보호자처럼 일반화된 표현만 사용하세요.",
    "확인되지 않은 사실은 단정하지 말고 '추가 확인 필요'로 표시하세요.",
    "법률적 최종 판단처럼 단정하지 말고 담당 행정사의 검토가 필요한 초안으로 작성하세요.",
    "",
    "사건자료:",
    `- 사건상태: ${payload.caseStatus || "미확인"}`,
    `- 상담유형: ${payload.consultationType || "미확인"}`,
    `- 학생구분: ${payload.studentRole || "관련학생"}`,
    `- 상담내용: ${payload.consultationContent || "미입력"}`,
    `- 사건내용: ${payload.caseContent || "미입력"}`,
    `- 자료제출 여부: ${payload.hasSubmittedDocuments ? "예" : "아니오"}`,
    `- 증거자료 보유 여부: ${payload.hasEvidence ? "예" : "아니오"}`,
    `- 증거자료 유형: ${payload.evidenceTypes?.length ? payload.evidenceTypes.join(", ") : "미등록"}`,
    `- 기존 AI 사건요약 결과: ${payload.existingCaseSummary || "없음"}`,
    `- 체크리스트 완료상태: ${completedChecklist}`,
    `- 체크리스트 미완료상태: ${pendingChecklist}`,
    `- 제출문서 상태: ${payload.submittedDocumentStatus || "미확인"}`,
    "",
    "반드시 다음 목차와 번호를 유지해 작성해 주세요.",
    "1) 사건 개요",
    "2) 사실관계 정리",
    "3) 주요 쟁점",
    "4) 학교폭력 판단요소",
    "   - 심각성",
    "   - 지속성",
    "   - 고의성",
    "   - 반성 여부",
    "   - 화해 여부",
    "   - 피해 정도",
    "5) 예상 조치수위 검토",
    "6) 유리한 사정",
    "7) 불리한 사정",
    "8) 추가 확보 필요자료",
    "9) 종합 의견",
    "10) 향후 대응방안",
    "11) 행정사 검토 필요사항",
  ].join("\n");
}

function extractResponseText(data: unknown) {
  if (!data || typeof data !== "object") {
    return "";
  }

  const response = data as { output_text?: unknown; output?: unknown };

  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  if (!Array.isArray(response.output)) {
    return "";
  }

  return response.output
    .flatMap((item) => {
      if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) {
        return [];
      }

      return item.content
        .map((contentItem) => {
          if (!contentItem || typeof contentItem !== "object" || !("text" in contentItem)) {
            return "";
          }

          return typeof contentItem.text === "string" ? contentItem.text : "";
        })
        .filter(Boolean);
    })
    .join("\n")
    .trim();
}
