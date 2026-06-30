import { NextResponse } from 'next/server';

type CaseStrategyRequest = {
  caseStatus?: string;
  consultationType?: string;
  studentRole?: string;
  consultationContent?: string;
  caseContent?: string;
  hasSubmittedDocuments?: boolean;
  hasEvidence?: boolean;
  existingCaseSummary?: string;
  existingCaseAnalysis?: string;
  existingCaseOpinion?: string;
  checklistStatus?: {
    completed?: string[];
    pending?: string[];
  };
  submittedDocumentStatus?: string;
  evidenceTypes?: string[];
  riskReference?: string;
};

type AiCaseStrategyResponse = {
  ok: boolean;
  result?: string;
  error?: string;
  model?: string;
  promptVersion?: string;
};

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const PROMPT_VERSION = 'case_strategy_v1';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonResponse({ ok: false, error: 'OPENAI_API_KEY가 설정되어 있지 않습니다.' });
  }

  let payload: CaseStrategyRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: '요청 데이터를 확인할 수 없습니다.' }, 400);
  }

  try {
    const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
    const response = await fetch('https://api.openai.com/v1/responses', {
      body: JSON.stringify({
        input: [
          {
            content: [
              {
                text: buildCaseStrategyPrompt(sanitizePayload(payload)),
                type: 'input_text',
              },
            ],
            role: 'user',
          },
        ],
        model,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('OpenAI Responses API error', response.status, errorText);
      return jsonResponse({ ok: false, error: 'AI 대응전략 생성 중 오류가 발생했습니다.' }, 502);
    }

    const data = await response.json();
    const result = extractResponseText(data);

    if (!result) {
      return jsonResponse({ ok: false, error: 'AI 대응전략 생성 중 오류가 발생했습니다.' }, 502);
    }

    return jsonResponse({ ok: true, model, promptVersion: PROMPT_VERSION, result });
  } catch (error) {
    console.error('OpenAI Responses API request failed', error);
    return jsonResponse({ ok: false, error: 'AI 대응전략 생성 중 오류가 발생했습니다.' }, 502);
  }
}

function jsonResponse(body: AiCaseStrategyResponse, status = body.ok ? 200 : 500) {
  return NextResponse.json(body, { status });
}

function sanitizePayload(payload: CaseStrategyRequest): CaseStrategyRequest {
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
    existingCaseAnalysis: safeLongText(payload.existingCaseAnalysis),
    existingCaseOpinion: safeLongText(payload.existingCaseOpinion),
    existingCaseSummary: safeLongText(payload.existingCaseSummary),
    hasEvidence: Boolean(payload.hasEvidence),
    hasSubmittedDocuments: Boolean(payload.hasSubmittedDocuments),
    riskReference: safeLongText(payload.riskReference),
    studentRole: generalizeStudentRole(payload.studentRole),
    submittedDocumentStatus: safeLongText(payload.submittedDocumentStatus),
  };
}

function safeList(values?: string[]) {
  return Array.isArray(values) ? values.map(safeText).filter(Boolean).slice(0, 16) : [];
}

function safeText(value?: string) {
  return removeSensitiveText(String(value ?? '')).slice(0, 160);
}

function safeLongText(value?: string) {
  return removeSensitiveText(String(value ?? '')).slice(0, 2200);
}

function removeSensitiveText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')
    .replace(/\b\d{2,3}-?\d{3,4}-?\d{4}\b/g, '')
    .replace(/\b\d{6}-?[1-4]\d{6}\b/g, '')
    .replace(/[가-힣A-Za-z0-9]+(?:초등학교|중학교|고등학교|초|중|고|학교)/g, '학교')
    .replace(/\b\d{1,2}\s*학년\s*\d{1,2}\s*반\b/g, '학급')
    .replace(/[가-힣A-Za-z]+(?:로|길)\s*\d+(?:-\d+)?/g, '주소')
    .replace(/(?:피해|가해|관련)?\s*학생\s*[가-힣]{2,4}(?=\s|은|는|이|가|을|를|과|와|,|\.|$)/g, '학생')
    .trim();
}

function generalizeStudentRole(value?: string) {
  const text = safeText(value);

  if (text.includes('피해')) {
    return '피해학생';
  }

  if (text.includes('가해')) {
    return '가해학생';
  }

  if (text.includes('보호') || text.includes('학부모')) {
    return '보호자';
  }

  return '관련학생';
}

function buildCaseStrategyPrompt(payload: CaseStrategyRequest) {
  return [
    '당신은 학교폭력 사건 대응전략을 작성하는 전문 행정 실무자입니다.',
    '아래 사건자료를 바탕으로 관리자 검토용 AI 대응전략 초안을 작성해 주세요.',
    '',
    '작성 원칙:',
    '- 개인정보는 포함하지 마세요.',
    "- 확인되지 않은 사실은 단정하지 말고 '추가 확인 필요'라고 표시하세요.",
    '- 법률적 최종 판단처럼 표현하지 말고 실무 검토용 초안으로 작성하세요.',
    '- 피해학생 측과 가해학생 측 모두에서 활용 가능한 균형 잡힌 대응전략으로 작성하세요.',
    '',
    '사건자료:',
    `- 사건상태: ${payload.caseStatus || '미확인'}`,
    `- 상담유형: ${payload.consultationType || '미확인'}`,
    `- 학생구분: ${payload.studentRole || '관련학생'}`,
    `- 상담내용: ${payload.consultationContent || '미입력'}`,
    `- 사건내용: ${payload.caseContent || '미입력'}`,
    `- 제출자료 보유 여부: ${payload.hasSubmittedDocuments ? '예' : '아니오'}`,
    `- 증거자료 보유 여부: ${payload.hasEvidence ? '예' : '아니오'}`,
    `- 증거자료 유형: ${payload.evidenceTypes?.length ? payload.evidenceTypes.join(', ') : '미등록'}`,
    `- 기존 AI 사건요약: ${payload.existingCaseSummary || '없음'}`,
    `- 기존 AI 사건분석: ${payload.existingCaseAnalysis || '없음'}`,
    `- 기존 AI 상담의견서: ${payload.existingCaseOpinion || '없음'}`,
    `- 제출문서 상태: ${payload.submittedDocumentStatus || '미확인'}`,
    `- 조치수위 및 위험 참고자료: ${
      payload.riskReference || '현재 연결된 D04/D05 결과 없음. 입력된 상담예약과 상담기록 기준으로 검토'
    }`,
    '',
    '반드시 아래 구조와 제목으로 작성하세요.',
    '',
    '1. 사건 핵심 쟁점',
    '- 해당 사건에서 가장 중요한 쟁점',
    '- 피해 주장과 가해 주장 중 충돌되는 부분',
    '- 학폭위에서 다툼이 될 가능성이 높은 부분',
    '',
    '2. 피해학생 대응전략',
    '- 지금 해야 할 일',
    '- 학교에 요청할 사항',
    '- 보호조치 검토',
    '- 진술 준비 방향',
    '- 추가 증거 확보 방향',
    '',
    '3. 가해학생 대응전략',
    '- 감경요소 정리',
    '- 반성문 준비 방향',
    '- 화해 및 회복 노력',
    '- 재발방지 노력',
    '- 생활기록부 기재 최소화 전략',
    '',
    '4. 보호자 행동요령',
    '- 담임교사 대응',
    '- 학교폭력 담당교사 대응',
    '- 학폭위 전 준비사항',
    '- 감정적 대응을 피해야 할 부분',
    '- 제출자료 정리 방법',
    '',
    '5. 학교 제출자료',
    '- 의견서',
    '- 사실확인서',
    '- 증거목록',
    '- 진단서',
    '- 상담기록',
    '- 카카오톡/문자/녹취 등',
    '',
    '6. 추가 확보자료',
    '□ CCTV',
    '□ 위클래스 상담기록',
    '□ 병원진단서',
    '□ 카카오톡',
    '□ 문자',
    '□ 녹취',
    '□ 친구 진술',
    '□ 담임 상담내용',
    '□ 출결자료',
    '□ 사진/영상자료',
    '',
    '7. 예상 쟁점',
    '- 지속성',
    '- 고의성',
    '- 심각성',
    '- 반성 여부',
    '- 화해 여부',
    '- 피해 회복 여부',
    '- 입증 가능성',
    '',
    '8. 예상 조치수위 위험',
    '- 현재 입력된 사건정보를 기준으로 예상 위험도를 설명',
    '- D04 조치수위 예측, D05 4호 이상 위험도 진단 결과가 있다면 참고',
    '- 연결된 결과가 부족하면 selectedReservation과 기존 상담기록 기준이라고 명시',
    '',
    '9. 향후 일정 체크리스트',
    '오늘:',
    '□ 사건 경위 정리',
    '□ 관련 증거 백업',
    '',
    '3일 이내:',
    '□ 담임 또는 담당교사 상담',
    '□ 추가자료 확보',
    '',
    '1주일 이내:',
    '□ 의견서 초안 작성',
    '□ 제출자료 목록 정리',
    '',
    '학폭위 전:',
    '□ 진술 연습',
    '□ 보호자 의견 정리',
    '□ 예상 질문 대비',
    '',
    '학폭위 후:',
    '□ 조치결정 검토',
    '□ 행정심판 또는 집행정지 검토',
  ].join('\n');
}

function extractResponseText(data: unknown) {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const response = data as { output_text?: unknown; output?: unknown };

  if (typeof response.output_text === 'string') {
    return response.output_text.trim();
  }

  if (!Array.isArray(response.output)) {
    return '';
  }

  return response.output
    .flatMap((item) => {
      if (!item || typeof item !== 'object' || !('content' in item) || !Array.isArray(item.content)) {
        return [];
      }

      return item.content
        .map((contentItem) => {
          if (!contentItem || typeof contentItem !== 'object' || !('text' in contentItem)) {
            return '';
          }

          return typeof contentItem.text === 'string' ? contentItem.text : '';
        })
        .filter(Boolean);
    })
    .join('\n')
    .trim();
}
