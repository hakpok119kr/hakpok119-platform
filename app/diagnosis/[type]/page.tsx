'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DIAGNOSIS_STORAGE_KEY_PREFIX = 'diagnosis-result';

type ContentAnalysis = {
  hasTwoWeekDiagnosis: boolean;
  hasNoTwoWeekDiagnosis: boolean;
  hasPhysicalViolence: boolean;
  hasPropertyDamage: boolean;
  hasNoPropertyDamage: boolean;
  hasImmediateRecovery: boolean;
  hasRepeatedIssue: boolean;
  hasOneTimeIssue: boolean;
  hasRetaliation: boolean;
  hasNoRetaliation: boolean;
  hasApologyOrAgreement: boolean;
  hasEvidence: boolean;
  hasRecordOrAppealKeyword: boolean;
  hasContinuousHarassment: boolean;
};

type DiagnosisMessage = {
  judgment: string;
  reason: string;
  checklist: string;
};

const notice =
  '본 결과는 입력 내용을 기준으로 한 1차 검토자료이며, 실제 판단은 학교의 조사 및 심의 결과에 따라 달라질 수 있습니다.';

const includesAny = (content: string, keywords: string[]) =>
  keywords.some((keyword) => content.includes(keyword));

const analyzeContent = (content: string): ContentAnalysis => {
  const normalized = content.replace(/\s/g, '').toLowerCase();

  return {
    hasTwoWeekDiagnosis: includesAny(normalized, [
      '2주이상진단서',
      '2주진단서',
      '전치2주',
      '진단서2주',
      '14일진단',
      '2주이상치료',
    ]),
    hasNoTwoWeekDiagnosis: includesAny(normalized, [
      '2주이상진단서없음',
      '2주진단서없음',
      '전치2주아님',
      '진단서없음',
      '진단서미제출',
    ]),
    hasPhysicalViolence: includesAny(normalized, [
      '신체폭력',
      '폭행',
      '때림',
      '맞음',
      '상해',
      '멱살',
      '밀침',
      '발로',
      '주먹',
    ]),
    hasPropertyDamage: includesAny(normalized, [
      '재산피해',
      '파손',
      '망가뜨',
      '훼손',
      '분실',
      '갈취',
      '돈을뺏',
      '물건을뺏',
      '변상',
    ]),
    hasNoPropertyDamage: includesAny(normalized, [
      '재산피해없음',
      '물적피해없음',
      '금전피해없음',
      '파손없음',
    ]),
    hasImmediateRecovery: includesAny(normalized, [
      '즉시복구',
      '바로복구',
      '원상복구',
      '변상완료',
      '배상완료',
      '수리완료',
    ]),
    hasRepeatedIssue: includesAny(normalized, [
      '반복',
      '지속',
      '지속적',
      '계속',
      '여러번',
      '수차례',
      '매일',
      '상습',
    ]),
    hasOneTimeIssue: includesAny(normalized, [
      '1회발생',
      '한차례',
      '한번',
      '일회성',
      '처음',
    ]),
    hasRetaliation: includesAny(normalized, [
      '보복',
      '신고했다는이유',
      '신고후',
      '협박',
      '위협',
      '입막음',
      '가만두지',
    ]),
    hasNoRetaliation: includesAny(normalized, [
      '보복행위없음',
      '보복없음',
      '협박없음',
      '위협없음',
    ]),
    hasApologyOrAgreement: includesAny(normalized, [
      '사과',
      '화해',
      '합의',
      '용서',
      '재발방지',
      '관계회복',
    ]),
    hasEvidence: includesAny(normalized, [
      '카카오톡',
      '카톡',
      '문자',
      'cctv',
      '녹음',
      '녹취',
      '목격자',
      '사진',
      '영상',
      '진단서',
      '캡처',
      '스크린샷',
    ]),
    hasRecordOrAppealKeyword: includesAny(normalized, [
      '생활기록부',
      '생기부',
      '대입',
      '입시',
      '행정심판',
      '이의신청',
      '불복',
      '처분',
      '조치결정',
    ]),
    hasContinuousHarassment: includesAny(normalized, [
      '지속적괴롭힘',
      '계속괴롭힘',
      '반복괴롭힘',
      '따돌림지속',
    ]),
  };
};

const getRiskLevel = (analysis: ContentAnalysis) => {
  const score = [
    analysis.hasTwoWeekDiagnosis && !analysis.hasNoTwoWeekDiagnosis,
    analysis.hasPhysicalViolence,
    analysis.hasPropertyDamage && !analysis.hasNoPropertyDamage && !analysis.hasImmediateRecovery,
    analysis.hasRepeatedIssue && !analysis.hasOneTimeIssue,
    analysis.hasRetaliation && !analysis.hasNoRetaliation,
    analysis.hasContinuousHarassment,
    analysis.hasRecordOrAppealKeyword,
  ].filter(Boolean).length;

  if (score >= 3) return '높음';
  if (score >= 1) return '보통';
  return '낮음';
};

const getReasons = (analysis: ContentAnalysis) => {
  const reasons = [];

  if (analysis.hasTwoWeekDiagnosis && !analysis.hasNoTwoWeekDiagnosis) {
    reasons.push('2주 이상 진단서 또는 치료 관련 표현이 확인됩니다');
  }
  if (analysis.hasPhysicalViolence) reasons.push('신체폭력 정황이 포함되어 있습니다');
  if (analysis.hasPropertyDamage && !analysis.hasNoPropertyDamage) {
    reasons.push('재산피해 관련 내용이 포함되어 있습니다');
  }
  if (analysis.hasImmediateRecovery) reasons.push('피해 복구 또는 배상 완료 정황이 있습니다');
  if (analysis.hasRepeatedIssue && !analysis.hasOneTimeIssue) {
    reasons.push('지속성 또는 반복성 정황이 있습니다');
  }
  if (analysis.hasRetaliation && !analysis.hasNoRetaliation) {
    reasons.push('보복행위 또는 협박 정황이 있습니다');
  }
  if (analysis.hasApologyOrAgreement) {
    reasons.push('사과, 화해, 합의 또는 재발방지 관련 표현이 있습니다');
  }
  if (analysis.hasEvidence) {
    reasons.push('카카오톡, CCTV, 녹음, 목격자 등 증거자료 표현이 있습니다');
  }
  if (analysis.hasRecordOrAppealKeyword) {
    reasons.push('생활기록부, 대입, 행정심판 등 후속 절차 관련 표현이 있습니다');
  }

  return reasons.length > 0 ? reasons.join(', ') : '입력 내용에서 주요 판단 키워드가 충분히 확인되지 않았습니다';
};

const getCommonChecklist = (analysis: ContentAnalysis) => {
  const checklist = [
    '사건 발생일시와 장소',
    '관련 학생과 목격자',
    '피해 정도와 현재 상태',
  ];

  if (!analysis.hasEvidence) checklist.push('카카오톡, CCTV, 녹음, 사진, 목격자 진술 등 증거자료');
  if (!analysis.hasTwoWeekDiagnosis && !analysis.hasNoTwoWeekDiagnosis) {
    checklist.push('진단서 또는 치료 기록 여부');
  }
  if (analysis.hasPropertyDamage) checklist.push('재산피해 금액과 복구 여부');
  if (analysis.hasRepeatedIssue) checklist.push('반복된 날짜와 횟수');
  if (analysis.hasRetaliation) checklist.push('보복행위 발생 시점과 구체적 내용');

  return checklist.join(', ');
};

const getD02Message = (analysis: ContentAnalysis): DiagnosisMessage => {
  const lightCase =
    analysis.hasNoPropertyDamage &&
    analysis.hasNoTwoWeekDiagnosis &&
    analysis.hasNoRetaliation &&
    analysis.hasOneTimeIssue &&
    analysis.hasApologyOrAgreement;

  const seriousCase =
    (analysis.hasTwoWeekDiagnosis && !analysis.hasNoTwoWeekDiagnosis) ||
    (analysis.hasRepeatedIssue && !analysis.hasOneTimeIssue) ||
    (analysis.hasRetaliation && !analysis.hasNoRetaliation) ||
    analysis.hasPhysicalViolence ||
    (analysis.hasPropertyDamage && !analysis.hasNoPropertyDamage && !analysis.hasImmediateRecovery) ||
    analysis.hasContinuousHarassment;

  if (lightCase) {
    return {
      judgment: '학교장 자체해결 가능성이 높습니다.',
      reason:
        '재산피해 없음, 2주 이상 진단서 없음, 보복행위 없음, 1회 발생, 사과 또는 화해 표현이 함께 확인됩니다.',
      checklist:
        '피해 학생 및 보호자의 동의 여부, 사과의 진정성, 재발방지 약속, 학교의 자체해결 요건 확인 절차를 추가로 확인해 주세요.',
    };
  }

  if (seriousCase) {
    return {
      judgment: '학교장 자체해결이 어려울 수 있습니다.',
      reason:
        '2주 이상 진단서, 반복, 보복, 신체폭력, 재산피해, 지속적 괴롭힘 중 하나 이상의 중한 정황이 확인됩니다.',
      checklist:
        '진단서 기간, 반복 발생 내역, 보복행위 여부, 신체폭력 정도, 재산피해 복구 여부, 피해 학생 보호 필요성을 자료로 정리해 주세요.',
    };
  }

  return {
    judgment: '추가 확인 필요',
    reason:
      '학교장 자체해결 가능성을 판단하기 위한 핵심 정보가 충분하지 않습니다. 특히 진단서, 재산피해, 반복성, 보복행위, 사과 또는 화해 여부가 더 필요합니다.',
    checklist:
      '2주 이상 진단서 여부, 재산피해 및 복구 여부, 발생 횟수, 보복행위 여부, 사과/화해/합의 여부를 구체적으로 확인해 주세요.',
  };
};

const buildTypeMessage = (type: string, analysis: ContentAnalysis): DiagnosisMessage => {
  if (type === 'D02') return getD02Message(analysis);

  const level = getRiskLevel(analysis);
  const reason = getReasons(analysis);
  const checklist = getCommonChecklist(analysis);

  const messages: Record<string, DiagnosisMessage> = {
    D01: {
      judgment: `학교폭력 해당 가능성: ${level}`,
      reason,
      checklist,
    },
    D03: {
      judgment: `증거자료 확보 필요도: ${analysis.hasEvidence ? '보통' : '높음'}`,
      reason,
      checklist,
    },
    D04: {
      judgment: `조치 필요성: ${level}`,
      reason,
      checklist,
    },
    D05: {
      judgment: `치료 및 장기 피해 검토 필요성: ${
        analysis.hasTwoWeekDiagnosis && !analysis.hasNoTwoWeekDiagnosis ? '높음' : level
      }`,
      reason,
      checklist,
    },
    D06: {
      judgment: `생활기록부 영향 검토 필요성: ${
        analysis.hasRecordOrAppealKeyword ? '높음' : level
      }`,
      reason,
      checklist,
    },
    D07: {
      judgment: `전학 또는 분리 조치 검토 필요성: ${
        (analysis.hasRetaliation && !analysis.hasNoRetaliation) ||
        (analysis.hasRepeatedIssue && !analysis.hasOneTimeIssue)
          ? '높음'
          : level
      }`,
      reason,
      checklist,
    },
    D08: {
      judgment: `행정심판 가능성 검토 필요성: ${
        analysis.hasRecordOrAppealKeyword ? '높음' : level
      }`,
      reason,
      checklist,
    },
  };

  return (
    messages[type] ?? {
      judgment: `1차 검토 필요성: ${level}`,
      reason,
      checklist,
    }
  );
};

const buildResult = (type: string, content: string) => {
  const analysis = analyzeContent(content);
  const message = buildTypeMessage(type, analysis);

  return [
    `1차 판단: ${message.judgment}`,
    `이유: ${message.reason}`,
    `추가 확인사항: ${message.checklist}`,
    `공통 고지: ${notice}`,
  ].join('\n\n');
};

export default function DiagnosisInputPage({ params }: { params: { type: string } }) {
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleDiagnosis = () => {
    if (!content.trim()) {
      alert('사건 내용을 입력해 주세요.');
      return;
    }

    const resultId = Date.now().toString();
    const storageKey = `${DIAGNOSIS_STORAGE_KEY_PREFIX}:${resultId}`;
    const result = buildResult(params.type, content);

    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        type: params.type,
        content,
        result,
      })
    );

    router.push(`/diagnosis/result/${resultId}`);
  };

  return (
    <div className="card">
      <h1 className="mb-6 text-2xl font-black">무료진단 입력 - {params.type}</h1>

      <textarea
        className="h-60 w-full rounded-xl border p-3"
        placeholder="사건 발생일, 장소, 관련 학생, 구체적인 내용, 증거자료를 입력해 주세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={handleDiagnosis} className="btn-primary mt-5">
        AI 진단하기
      </button>
    </div>
  );
}
