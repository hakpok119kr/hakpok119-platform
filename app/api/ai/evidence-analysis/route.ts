import { NextResponse } from "next/server";

type EvidenceAnalysisRequest = {
  consultationContent?: string;
  caseContent?: string;
  submittedDocuments?: string;
  uploadedFileNames?: string[];
  existingCaseSummary?: string;
  existingCaseAnalysis?: string;
  existingCaseStrategy?: string;
};

type NormalizedEvidenceAnalysisRequest = {
  consultationContent: string;
  caseContent: string;
  submittedDocuments: string;
  uploadedFileNames: string[];
  existingCaseSummary: string;
  existingCaseAnalysis: string;
  existingCaseStrategy: string;
};

type AiEvidenceAnalysisResponse = {
  ok: boolean;
  result?: string;
  error?: string;
  model?: string;
  promptVersion?: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const PROMPT_VERSION = "evidence_analysis_v1";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonResponse({ ok: false, error: "OPENAI_API_KEY가 설정되어 있지 않습니다." });
  }

  let payload: EvidenceAnalysisRequest;

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
                text: buildEvidenceAnalysisPrompt(normalizePayload(payload)),
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
      return jsonResponse({ ok: false, error: "AI 증거분석 생성 중 오류가 발생했습니다." }, 502);
    }

    const data = await response.json();
    const result = extractResponseText(data);

    if (!result) {
      return jsonResponse({ ok: false, error: "AI 증거분석 생성 중 오류가 발생했습니다." }, 502);
    }

    return jsonResponse({ ok: true, model, promptVersion: PROMPT_VERSION, result });
  } catch (error) {
    console.error("OpenAI Responses API request failed", error);
    return jsonResponse({ ok: false, error: "AI 증거분석 생성 중 오류가 발생했습니다." }, 502);
  }
}

function jsonResponse(body: AiEvidenceAnalysisResponse, status = body.ok ? 200 : 500) {
  return NextResponse.json(body, { status });
}

function normalizePayload(payload: EvidenceAnalysisRequest): NormalizedEvidenceAnalysisRequest {
  return {
    caseContent: safeLongText(payload.caseContent),
    consultationContent: safeLongText(payload.consultationContent),
    existingCaseAnalysis: safeLongText(payload.existingCaseAnalysis),
    existingCaseStrategy: safeLongText(payload.existingCaseStrategy),
    existingCaseSummary: safeLongText(payload.existingCaseSummary),
    submittedDocuments: safeLongText(payload.submittedDocuments),
    uploadedFileNames: Array.isArray(payload.uploadedFileNames)
      ? payload.uploadedFileNames.map(safeText).filter(Boolean).slice(0, 30)
      : [],
  };
}

function safeText(value?: string) {
  return removeSensitiveText(String(value ?? "")).slice(0, 180);
}

function safeLongText(value?: string) {
  return removeSensitiveText(String(value ?? "")).slice(0, 2600);
}

function removeSensitiveText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\b\d{2,3}-?\d{3,4}-?\d{4}\b/g, "")
    .replace(/\b\d{6}-?[1-4]\d{6}\b/g, "")
    .replace(/[가-힣A-Za-z0-9]+(?:초등학교|중학교|고등학교|초|중|고|학교)/g, "학교")
    .replace(/\b\d{1,2}\s*학년\s*\d{1,2}\s*반\b/g, "학급")
    .trim();
}

function buildEvidenceAnalysisPrompt(payload: NormalizedEvidenceAnalysisRequest) {
  return [
    "당신은 학교폭력 사건의 증거자료를 검토하는 행정 실무 보조자입니다.",
    "아래 자료를 바탕으로 관리자 검토용 AI 증거분석 초안을 작성해 주세요.",
    "",
    "작성 원칙:",
    "- 확인되지 않은 사실은 단정하지 말고 '추가 확인 필요'라고 표시하세요.",
    "- 법률적 최종 판단처럼 표현하지 말고 실무 검토용 초안으로 작성하세요.",
    "- 개인정보, 실명, 연락처, 학교명은 포함하지 마세요.",
    "- 반드시 아래 5개 항목만 작성하세요. 다른 항목, 서론, 결론 문구를 추가하지 마세요.",
    "",
    "사건 자료:",
    `- 상담내용: ${payload.consultationContent || "없음"}`,
    `- 사건내용: ${payload.caseContent || "없음"}`,
    `- 제출자료: ${payload.submittedDocuments || "없음"}`,
    `- 업로드 파일명: ${payload.uploadedFileNames.length ? payload.uploadedFileNames.join(", ") : "없음"}`,
    `- 기존 AI 사건요약: ${payload.existingCaseSummary || "없음"}`,
    `- 기존 AI 사건분석: ${payload.existingCaseAnalysis || "없음"}`,
    `- 기존 AI 대응전략: ${payload.existingCaseStrategy || "없음"}`,
    "",
    "출력 형식:",
    "1. 현재 증거 목록",
    "2. 증거별 입증력",
    "3. 부족한 증거",
    "4. 추가 확보하면 좋은 자료",
    "5. 종합 의견",
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
