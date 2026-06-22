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
  hasThreat: boolean;
  hasApology: boolean;
  hasReconciliation: boolean;
  hasAgreement: boolean;
  hasRecovery: boolean;
  hasPreventionPromise: boolean;
  hasEvidence: boolean;
  hasRecordOrAppealKeyword: boolean;
  hasContinuousHarassment: boolean;
  hasBullying: boolean;
  hasSnsPost: boolean;
  hasGroupHarassment: boolean;
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

  const hasNoTwoWeekDiagnosis = includesAny(normalized, [
    '2주이상진단서없음',
    '2주진단서없음',
    '전치2주아님',
    '진단서없음',
    '진단서미제출',
  ]);
  const hasNoPropertyDamage = includesAny(normalized, [
    '재산피해없음',
    '물적피해없음',
    '금전피해없음',
    '파손없음',
  ]);
  const hasNoRetaliation = includesAny(normalized, [
    '보복행위없음',
    '보복없음',
    '협박없음',
    '위협없음',
  ]);
  const hasOneTimeIssue = includesAny(normalized, [
    '1회발생',
    '한차례',
    '한번',
    '일회성',
    '처음',
  ]);

  return {
    hasTwoWeekDiagnosis:
      !hasNoTwoWeekDiagnosis &&
      includesAny(normalized, [
        '2주이상진단서',
        '2주진단서',
        '전치2주',
        '진단서2주',
        '14일진단',
        '2주이상치료',
      ]),
    hasNoTwoWeekDiagnosis,
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
    hasPropertyDamage:
      !hasNoPropertyDamage &&
      includesAny(normalized, [
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
    hasNoPropertyDamage,
    hasImmediateRecovery: includesAny(normalized, [
      '즉시복구',
      '바로복구',
      '원상복구',
      '변상완료',
      '배상완료',
      '수리완료',
    ]),
    hasRepeatedIssue:
      !hasOneTimeIssue &&
      includesAny(normalized, [
        '반복',
        '지속',
        '지속적',
        '계속',
        '여러번',
        '수차례',
        '매일',
        '상습',
      ]),
    hasOneTimeIssue,
    hasRetaliation:
      !hasNoRetaliation &&
      includesAny(normalized, [
        '보복',
        '신고했다는이유',
        '신고후',
        '입막음',
        '가만두지',
      ]),
    hasNoRetaliation,
    hasThreat:
      !hasNoRetaliation &&
      includesAny(normalized, [
        '협박',
        '위협',
        '겁박',
        '가만두지',
      ]),
    hasApology: includesAny(normalized, ['사과']),
    hasReconciliation: includesAny(normalized, ['화해', '관계회복']),
    hasAgreement: includesAny(normalized, ['합의', '용서']),
    hasRecovery: includesAny(normalized, [
      '피해회복',
      '회복',
      '복구',
      '변상완료',
      '배상완료',
    ]),
    hasPreventionPromise: includesAny(normalized, [
      '재발방지약속',
      '재발방지',
      '다시는안',
      '약속',
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
    hasBullying: includesAny(normalized, [
      '따돌림',
      '왕따',
      '괴롭힘',
    ]),
    hasSnsPost: includesAny(normalized, [
      'sns게시',
      'sns에게시',
      '단톡방게시',
      '온라인게시',
      '게시글',
      '유포',
    ]),
    hasGroupHarassment: includesAny(normalized, [
      '집단괴롭힘',
      '여럿이',
      '여러명이',
      '단체로',
      '집단따돌림',
    ]),
  };
};

const getRiskLevel = (analysis: ContentAnalysis) => {
  const score = [
    analysis.hasTwoWeekDiagnosis,
    analysis.hasPhysicalViolence,
    analysis.hasPropertyDamage && !analysis.hasImmediateRecovery,
    analysis.hasRepeatedIssue,
    analysis.hasRetaliation,
    analysis.hasThreat,
    analysis.hasContinuousHarassment,
    analysis.hasBullying,
    analysis.hasSnsPost,
    analysis.hasGroupHarassment,
    analysis.hasRecordOrAppealKeyword,
  ].filter(Boolean).length;

  if (score >= 3) return '높음';
  if (score >= 1) return '보통';
  return '낮음';
};

const getReasons = (analysis: ContentAnalysis) => {
  const reasons = [];

  if (analysis.hasTwoWeekDiagnosis) reasons.push('2주 이상 진단서 또는 치료 관련 표현이 확인됩니다');
  if (analysis.hasPhysicalViolence) reasons.push('신체폭력 정황이 포함되어 있습니다');
  if (analysis.hasPropertyDamage) reasons.push('재산피해 관련 내용이 포함되어 있습니다');
  if (analysis.hasImmediateRecovery) reasons.push('피해 복구 또는 배상 완료 정황이 있습니다');
  if (analysis.hasRepeatedIssue) reasons.push('지속성 또는 반복성 정황이 있습니다');
  if (analysis.hasRetaliation) reasons.push('보복행위 정황이 있습니다');
  if (analysis.hasThreat) reasons.push('협박 또는 위협 정황이 있습니다');
  if (analysis.hasApology || analysis.hasReconciliation || analysis.hasAgreement) {
    reasons.push('사과, 화해 또는 합의 관련 표현이 있습니다');
  }
  if (analysis.hasEvidence) reasons.push('카카오톡, CCTV, 녹음, 목격자 등 증거자료 표현이 있습니다');
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
  if (analysis.hasRetaliation || analysis.hasThreat) {
    checklist.push('보복행위 또는 협박 발생 시점과 구체적 내용');
  }

  return checklist.join(', ');
};

const getD02Message = (analysis: ContentAnalysis): DiagnosisMessage => {
  const positiveChecks = [
    analysis.hasApology,
    analysis.hasReconciliation,
    analysis.hasAgreement,
    analysis.hasOneTimeIssue,
    analysis.hasNoPropertyDamage,
    analysis.hasNoRetaliation,
    analysis.hasNoTwoWeekDiagnosis,
    analysis.hasRecovery,
    analysis.hasPreventionPromise,
  ];
  const positiveCount = positiveChecks.filter(Boolean).length;

  const seriousCase =
    analysis.hasTwoWeekDiagnosis ||
    analysis.hasRepeatedIssue ||
    analysis.hasRetaliation ||
    analysis.hasPhysicalViolence ||
    (analysis.hasPropertyDamage && !analysis.hasImmediateRecovery) ||
    analysis.hasContinuousHarassment ||
    analysis.hasThreat ||
    analysis.hasBullying ||
    analysis.hasSnsPost ||
    analysis.hasGroupHarassment;

  if (seriousCase) {
    return {
      judgment: '학교장 자체해결이 어려울 수 있습니다.',
      reason:
        '2주 이상 진단서, 반복, 보복, 신체폭력, 재산피해, 지속적 괴롭힘, 협박, 따돌림, SNS 게시, 집단 괴롭힘 중 하나 이상의 중대 키워드가 확인됩니다.',
      checklist:
        '진단서 기간, 반복 발생 내역, 보복 또는 협박 여부, 신체폭력 정도, 재산피해 복구 여부, 온라인 게시물 및 집단 괴롭힘 자료를 정리해 주세요.',
    };
  }

  if (positiveCount >= 2) {
    return {
      judgment: '학교장 자체해결 가능성이 높습니다.',
      reason: `사과, 화해, 합의, 1회 발생, 재산피해 없음, 보복행위 없음, 2주 이상 진단서 없음, 피해 회복, 재발 방지 약속 중 ${positiveCount}개 긍정 요소가 확인됩니다.`,
      checklist:
        '피해 학생 및 보호자의 자체해결 동의 여부, 사과의 진정성, 피해 회복 정도, 재발 방지 약속의 구체성, 학교의 자체해결 요건 확인 절차를 추가로 확인해 주세요.',
    };
  }

  return {
    judgment: '추가 확인 필요',
    reason:
      '중대 키워드는 뚜렷하지 않지만 학교장 자체해결 가능성을 판단할 긍정 요소가 2개 미만입니다.',
    checklist:
      '사과, 화해, 합의, 1회 발생 여부, 재산피해 없음, 보복행위 없음, 2주 이상 진단서 없음, 피해 회복, 재발 방지 약속 여부를 구체적으로 확인해 주세요.',
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
      judgment: `치료 및 장기 피해 검토 필요성: ${analysis.hasTwoWeekDiagnosis ? '높음' : level}`,
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
        analysis.hasRetaliation || analysis.hasRepeatedIssue || analysis.hasThreat ? '높음' : level
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
