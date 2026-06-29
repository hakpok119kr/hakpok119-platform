import { NextResponse } from "next/server";

type CaseAnalysisRequest = {
  student_name?: string;
  studentName?: string;
  case_status?: string;
  caseStatus?: string;
  consultation_content?: string;
  consultationContent?: string;
  submitted_documents?: string | string[];
  submittedDocuments?: string | string[];
  incident_summary?: string;
  incidentSummary?: string;
  user_role?: string;
  userRole?: string;
  existing_opinion?: string;
  existingOpinion?: string;
};

type NormalizedCaseAnalysisRequest = {
  studentName: string;
  caseStatus: string;
  consultationContent: string;
  submittedDocuments: string;
  incidentSummary: string;
  userRole: string;
  existingOpinion: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

  let payload: CaseAnalysisRequest;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 데이터를 확인할 수 없습니다." }, { status: 400 });
  }

  try {
    const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
    const response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify({
        input: [
          {
            content: [
              {
                text: buildCaseAnalysisPrompt(normalizePayload(payload)),
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
      return NextResponse.json({ error: "AI 사건분석 생성 중 오류가 발생했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const analysis = extractResponseText(data);

    if (!analysis) {
      return NextResponse.json({ error: "AI 사건분석 생성 중 오류가 발생했습니다." }, { status: 502 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("OpenAI Responses API request failed", error);
    return NextResponse.json({ error: "AI 사건분석 생성 중 오류가 발생했습니다." }, { status: 502 });
  }
}

function normalizePayload(payload: CaseAnalysisRequest): NormalizedCaseAnalysisRequest {
  return {
    caseStatus: safeText(payload.case_status ?? payload.caseStatus, 120) || "사건상태 미확인",
    consultationContent:
      safeText(payload.consultation_content ?? payload.consultationContent, 2400) || "상담기록이 입력되지 않았습니다.",
    existingOpinion:
      safeText(payload.existing_opinion ?? payload.existingOpinion, 1800) || "기존 의견서 내용이 없습니다.",
    incidentSummary:
      safeText(payload.incident_summary ?? payload.incidentSummary, 1800) || "사건요약이 입력되지 않았습니다.",
    studentName: safeText(payload.student_name ?? payload.studentName, 80) || "학생명 미입력",
    submittedDocuments:
      safeSubmittedDocuments(payload.submitted_documents ?? payload.submittedDocuments) || "제출자료가 입력되지 않았습니다.",
    userRole: safeText(payload.user_role ?? payload.userRole, 120) || "사용자 역할 미확인",
  };
}

function safeSubmittedDocuments(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value.map((item) => safeText(item, 240)).filter(Boolean).join("\n").slice(0, 1800);
  }

  return safeText(value, 1800);
}

function safeText(value: unknown, maxLength: number) {
  return removeSensitiveText(String(value ?? "")).slice(0, maxLength);
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

function buildCaseAnalysisPrompt(payload: NormalizedCaseAnalysisRequest) {
  return [
    "너는 학교폭력 사건을 검토하는 전문 행정사이다.",
    "",
    "작성 기준:",
    "- 학교폭력예방법 및 일반적인 학교폭력 사안처리 절차를 고려한다.",
    "- 단정적 표현을 피한다.",
    "- '가능성이 있습니다', '검토가 필요합니다', '자료 보완이 필요합니다' 형식으로 작성한다.",
    "- 법률상 최종 판단처럼 표현하지 않는다.",
    "- 피해학생 측, 가해학생 측, 보호자 측 모두 활용 가능한 객관적 분석 문체로 작성한다.",
    "- 개인정보는 과도하게 반복하지 않는다.",
    "- 상담기록에 없는 사실을 임의로 만들어내지 않는다.",
    "- 각 항목은 개조식으로 작성한다.",
    "",
    "사건자료:",
    `- 학생명 또는 식별명: ${payload.studentName}`,
    `- 사건상태: ${payload.caseStatus}`,
    `- 사용자 역할: ${payload.userRole}`,
    `- 사건요약: ${payload.incidentSummary}`,
    `- 상담기록: ${payload.consultationContent}`,
    `- 제출자료: ${payload.submittedDocuments}`,
    `- 기존 의견서 내용: ${payload.existingOpinion}`,
    "",
    "반드시 아래 순서와 제목으로 작성한다.",
    "1. 사건요약",
    "2. 핵심쟁점",
    "3. 법적·절차적 검토사항",
    "4. 필요한 증거 및 추가자료",
    "5. 위험요소",
    "6. 유리한 요소",
    "7. 예상 진행방향",
    "8. 행정사 검토의견",
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
