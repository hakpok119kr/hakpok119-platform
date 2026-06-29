import { NextResponse } from "next/server";

type CaseSummaryRequest = {
  caseStatus?: string;
  studentRole?: string;
  consultationType?: string;
  hasConsultation?: boolean;
  hasEvidence?: boolean;
  hasEvents?: boolean;
  hasAdminMemo?: boolean;
  evidenceTypes?: string[];
  keyIssues?: string[];
};

type AiCaseSummaryResponse = {
  ok: boolean;
  result?: string;
  error?: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-5.5";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonResponse({ ok: false, error: "OPENAI_API_KEY가 설정되지 않았습니다." });
  }

  let payload: CaseSummaryRequest;

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
                text: buildCaseSummaryPrompt(sanitizePayload(payload)),
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
      return jsonResponse({ ok: false, error: "AI 응답 생성 중 오류가 발생했습니다." }, 502);
    }

    const data = await response.json();
    const result = extractResponseText(data);

    if (!result) {
      return jsonResponse({ ok: false, error: "AI 응답 생성 중 오류가 발생했습니다." }, 502);
    }

    return jsonResponse({ ok: true, result });
  } catch {
    return jsonResponse({ ok: false, error: "AI 응답 생성 중 오류가 발생했습니다." }, 502);
  }
}

function jsonResponse(body: AiCaseSummaryResponse, status = body.ok ? 200 : 500) {
  return NextResponse.json(body, { status });
}

function sanitizePayload(payload: CaseSummaryRequest): CaseSummaryRequest {
  return {
    caseStatus: safeText(payload.caseStatus),
    consultationType: safeText(payload.consultationType),
    evidenceTypes: Array.isArray(payload.evidenceTypes) ? payload.evidenceTypes.map(safeText).filter(Boolean) : [],
    hasAdminMemo: Boolean(payload.hasAdminMemo),
    hasConsultation: Boolean(payload.hasConsultation),
    hasEvents: Boolean(payload.hasEvents),
    hasEvidence: Boolean(payload.hasEvidence),
    keyIssues: Array.isArray(payload.keyIssues) ? payload.keyIssues.map(safeText).filter(Boolean) : [],
    studentRole: generalizeStudentRole(payload.studentRole),
  };
}

function safeText(value?: string) {
  return String(value ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\b\d{2,3}-?\d{3,4}-?\d{4}\b/g, "")
    .replace(/[가-힣A-Za-z0-9]+(?:초|중|고|대학교|학교)/g, "학교")
    .trim()
    .slice(0, 80);
}

function generalizeStudentRole(value?: string) {
  const text = safeText(value);

  if (text.includes("피해")) {
    return "피해학생";
  }

  if (text.includes("가해") || text.includes("상대")) {
    return "상대학생";
  }

  if (text.includes("보호자") || text.includes("학부모")) {
    return "보호자";
  }

  return "당사자";
}

function buildCaseSummaryPrompt(payload: CaseSummaryRequest) {
  return [
    "학교폭력 행정 사건의 관리자용 사건요약 초안을 작성해 주세요.",
    "이름, 연락처, 이메일, 학교명 등 개인정보를 직접 포함하지 마세요.",
    "학생은 피해학생, 상대학생, 보호자, 당사자 등 일반화된 표현만 사용하세요.",
    "확인되지 않은 사실은 단정하지 말고 추가 확인 필요로 표시하세요.",
    "",
    "사건자료:",
    `- 사건상태: ${payload.caseStatus || "미확인"}`,
    `- 학생구분: ${payload.studentRole || "당사자"}`,
    `- 상담유형: ${payload.consultationType || "미확인"}`,
    `- 상담기록 있음: ${payload.hasConsultation ? "예" : "아니오"}`,
    `- 증거자료 있음: ${payload.hasEvidence ? "예" : "아니오"}`,
    `- 사건일정 있음: ${payload.hasEvents ? "예" : "아니오"}`,
    `- 관리자 메모 있음: ${payload.hasAdminMemo ? "예" : "아니오"}`,
    `- 증거유형: ${payload.evidenceTypes?.length ? payload.evidenceTypes.join(", ") : "미등록"}`,
    `- 주요 쟁점: ${payload.keyIssues?.length ? payload.keyIssues.join(", ") : "추가 확인 필요"}`,
    "",
    "다음 형식으로 작성해 주세요:",
    "1. 사건 개요",
    "2. 당사자 입장",
    "3. 핵심 쟁점",
    "4. 부족 정보",
    "5. 다음 조치",
    "6. 주의사항",
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
