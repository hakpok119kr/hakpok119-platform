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

type MeasureOptions = {
  position: 'perpetrator' | 'victim';
  incidentContent: string;
  damageLevel: 'minor' | 'middle' | 'severe';
  frequency: 'once' | 'two-three' | 'repeated';
  duration: 'one-day' | 'within-week' | 'within-month' | 'over-month';
  continued: boolean;
  physicalViolence: boolean;
  verbalViolence: boolean;
  cyberViolence: boolean;
  extortion: boolean;
  coercion: boolean;
  sexualIssue: boolean;
  groupAction: boolean;
  weaponUse: boolean;
  retaliation: boolean;
  victimDisabled: boolean;
  intentional: boolean;
  remorse: boolean;
  apology: boolean;
  reconciliation: boolean;
  guardianEffort: boolean;
  previousSimilarCase: boolean;
  firstOffense: boolean;
  hasEvidence: boolean;
  statementSpecificity: 'low' | 'middle' | 'high';
  objectiveEvidence: boolean;
  factualDispute: boolean;
  unclearSchoolViolence: boolean;
  simpleConflict: boolean;
  mutualConflict: boolean;
  witnessConflict: boolean;
  lowMeasureNeed: boolean;
};

type MeasureResultSections = {
  diagnosisType: string;
  inputSummary: string;
  factorAnalysis: string;
  expectedMeasure: string;
  reasons: string;
  mitigatingFactors: string;
  aggravatingFactors: string;
  caution: string;
  nextSteps: string;
};

type AdminAppealOptions = {
  position: 'perpetrator' | 'victim';
  reviewStatus: 'before-review' | 'completed-before-notice' | 'notice-received';
  noticeDate: string;
  offenderMeasures: string[];
  victimMeasures: string[];
  objectionReasons: string[];
  procedureIssues: string[];
  evidenceIssues: string[];
  proportionalityIssues: string[];
  urgency: string[];
};

type AdminAppealResultSections = {
  diagnosisType: string;
  adminAppealV2: true;
  currentPosition: string;
  reviewStatus: string;
  decisionSummary: string;
  filingPeriodReview: string;
  appealNeed: string;
  objectionReasons: string;
  procedureIssues: string;
  evidenceIssues: string;
  proportionalityIssues: string;
  caution: string;
  nextSteps: string;
  preparationDocuments: string;
};

type PrincipalResolutionOptions = {
  incidentContent: string;
  incidentDateOrPeriod: string;
  incidentPlace: string;
  studentRelationship: string;
  violenceTypes: string[];
  diagnosisStatus: 'none' | 'issued' | 'planned' | 'unknown';
  propertyDamageStatus: 'none' | 'restored' | 'promised' | 'unrestored' | 'unknown';
  continuityStatus: 'once' | 'two-three' | 'repeated' | 'unknown';
  retaliationStatus: 'none' | 'suspected' | 'confirmed' | 'unknown';
  committeeIntent: 'not-wanted' | 'wanted' | 'unchecked' | 'unknown';
  apology: boolean;
  remorse: boolean;
  reconciliation: boolean;
  recoveryEffort: boolean;
  guardianCommunication: boolean;
  preventionPromise: boolean;
  riskFactors: string[];
  diagnosisSubmitted: boolean;
  evidenceAvailable: boolean;
  witnessStatement: boolean;
  counselingRecord: boolean;
  victimNeedsChecked: boolean;
};

type PrincipalResolutionResultSections = {
  diagnosisType: string;
  principalResolutionV2: true;
  inputSummary: string;
  possibility: string;
  legalRequirements: string;
  relationshipRecovery: string;
  riskFactors: string;
  additionalChecks: string;
  caution: string;
  nextSteps: string;
  preparationDocuments: string;
};

const notice =
  '본 결과는 입력 내용을 기준으로 한 1차 검토자료이며, 실제 판단은 학교의 조사 및 심의 결과에 따라 달라질 수 있습니다.';

const measureNotice =
  '이 결과는 학교폭력예방법 제17조, 같은 법 시행령 제19조 및 가해학생 조치별 적용 세부기준의 판단요소를 참고한 1차 검토자료이며, 실제 조치는 교육지원청 학교폭력대책심의위원회의 판단에 따라 달라질 수 있습니다.';

const adminAppealCautions = [
  '본 결과는 입력내용을 기준으로 한 1차 검토자료이며, 실제 행정심판 인용 가능성을 보장하지 않습니다.',
  '행정심판은 원칙적으로 처분이 있음을 안 날부터 90일 이내, 처분이 있은 날부터 180일 이내에 청구해야 하므로 통지일 확인이 중요합니다.',
  '4호 이상 조치, 출석정지, 학급교체, 전학 등은 생활기록부와 진학 영향까지 함께 검토가 필요합니다.',
  '피해학생 측은 조치가 낮거나 보호조치가 부족한 경우, 가해학생 측은 조치가 과중하거나 사실관계·절차상 문제가 있는 경우 행정심판 검토가 필요할 수 있습니다.',
];

const preparationDocuments = [
  '조치결정 통지서',
  '학교폭력 사안조사 보고서',
  '심의위원회 회의록 또는 심의 관련 자료',
  '학생 확인서 및 진술서',
  '보호자 의견서',
  '카카오톡, 문자, 녹음, CCTV, 사진 등 증거자료',
  '진단서, 상담확인서, 치료자료',
  '생활기록부 또는 진학 관련 자료',
  '기존 제출 의견서 및 반성문, 탄원서 등',
];

const offenderMeasureOptions = [
  '조치없음',
  '학교폭력 아님',
  '1호 서면사과',
  '2호 접촉·협박·보복행위 금지',
  '3호 교내봉사',
  '4호 사회봉사',
  '5호 특별교육 또는 심리치료',
  '6호 출석정지',
  '7호 학급교체',
  '8호 전학',
  '9호 퇴학',
  '아직 결정 전',
  '모름',
];

const victimMeasureOptions = [
  '심리상담 및 조언',
  '일시보호',
  '치료 및 치료를 위한 요양',
  '학급교체',
  '그 밖의 보호조치',
  '보호조치 없음',
  '아직 결정 전',
  '모름',
];

const perpetratorObjectionOptions = [
  '조치가 너무 높음',
  '학교폭력 인정 자체를 다툼',
  '사실관계가 다름',
  '고의성·지속성이 과대평가됨',
  '반성·화해 등 감경요소가 반영되지 않음',
  '절차상 문제가 있음',
];

const victimObjectionOptions = [
  '가해학생 조치가 너무 낮음',
  '피해 정도가 제대로 반영되지 않음',
  '지속성·고의성이 과소평가됨',
  '보호조치가 부족함',
  '2차 피해 또는 보복 우려가 반영되지 않음',
  '절차상 문제가 있음',
];

const procedureIssueOptions = [
  '진술 기회 부족',
  '자료 열람 또는 의견 제출 기회 부족',
  '심의 통지 문제',
  '조사 내용 누락',
  '증거 판단 누락',
  '이해관계자 참여 문제',
  '절차상 문제 없음',
  '잘 모르겠음',
];

const evidenceIssueOptions = [
  '사실관계가 다름',
  '핵심 증거가 반영되지 않음',
  '목격자 진술이 반영되지 않음',
  '카카오톡, 녹음, CCTV 등 객관자료가 있음',
  '상대방 진술 신빙성에 문제가 있음',
  '증거가 부족함',
  '잘 모르겠음',
];

const proportionalityIssueOptions = [
  '조치가 사안에 비해 과도함',
  '조치가 사안에 비해 약함',
  '유사 사례와 형평이 맞지 않음',
  '생기부 또는 진학 영향이 큼',
  '피해회복 또는 재발방지 필요성이 큼',
  '잘 모르겠음',
];

const urgencyOptions = [
  '집행정지 필요성 있음',
  '생기부 기재 또는 진학 영향 우려',
  '전학·출석정지 등 즉시 영향 있음',
  '긴급성 낮음',
  '잘 모르겠음',
];

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
    { label: '사과', matched: analysis.hasApology },
    { label: '화해', matched: analysis.hasReconciliation },
    { label: '합의', matched: analysis.hasAgreement },
    { label: '1회 발생', matched: analysis.hasOneTimeIssue },
    { label: '재산피해 없음', matched: analysis.hasNoPropertyDamage },
    { label: '보복행위 없음', matched: analysis.hasNoRetaliation },
    { label: '2주 이상 진단서 없음', matched: analysis.hasNoTwoWeekDiagnosis },
    { label: '피해 회복', matched: analysis.hasRecovery },
    { label: '재발 방지 약속', matched: analysis.hasPreventionPromise },
  ];
  const matchedPositiveLabels = positiveChecks
    .filter((check) => check.matched)
    .map((check) => check.label);
  const positiveCount = matchedPositiveLabels.length;

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
      reason: `${matchedPositiveLabels.join(', ')} 등의 긍정 요소가 확인됩니다.`,
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

const getDamageLevelLabel = (damageLevel: MeasureOptions['damageLevel']) => {
  if (damageLevel === 'minor') return '경미';
  if (damageLevel === 'middle') return '중간';
  return '큼';
};

const getFrequencyLabel = (frequency: MeasureOptions['frequency']) => {
  if (frequency === 'once') return '1회';
  if (frequency === 'two-three') return '2~3회';
  return '반복';
};

const getDurationLabel = (duration: MeasureOptions['duration']) => {
  if (duration === 'one-day') return '1일';
  if (duration === 'within-week') return '1주 이내';
  if (duration === 'within-month') return '1개월 이내';
  return '1개월 초과';
};

const getStatementSpecificityLabel = (
  statementSpecificity: MeasureOptions['statementSpecificity']
) => {
  if (statementSpecificity === 'low') return '낮음';
  if (statementSpecificity === 'middle') return '보통';
  return '높음';
};

const joinLines = (items: string[], fallback: string) =>
  items.length > 0 ? items.join('\n') : fallback;

const violenceTypeOptions = [
  '언어폭력',
  '신체폭력',
  '사이버폭력',
  '따돌림',
  '금품갈취',
  '강요',
  '성 관련 사안',
  '기타',
];

const principalRiskOptions = [
  '신체폭력 있음',
  '정신적 피해 호소 큼',
  '단체 채팅방, SNS 등 공개성 있음',
  '다수 학생 관련',
  '피해학생 등교 거부 또는 상담 요청',
  '증거자료가 많음',
  '피해학생 측이 강하게 문제제기함',
];

const principalPreparationDocuments = [
  '사건 발생일시 및 장소 정리',
  '관련 학생 관계 정리',
  '피해 내용 및 피해회복 여부',
  '진단서 제출 여부 확인',
  '재산피해 복구 또는 복구 약속 자료',
  '사과문, 반성문, 재발방지 약속',
  '카카오톡, 문자, 사진, 녹음, CCTV 등 증거자료',
  '피해학생 및 보호자 의사 확인 내용',
  '담임교사 또는 상담교사 상담 기록',
];

const principalCautions = [
  '학교장 자체해결은 피해학생 및 보호자가 심의위원회 개최를 원하지 않고, 법정요건을 모두 충족하는 경우에만 가능합니다.',
  '사과, 반성, 화해가 있더라도 2주 이상 진단서, 지속성, 보복행위, 피해학생 측 심의 개최 의사 등이 있으면 자체해결이 어려울 수 있습니다.',
  '전담기구 심의 전 진단서 제출 여부, 재산피해 복구 여부, 피해학생 측 의사를 반드시 확인해야 합니다.',
  '본 결과는 입력내용 기준의 1차 검토자료이며, 실제 판단은 학교 전담기구 및 교육지원청 절차에 따라 달라질 수 있습니다.',
];

const getYesNoLabel = (value: boolean) => (value ? '있음' : '없음');

const getPrincipalLabel = (value: string) => {
  const labels: Record<string, string> = {
    none: '없음',
    issued: '있음',
    planned: '발급 예정 또는 검토 중',
    unknown: '모름',
    restored: '있음, 즉시 복구 완료',
    promised: '있음, 복구 약속 있음',
    unrestored: '있음, 복구 안 됨',
    once: '1회성',
    'two-three': '2~3회',
    repeated: '반복 또는 지속',
    suspected: '보복행위 의심',
    confirmed: '보복행위 있음',
    'not-wanted': '원하지 않음',
    wanted: '원함',
    unchecked: '아직 확인 안 됨',
  };

  return labels[value] ?? value;
};

const calculatePrincipalResolutionResult = (
  options: PrincipalResolutionOptions
): PrincipalResolutionResultSections => {
  const blockerReasons = [];
  if (options.diagnosisStatus === 'issued') blockerReasons.push('2주 이상 진단서가 발급된 경우');
  if (options.propertyDamageStatus === 'unrestored') blockerReasons.push('재산피해가 복구되지 않은 경우');
  if (options.continuityStatus === 'repeated') blockerReasons.push('학교폭력이 반복 또는 지속된 경우');
  if (options.retaliationStatus === 'confirmed') blockerReasons.push('보복행위가 확인된 경우');
  if (options.committeeIntent === 'wanted') blockerReasons.push('피해학생 및 보호자가 심의위원회 개최를 원하는 경우');

  const unknownReasons = [];
  if (options.diagnosisStatus === 'planned' || options.diagnosisStatus === 'unknown') {
    unknownReasons.push('2주 이상 진단서 발급 여부');
  }
  if (options.propertyDamageStatus === 'unknown') unknownReasons.push('재산상 피해 및 복구 여부');
  if (options.continuityStatus === 'unknown') unknownReasons.push('지속성 여부');
  if (options.retaliationStatus === 'suspected' || options.retaliationStatus === 'unknown') {
    unknownReasons.push('보복행위 여부');
  }
  if (options.committeeIntent === 'unchecked' || options.committeeIntent === 'unknown') {
    unknownReasons.push('피해학생 및 보호자의 심의위원회 개최 의사');
  }

  const legalRequirementsMet =
    options.diagnosisStatus === 'none' &&
    ['none', 'restored', 'promised'].includes(options.propertyDamageStatus) &&
    options.continuityStatus !== 'repeated' &&
    options.continuityStatus !== 'unknown' &&
    options.retaliationStatus === 'none' &&
    options.committeeIntent === 'not-wanted';

  const recoveryItems = [
    options.apology ? '사과' : '',
    options.remorse ? '반성' : '',
    options.reconciliation ? '화해 또는 합의 가능성' : '',
    options.recoveryEffort ? '피해회복 노력' : '',
    options.guardianCommunication ? '보호자 간 소통 가능성' : '',
    options.preventionPromise ? '재발방지 약속 가능성' : '',
  ].filter(Boolean);
  const riskCount = options.riskFactors.length;

  let classification = '추가 확인 필요';
  if (blockerReasons.length > 0) {
    classification = riskCount >= 2 ? '심의 가능성 높음' : '자체해결 어려움';
  } else if (unknownReasons.length > 0) {
    classification = '추가 확인 필요';
  } else if (legalRequirementsMet && riskCount >= 4) {
    classification = '심의 가능성 높음';
  } else if (legalRequirementsMet && riskCount >= 2) {
    classification = '추가 확인 필요';
  } else if (legalRequirementsMet) {
    classification = '가능성 높음';
  }

  const possibility =
    classification === '가능성 높음'
      ? '학교장 자체해결 가능성 높음'
      : classification === '자체해결 어려움'
        ? '학교장 자체해결 어려움'
        : classification === '심의 가능성 높음'
          ? '심의 가능성 높음'
          : '추가 확인 필요';

  const legalRequirements = [
    `2주 이상 진단서: ${options.diagnosisStatus === 'none' ? '충족' : options.diagnosisStatus === 'issued' ? '미충족' : '확인 필요'} (${getPrincipalLabel(options.diagnosisStatus)})`,
    `재산상 피해: ${['none', 'restored', 'promised'].includes(options.propertyDamageStatus) ? '충족' : options.propertyDamageStatus === 'unrestored' ? '미충족' : '확인 필요'} (${getPrincipalLabel(options.propertyDamageStatus)})`,
    `지속성: ${options.continuityStatus === 'once' || options.continuityStatus === 'two-three' ? '충족 가능' : options.continuityStatus === 'repeated' ? '미충족' : '확인 필요'} (${getPrincipalLabel(options.continuityStatus)})`,
    `보복행위: ${options.retaliationStatus === 'none' ? '충족' : options.retaliationStatus === 'confirmed' ? '미충족' : '확인 필요'} (${getPrincipalLabel(options.retaliationStatus)})`,
    `피해학생 및 보호자 심의 개최 의사: ${options.committeeIntent === 'not-wanted' ? '충족' : options.committeeIntent === 'wanted' ? '미충족' : '확인 필요'} (${getPrincipalLabel(options.committeeIntent)})`,
  ].join('\n');

  const additionalChecks = [
    ...unknownReasons,
    !options.diagnosisSubmitted ? '진단서 제출 여부' : '',
    !options.victimNeedsChecked ? '피해학생 측 요구사항 및 의사' : '',
    options.propertyDamageStatus === 'restored' || options.propertyDamageStatus === 'promised'
      ? '재산피해 복구 또는 복구 약속 자료'
      : '',
    !options.counselingRecord ? '담임 또는 상담교사 상담 기록' : '',
  ].filter(Boolean);

  const inputSummary = [
    `사건 내용: ${options.incidentContent}`,
    `발생일 또는 발생 기간: ${options.incidentDateOrPeriod || '미입력'}`,
    `발생 장소: ${options.incidentPlace || '미입력'}`,
    `관련 학생 관계: ${options.studentRelationship || '미입력'}`,
    `폭력 유형: ${joinLines(options.violenceTypes, '선택 없음')}`,
    `진단서 제출 여부: ${getYesNoLabel(options.diagnosisSubmitted)}`,
    `증거자료 여부: ${getYesNoLabel(options.evidenceAvailable)}`,
    `목격자 진술 여부: ${getYesNoLabel(options.witnessStatement)}`,
    `상담 기록 여부: ${getYesNoLabel(options.counselingRecord)}`,
    `피해학생 측 요구사항 확인 여부: ${getYesNoLabel(options.victimNeedsChecked)}`,
  ].join('\n');

  const nextSteps = [
    blockerReasons.length > 0
      ? `자체해결을 어렵게 하는 사유를 우선 정리하세요: ${blockerReasons.join(', ')}.`
      : '법정요건 5개를 전담기구 심의 전 자료로 확인하세요.',
    riskCount >= 2
      ? '심의 위험 요소가 있으므로 사건 경위, 피해 정도, 공개성, 반복성, 증거자료를 시간순으로 정리하세요.'
      : '피해학생 및 보호자의 의사를 명확히 확인하고, 관계회복 자료를 준비하세요.',
    '상담예약을 통해 실제 절차 진행 전 자료 누락 여부를 점검하세요.',
  ].join('\n');

  return {
    diagnosisType: '학교장 자체해결 V2',
    principalResolutionV2: true,
    inputSummary,
    possibility: `${possibility}\n분류: ${classification}${
      blockerReasons.length > 0 ? `\n주요 사유: ${blockerReasons.join(', ')}` : ''
    }${riskCount > 0 ? `\n심의 위험 요소 ${riskCount}개가 확인되어 자체해결 가능성이 낮아질 수 있습니다.` : ''}`,
    legalRequirements,
    relationshipRecovery:
      recoveryItems.length > 0
        ? `${recoveryItems.join(', ')} 요소가 있어 관계회복 가능성은 검토할 수 있습니다.\n다만 관계회복 요소는 법정요건을 대체할 수 없습니다.`
        : '관계회복 요소가 충분히 확인되지 않았습니다. 사과, 반성, 화해, 피해회복, 재발방지 약속 가능성을 추가로 확인하세요.\n다만 관계회복 요소는 법정요건을 대체할 수 없습니다.',
    riskFactors: joinLines(options.riskFactors, '선택된 심의 위험 요소가 없습니다.'),
    additionalChecks: joinLines(additionalChecks, '현재 입력 기준으로 즉시 추가 확인이 필요한 항목은 제한적입니다.'),
    caution: principalCautions.join('\n'),
    nextSteps,
    preparationDocuments: principalPreparationDocuments.join('\n'),
  };
};

const getPositionLabel = (position: AdminAppealOptions['position']) =>
  position === 'perpetrator' ? '가해학생 측' : '피해학생 측';

const getReviewStatusLabel = (reviewStatus: AdminAppealOptions['reviewStatus']) => {
  if (reviewStatus === 'before-review') return '심의 전';
  if (reviewStatus === 'completed-before-notice') return '심의 완료, 통지 전';
  return '조치결정 통지 받음';
};

const getMeaningfulCount = (items: string[], excludedLabels: string[]) =>
  items.filter((item) => !excludedLabels.includes(item)).length;

const toggleSelection = (items: string[], value: string) =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

const getDaysFromNotice = (noticeDate: string) => {
  if (!noticeDate) return null;

  const date = new Date(`${noticeDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((todayStart.getTime() - date.getTime()) / 86400000);
};

const calculateAdminAppealResult = (options: AdminAppealOptions): AdminAppealResultSections => {
  const positionLabel = getPositionLabel(options.position);
  const reviewStatusLabel = getReviewStatusLabel(options.reviewStatus);
  const offenderSummary = joinLines(options.offenderMeasures, '입력된 가해학생 조치가 없습니다.');
  const victimSummary = joinLines(options.victimMeasures, '입력된 피해학생 보호조치가 없습니다.');
  const hasNoOffenderAction =
    options.offenderMeasures.includes('조치없음') ||
    options.offenderMeasures.includes('학교폭력 아님');
  const noActionDecisionNote = hasNoOffenderAction
    ? '조치없음 또는 학교폭력 아님은 1호보다 낮은 조치가 아니라, 학교폭력으로 조치할 정도로 인정되지 않았거나 가해학생 조치가 내려지지 않은 별도 결론으로 검토합니다.'
    : '';
  const decisionSummary = [
    `가해학생 조치: ${offenderSummary}`,
    `피해학생 보호조치: ${victimSummary}`,
    noActionDecisionNote,
  ]
    .filter(Boolean)
    .join('\n');

  let filingPeriodReview = '행정심판 단계 전입니다. 먼저 심의 대응과 의견서 준비가 필요합니다.';
  if (options.reviewStatus === 'completed-before-notice') {
    filingPeriodReview = '심의는 완료되었으나 통지 전입니다. 조치결정 통지서 수령 후 청구기간 계산이 필요합니다.';
  }
  if (options.reviewStatus === 'notice-received') {
    const daysFromNotice = getDaysFromNotice(options.noticeDate);
    if (daysFromNotice === null) {
      filingPeriodReview = '조치결정 통지일이 입력되지 않았습니다. 통지일 확인 후 90일·180일 기간을 계산해야 합니다.';
    } else if (daysFromNotice < 0) {
      filingPeriodReview = '통지일이 현재 날짜보다 늦게 입력되었습니다. 날짜를 다시 확인해 주세요.';
    } else if (daysFromNotice <= 90) {
      filingPeriodReview = `청구기간 내 가능성 있음: 통지일로부터 약 ${daysFromNotice}일 경과했습니다.`;
    } else {
      filingPeriodReview = `기간 도과 위험 또는 청구기간 검토 필요: 통지일로부터 약 ${daysFromNotice}일 경과했습니다.`;
    }
  }

  const objectionCount = getMeaningfulCount(options.objectionReasons, ['잘 모르겠음']);
  const procedureCount = getMeaningfulCount(options.procedureIssues, ['절차상 문제 없음', '잘 모르겠음']);
  const evidenceCount = getMeaningfulCount(options.evidenceIssues, ['잘 모르겠음']);
  const proportionalityCount = getMeaningfulCount(options.proportionalityIssues, ['잘 모르겠음']);
  const urgencyCount = getMeaningfulCount(options.urgency, ['긴급성 낮음', '잘 모르겠음']);

  let score = objectionCount + procedureCount + evidenceCount + proportionalityCount + urgencyCount;
  if (options.reviewStatus === 'before-review') score = Math.max(0, score - 3);
  if (options.reviewStatus === 'completed-before-notice') score = Math.max(1, score - 1);

  const highOffenderMeasures = options.offenderMeasures.some((measure) =>
    ['4호 사회봉사', '5호 특별교육 또는 심리치료', '6호 출석정지', '7호 학급교체', '8호 전학', '9호 퇴학'].includes(measure)
  );
  const weakVictimProtection =
    options.position === 'victim' &&
    (options.victimMeasures.includes('보호조치 없음') ||
      options.objectionReasons.includes('보호조치가 부족함') ||
      options.objectionReasons.includes('2차 피해 또는 보복 우려가 반영되지 않음'));

  if (options.position === 'perpetrator' && highOffenderMeasures) score += 2;
  if (weakVictimProtection) score += 2;
  if (options.position === 'victim' && hasNoOffenderAction) score += 4;

  let appealNeed = '낮음';
  if (score >= 10 || urgencyCount >= 2) {
    appealNeed = '긴급 검토 필요';
  } else if (score >= 7) {
    appealNeed = '높음';
  } else if (score >= 3) {
    appealNeed = '보통';
  }

  if (options.reviewStatus === 'before-review') {
    appealNeed = score >= 5 ? '보통' : '낮음';
  }

  if (options.position === 'perpetrator' && hasNoOffenderAction) {
    appealNeed = '낮음';
  }

  const nextSteps =
    options.position === 'victim' && hasNoOffenderAction
      ? '조치없음 또는 학교폭력 아님 결정에 불복하려면 학교폭력 해당성, 사실관계 인정 여부, 증거 판단 누락, 피해 진술 신빙성, 조치없음 결정의 타당성을 중심으로 재심 또는 행정심판 필요성을 검토해 주세요.'
      : options.reviewStatus === 'before-review'
      ? '아직 행정심판 단계 전이므로 심의 전 의견서, 증거목록, 진술 정리, 보호조치 또는 감경자료를 먼저 준비해 주세요.'
      : options.reviewStatus === 'completed-before-notice'
        ? '조치결정 통지서를 수령하는 즉시 통지일, 조치 내용, 이유 기재를 확인하고 행정심판 청구기간을 계산해 주세요.'
        : '조치결정 통지서, 사안조사 보고서, 심의자료, 증거자료를 모아 청구취지와 집행정지 필요성을 함께 검토해 주세요.';
  const noActionVictimIssue = options.position === 'victim' && hasNoOffenderAction
    ? [
        '조치없음 결정에 대한 불복 쟁점',
        '학교폭력 해당성 판단',
        '사실관계 인정 여부',
        '증거 판단 누락 여부',
        '피해 진술 신빙성',
        '조치없음 결정의 타당성',
        '재심 또는 행정심판 검토 필요성',
      ].join('\n')
    : '';
  const noActionPerpetratorCaution = options.position === 'perpetrator' && hasNoOffenderAction
    ? '가해학생 측에서 조치없음 또는 학교폭력 아님 결정을 받은 경우 본인 행정심판 필요성은 낮은 편이나, 피해학생 측이 조치없음 결정에 불복하여 행정심판 등을 검토할 가능성은 있습니다.'
    : '';
  const caution = [...adminAppealCautions, noActionPerpetratorCaution].filter(Boolean).join('\n');

  return {
    diagnosisType: '행정심판 가능성 V2',
    adminAppealV2: true,
    currentPosition: positionLabel,
    reviewStatus: reviewStatusLabel,
    decisionSummary,
    filingPeriodReview,
    appealNeed,
    objectionReasons: joinLines(
      [...options.objectionReasons, noActionVictimIssue].filter(Boolean),
      '입력된 주요 불복 사유가 없습니다.'
    ),
    procedureIssues: joinLines(options.procedureIssues, '입력된 절차상 쟁점이 없습니다.'),
    evidenceIssues: joinLines(options.evidenceIssues, '입력된 사실관계·증거 쟁점이 없습니다.'),
    proportionalityIssues: joinLines(options.proportionalityIssues, '입력된 비례원칙 쟁점이 없습니다.'),
    caution,
    nextSteps,
    preparationDocuments: preparationDocuments.join('\n'),
  };
};

const calculateMeasureResult = (options: MeasureOptions): MeasureResultSections => {
  const reasons: string[] = [];
  const aggravatingFactors: string[] = [];
  const mitigatingFactors: string[] = [];
  const cautions = [measureNotice];

  let seriousnessScore = 0;
  if (options.damageLevel === 'minor') seriousnessScore += 1;
  if (options.damageLevel === 'middle') seriousnessScore += 3;
  if (options.damageLevel === 'severe') seriousnessScore += 5;
  if (options.verbalViolence) seriousnessScore += 1;
  if (options.cyberViolence) seriousnessScore += 2;
  if (options.physicalViolence) seriousnessScore += 4;
  if (options.extortion) seriousnessScore += 3;
  if (options.coercion) seriousnessScore += 3;
  if (options.sexualIssue) seriousnessScore += 6;
  if (options.groupAction) seriousnessScore += 4;
  if (options.weaponUse) seriousnessScore += 6;
  if (options.retaliation) seriousnessScore += 5;

  let persistenceScore = 0;
  if (options.continued) persistenceScore += 2;
  if (options.frequency === 'two-three') persistenceScore += 2;
  if (options.frequency === 'repeated') persistenceScore += 4;
  if (options.duration === 'within-week') persistenceScore += 1;
  if (options.duration === 'within-month') persistenceScore += 2;
  if (options.duration === 'over-month') persistenceScore += 4;

  let intentionalityScore = 0;
  if (options.intentional) intentionalityScore += 4;
  if (options.retaliation || options.weaponUse || options.groupAction) intentionalityScore += 1;

  const remorseScore = options.remorse ? -2 : 2;
  const reconciliationScore = options.reconciliation ? -2 : options.apology ? -1 : 2;
  let guidanceScore = 0;
  if (options.firstOffense) guidanceScore -= 1;
  if (options.guardianEffort) guidanceScore -= 1;
  if (options.previousSimilarCase) guidanceScore += 3;
  if (!options.remorse && !options.apology) guidanceScore += 1;
  const disabledVictimBonus = options.victimDisabled ? 4 : 0;

  if (options.damageLevel === 'severe') aggravatingFactors.push('피해 정도가 큰 사안입니다.');
  if (options.physicalViolence) aggravatingFactors.push('신체폭력 요소가 있어 조치수위가 높아질 수 있습니다.');
  if (options.cyberViolence) aggravatingFactors.push('사이버폭력은 전파성과 지속 피해 가능성을 함께 봐야 합니다.');
  if (options.extortion) aggravatingFactors.push('금품갈취 요소가 확인됩니다.');
  if (options.coercion) aggravatingFactors.push('강요 요소가 확인됩니다.');
  if (options.sexualIssue) aggravatingFactors.push('성 관련 사안은 6호 이상 위험을 별도로 검토해야 합니다.');
  if (options.groupAction) aggravatingFactors.push('집단행위는 중대한 가중 위험 요소입니다.');
  if (options.weaponUse) aggravatingFactors.push('위험한 물건 사용은 높은 조치 가능성을 키웁니다.');
  if (options.retaliation) aggravatingFactors.push('보복행위는 중대한 가중 요소입니다.');
  if (options.victimDisabled) aggravatingFactors.push('피해학생이 장애학생인 경우 가중 검토가 필요합니다.');
  if (options.previousSimilarCase) aggravatingFactors.push('이전 유사 사안은 선도 가능성 판단에 불리할 수 있습니다.');
  if (persistenceScore >= 4) aggravatingFactors.push('발생 횟수와 기간상 지속성이 높게 평가될 수 있습니다.');
  if (options.intentional) aggravatingFactors.push('고의성이 인정되면 조치수위가 높아질 수 있습니다.');

  if (options.remorse) mitigatingFactors.push('반성 정황은 감경 요소로 검토될 수 있습니다.');
  if (options.apology) mitigatingFactors.push('사과는 피해 회복 노력으로 볼 수 있습니다.');
  if (options.reconciliation) mitigatingFactors.push('화해 또는 합의 정황은 감경 가능 요소입니다.');
  if (options.guardianEffort) mitigatingFactors.push('보호자의 사과 또는 재발방지 노력은 선도 가능성에 긍정적입니다.');
  if (options.firstOffense) mitigatingFactors.push('초범인 점은 선도 가능성 판단에 긍정적일 수 있습니다.');

  if (!options.hasEvidence || !options.objectiveEvidence) {
    cautions.push('증거자료 또는 객관자료가 부족하면 조치수위를 단정하기 어렵고 사실관계 정리가 먼저 필요합니다.');
  }
  if (options.position === 'victim' && (options.unclearSchoolViolence || options.lowMeasureNeed)) {
    cautions.push('피해학생 측에서는 학교폭력 아님 또는 조치없음 가능성이 표시되더라도 증거 보강, 사실관계 정리, 행정심판 검토 가능성을 함께 확인할 필요가 있습니다.');
  }
  if (options.statementSpecificity === 'low') {
    cautions.push('피해진술이 구체적이지 않으면 일시, 장소, 행위자, 목격자, 피해 상태를 보완해야 합니다.');
  }
  if (options.factualDispute) {
    cautions.push('사실관계 다툼이 있는 경우 조치수위보다 인정되는 사실 범위를 먼저 정리해야 합니다.');
  }

  const totalScore = Math.max(
    0,
    seriousnessScore +
      persistenceScore +
      intentionalityScore +
      disabledVictimBonus +
      Math.max(0, remorseScore) +
      Math.max(0, reconciliationScore) +
      Math.max(0, guidanceScore) -
      (options.remorse ? 1 : 0) -
      (options.apology ? 1 : 0) -
      (options.reconciliation ? 1 : 0) -
      (options.guardianEffort ? 1 : 0) -
      (options.firstOffense ? 1 : 0)
  );
  const highRiskFlags =
    options.groupAction ||
    options.retaliation ||
    options.sexualIssue ||
    options.victimDisabled ||
    options.weaponUse;
  const schoolViolenceUnclear =
    !options.intentional &&
    !options.continued &&
    options.frequency === 'once' &&
    options.damageLevel === 'minor' &&
    (options.simpleConflict || options.unclearSchoolViolence) &&
    !highRiskFlags;
  const noMeasureNeed =
    (!options.hasEvidence || !options.objectiveEvidence || options.statementSpecificity === 'low') &&
    (options.witnessConflict || options.mutualConflict || options.lowMeasureNeed || options.factualDispute) &&
    !highRiskFlags;
  let expectedMeasure = '1~3호 가능성';

  if (schoolViolenceUnclear) {
    expectedMeasure = '학교폭력 아님 가능성';
  } else if (noMeasureNeed) {
    expectedMeasure = '조치없음 가능성';
  } else if (highRiskFlags || totalScore >= 17) {
    expectedMeasure = '6~9호 가능성';
  } else if (
    totalScore >= 11 ||
    (options.physicalViolence && options.damageLevel === 'severe') ||
    (options.physicalViolence && options.frequency === 'repeated' && options.intentional)
  ) {
    expectedMeasure = '4~5호 가능성';
  } else if (totalScore >= 6 || (options.verbalViolence && persistenceScore >= 3 && !options.apology)) {
    expectedMeasure = '2~4호 가능성';
  }

  if (
    options.verbalViolence &&
    options.frequency === 'once' &&
    options.damageLevel === 'minor' &&
    options.remorse &&
    options.apology &&
    options.reconciliation &&
    options.hasEvidence &&
    !options.factualDispute &&
    !highRiskFlags
  ) {
    expectedMeasure = '1~3호 가능성';
  }

  reasons.push(`심각성 ${seriousnessScore}점, 지속성 ${persistenceScore}점, 고의성 ${intentionalityScore}점으로 1차 산정했습니다.`);
  if (schoolViolenceUnclear) {
    reasons.push('고의성·지속성이 부족하고 피해 정도가 경미하며 단순 갈등 또는 오해에 가까운 정황이 있어 학교폭력 해당성 자체가 불명확할 수 있습니다.');
  }
  if (noMeasureNeed) {
    reasons.push('피해 주장 입증, 객관자료, 목격자 진술 일관성 또는 조치 필요성이 부족하여 조치없음 가능성을 별도 결론으로 표시했습니다.');
  }
  if (remorseScore < 0 || reconciliationScore < 0 || guidanceScore < 0) {
    reasons.push('반성, 사과, 화해, 보호자 노력, 초범 여부는 감경 또는 선도 가능성 요소로 반영했습니다.');
  }
  if (highRiskFlags) {
    reasons.push('집단행위, 보복행위, 성 관련 사안, 장애학생 피해, 위험물 사용 중 중대 위험 요소가 포함되어 높은 조치 가능성을 우선 표시했습니다.');
  }
  if (!options.hasEvidence || options.factualDispute) {
    reasons.push('증거 부족 또는 사실관계 다툼이 있어 예상 조치수위는 단정값이 아니라 검토 범위로 보아야 합니다.');
  }

  const factorAnalysis = [
    `심각성: ${seriousnessScore}점 - 피해 정도, 폭력 유형, 집단성, 위험물, 보복 여부를 반영했습니다.`,
    `지속성: ${persistenceScore}점 - 발생 횟수, 발생 기간, 지속성 여부를 반영했습니다.`,
    `고의성: ${intentionalityScore}점 - 고의성 및 계획적·보복적 정황을 반영했습니다.`,
    `반성 정도: ${remorseScore}점 - ${options.remorse ? '반성 정황이 있습니다.' : '반성 정황이 부족합니다.'}`,
    `화해 정도: ${reconciliationScore}점 - ${
      options.reconciliation ? '화해 또는 합의 정황이 있습니다.' : options.apology ? '사과는 있으나 화해 또는 합의는 추가 확인이 필요합니다.' : '사과·화해 정황이 부족합니다.'
    }`,
    `선도 가능성: ${guidanceScore}점 - 초범 여부, 보호자 노력, 이전 유사 사안을 함께 반영했습니다.`,
    `장애학생 피해 여부: ${disabledVictimBonus}점 - ${options.victimDisabled ? '가중 검토 대상입니다.' : '해당 없음으로 입력되었습니다.'}`,
    `학교폭력 해당성·조치 필요성: ${schoolViolenceUnclear ? '학교폭력 해당성 불명확 가능성이 있습니다.' : noMeasureNeed ? '조치 필요성이 낮거나 입증이 부족할 수 있습니다.' : '별도 배제 사유는 제한적으로 입력되었습니다.'}`,
  ].join('\n');

  const inputSummary = [
    `현재 입장: ${options.position === 'perpetrator' ? '가해지목학생 측' : '피해학생 측'}`,
    `사건 내용: ${options.incidentContent}`,
    `피해 정도: ${getDamageLevelLabel(options.damageLevel)}`,
    `발생 횟수: ${getFrequencyLabel(options.frequency)}`,
    `발생 기간: ${getDurationLabel(options.duration)}`,
    `지속성 여부: ${options.continued ? '예' : '아니오'}`,
    `신체폭력 여부: ${options.physicalViolence ? '예' : '아니오'}`,
    `언어폭력 여부: ${options.verbalViolence ? '예' : '아니오'}`,
    `사이버폭력 여부: ${options.cyberViolence ? '예' : '아니오'}`,
    `금품갈취 여부: ${options.extortion ? '예' : '아니오'}`,
    `강요 여부: ${options.coercion ? '예' : '아니오'}`,
    `성 관련 사안 여부: ${options.sexualIssue ? '예' : '아니오'}`,
    `집단행위 여부: ${options.groupAction ? '예' : '아니오'}`,
    `위험한 물건 사용 여부: ${options.weaponUse ? '예' : '아니오'}`,
    `보복행위 여부: ${options.retaliation ? '예' : '아니오'}`,
    `피해학생이 장애학생인지 여부: ${options.victimDisabled ? '예' : '아니오'}`,
    `고의성 여부: ${options.intentional ? '예' : '아니오'}`,
    `반성 여부: ${options.remorse ? '예' : '아니오'}`,
    `사과 여부: ${options.apology ? '예' : '아니오'}`,
    `화해 또는 합의 여부: ${options.reconciliation ? '예' : '아니오'}`,
    `보호자 사과 또는 재발방지 노력 여부: ${options.guardianEffort ? '예' : '아니오'}`,
    `이전 유사 사안 여부: ${options.previousSimilarCase ? '예' : '아니오'}`,
    `초범 여부: ${options.firstOffense ? '예' : '아니오'}`,
    `증거자료 보유 여부: ${options.hasEvidence ? '예' : '아니오'}`,
    `피해진술 구체성: ${getStatementSpecificityLabel(options.statementSpecificity)}`,
    `목격자 또는 객관자료 여부: ${options.objectiveEvidence ? '예' : '아니오'}`,
    `사실관계 다툼 여부: ${options.factualDispute ? '예' : '아니오'}`,
    `학교폭력 해당성 불명확 여부: ${options.unclearSchoolViolence ? '예' : '아니오'}`,
    `단순 갈등 또는 오해 여부: ${options.simpleConflict ? '예' : '아니오'}`,
    `쌍방 갈등 성격 여부: ${options.mutualConflict ? '예' : '아니오'}`,
    `목격자 진술 불일치 여부: ${options.witnessConflict ? '예' : '아니오'}`,
    `조치 필요성 낮음 여부: ${options.lowMeasureNeed ? '예' : '아니오'}`,
  ].join('\n');
  const noActionExplanation =
    expectedMeasure.includes('학교폭력 아님') || expectedMeasure.includes('조치없음')
      ? '\n학교폭력 아님과 조치없음은 1호보다 낮은 단계가 아니라, 학교폭력 해당성 또는 가해학생 조치 필요성이 인정되지 않을 수 있다는 별도 결론입니다.'
      : '';
  const positionNextStep =
    options.position === 'perpetrator' &&
    (expectedMeasure.includes('학교폭력 아님') || expectedMeasure.includes('조치없음'))
      ? '\n가해지목학생 측은 사실관계, 증거 부족, 고의성 부족, 지속성 부족, 단순 갈등 또는 오해 정황을 시간순으로 정리해 주세요.'
      : options.position === 'victim' &&
          (expectedMeasure.includes('학교폭력 아님') || expectedMeasure.includes('조치없음'))
        ? '\n피해학생 측은 피해 진술의 구체성, 객관자료, 목격자 진술, 반복성·고의성 정황을 보강하고 필요 시 행정심판 가능성을 검토해 주세요.'
        : '';

  return {
    diagnosisType: '조치수위 예측 V2',
    inputSummary,
    factorAnalysis,
    expectedMeasure,
    reasons: reasons.join('\n'),
    mitigatingFactors: joinLines(mitigatingFactors, '뚜렷한 감경 요소가 입력되지 않았습니다.'),
    aggravatingFactors: joinLines(aggravatingFactors, '중대한 가중 위험 요소는 제한적으로 입력되었습니다.'),
    caution: `${cautions.join('\n')}${noActionExplanation}`,
    nextSteps:
      `사건 일시, 장소, 관련 학생, 피해 상태, 증거자료 목록을 시간순으로 정리한 뒤 상담예약을 통해 실제 대응방향을 점검해 주세요.\n4호 이상 조치 가능성이 있는 경우 생활기록부, 진학, 행정심판 가능성까지 함께 검토가 필요합니다.${positionNextStep}`,
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
  const [measureOptions, setMeasureOptions] = useState<MeasureOptions>({
    position: 'perpetrator',
    incidentContent: '',
    damageLevel: 'minor',
    frequency: 'once',
    duration: 'one-day',
    continued: false,
    physicalViolence: false,
    verbalViolence: false,
    cyberViolence: false,
    extortion: false,
    coercion: false,
    sexualIssue: false,
    groupAction: false,
    weaponUse: false,
    retaliation: false,
    victimDisabled: false,
    intentional: false,
    remorse: false,
    apology: false,
    reconciliation: false,
    guardianEffort: false,
    previousSimilarCase: false,
    firstOffense: false,
    hasEvidence: false,
    statementSpecificity: 'middle',
    objectiveEvidence: false,
    factualDispute: false,
    unclearSchoolViolence: false,
    simpleConflict: false,
    mutualConflict: false,
    witnessConflict: false,
    lowMeasureNeed: false,
  });
  const [adminAppealOptions, setAdminAppealOptions] = useState<AdminAppealOptions>({
    position: 'perpetrator',
    reviewStatus: 'before-review',
    noticeDate: '',
    offenderMeasures: ['아직 결정 전'],
    victimMeasures: ['아직 결정 전'],
    objectionReasons: [],
    procedureIssues: [],
    evidenceIssues: [],
    proportionalityIssues: [],
    urgency: [],
  });
  const [principalResolutionOptions, setPrincipalResolutionOptions] =
    useState<PrincipalResolutionOptions>({
      incidentContent: '',
      incidentDateOrPeriod: '',
      incidentPlace: '',
      studentRelationship: '',
      violenceTypes: [],
      diagnosisStatus: 'unknown',
      propertyDamageStatus: 'unknown',
      continuityStatus: 'unknown',
      retaliationStatus: 'unknown',
      committeeIntent: 'unchecked',
      apology: false,
      remorse: false,
      reconciliation: false,
      recoveryEffort: false,
      guardianCommunication: false,
      preventionPromise: false,
      riskFactors: [],
      diagnosisSubmitted: false,
      evidenceAvailable: false,
      witnessStatement: false,
      counselingRecord: false,
      victimNeedsChecked: false,
    });
  const router = useRouter();
  const isMeasure = ['measure', 'action-level', 'D04'].includes(params.type);
  const isAdminAppeal = ['D08', 'admin-appeal', 'appeal'].includes(params.type);
  const isPrincipalResolution = ['D02', 'school-resolution', 'principal-resolution'].includes(params.type);

  const updateMeasureOption = <K extends keyof MeasureOptions>(key: K, value: MeasureOptions[K]) => {
    setMeasureOptions((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const updateAdminAppealOption = <K extends keyof AdminAppealOptions>(
    key: K,
    value: AdminAppealOptions[K]
  ) => {
    setAdminAppealOptions((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const toggleAdminAppealOption = (
    key: 'offenderMeasures' | 'victimMeasures' | 'objectionReasons' | 'procedureIssues' | 'evidenceIssues' | 'proportionalityIssues' | 'urgency',
    value: string
  ) => {
    setAdminAppealOptions((previous) => ({
      ...previous,
      [key]: toggleSelection(previous[key], value),
    }));
  };

  const updatePrincipalResolutionOption = <K extends keyof PrincipalResolutionOptions>(
    key: K,
    value: PrincipalResolutionOptions[K]
  ) => {
    setPrincipalResolutionOptions((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const togglePrincipalResolutionOption = (
    key: 'violenceTypes' | 'riskFactors',
    value: string
  ) => {
    setPrincipalResolutionOptions((previous) => ({
      ...previous,
      [key]: toggleSelection(previous[key], value),
    }));
  };

  const handleDiagnosis = () => {
    if (isMeasure && !measureOptions.incidentContent.trim()) {
      alert('사건 내용을 입력해 주세요.');
      return;
    }

    if (isPrincipalResolution && !principalResolutionOptions.incidentContent.trim()) {
      alert('사건 내용을 입력해 주세요.');
      return;
    }

    if (!isMeasure && !isAdminAppeal && !isPrincipalResolution && !content.trim()) {
      alert('사건 내용을 입력해 주세요.');
      return;
    }

    const resultId = Date.now().toString();
    const storageKey = `${DIAGNOSIS_STORAGE_KEY_PREFIX}:${resultId}`;
    const measureResult = isMeasure ? calculateMeasureResult(measureOptions) : null;
    const adminAppealResult = isAdminAppeal ? calculateAdminAppealResult(adminAppealOptions) : null;
    const principalResolutionResult = isPrincipalResolution
      ? calculatePrincipalResolutionResult(principalResolutionOptions)
      : null;
    const result = adminAppealResult
      ? [
          `행정심판 청구기간 검토: ${adminAppealResult.filingPeriodReview}`,
          `행정심판 검토 필요성: ${adminAppealResult.appealNeed}`,
          `주요 불복 사유: ${adminAppealResult.objectionReasons}`,
          `주의사항: ${adminAppealResult.caution}`,
          `다음 대응방향: ${adminAppealResult.nextSteps}`,
        ].join('\n\n')
      : measureResult
      ? [
          `예상 조치수위: ${measureResult.expectedMeasure}`,
          `심의 판단요소 분석: ${measureResult.factorAnalysis}`,
          `판단 이유: ${measureResult.reasons}`,
          `감경 가능 요소: ${measureResult.mitigatingFactors}`,
          `가중 위험 요소: ${measureResult.aggravatingFactors}`,
          `주의사항: ${measureResult.caution}`,
          `다음 대응방향: ${measureResult.nextSteps}`,
        ].join('\n\n')
      : principalResolutionResult
      ? [
          `학교장 자체해결 가능성: ${principalResolutionResult.possibility}`,
          `법정요건 충족 여부:\n${principalResolutionResult.legalRequirements}`,
          `관계회복 가능성:\n${principalResolutionResult.relationshipRecovery}`,
          `심의 전 위험요소:\n${principalResolutionResult.riskFactors}`,
          `추가 확인사항:\n${principalResolutionResult.additionalChecks}`,
          `주의사항:\n${principalResolutionResult.caution}`,
          `다음 대응방향:\n${principalResolutionResult.nextSteps}`,
        ].join('\n\n')
      : buildResult(params.type, content);
    const savedContent = adminAppealResult
      ? [
          `현재 입장: ${adminAppealResult.currentPosition}`,
          `심의 진행 상태: ${adminAppealResult.reviewStatus}`,
          `조치결정 통지일: ${adminAppealOptions.noticeDate || '미입력'}`,
          adminAppealResult.decisionSummary,
        ].join('\n')
      : measureResult
        ? measureResult.inputSummary
        : principalResolutionResult
          ? principalResolutionResult.inputSummary
        : content;

    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        type: adminAppealResult
          ? adminAppealResult.diagnosisType
          : measureResult
            ? measureResult.diagnosisType
            : principalResolutionResult
              ? principalResolutionResult.diagnosisType
            : params.type,
        content: savedContent,
        result,
        resultSections: adminAppealResult ?? measureResult ?? principalResolutionResult,
      })
    );

    router.push(`/diagnosis/result/${resultId}`);
  };

  return (
    <div className="card">
      <h1 className="mb-6 text-2xl font-black">
        무료진단 입력 - {isPrincipalResolution ? '학교장 자체해결 V2' : isMeasure ? '조치수위 예측 V2' : isAdminAppeal ? '행정심판 가능성 V2' : params.type}
      </h1>

      {isPrincipalResolution ? (
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-black">1. 기본 사건 정보</h2>
            <div>
              <label className="mb-2 block font-bold">사건 내용</label>
              <textarea
                className="h-36 w-full rounded-xl border p-3"
                placeholder="사건 경위, 피해 내용, 관련 학생 상황을 입력해 주세요."
                value={principalResolutionOptions.incidentContent}
                onChange={(event) => updatePrincipalResolutionOption('incidentContent', event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block font-bold">발생일 또는 발생 기간</label>
                <input className="w-full rounded-xl border p-3" value={principalResolutionOptions.incidentDateOrPeriod} onChange={(event) => updatePrincipalResolutionOption('incidentDateOrPeriod', event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block font-bold">발생 장소</label>
                <input className="w-full rounded-xl border p-3" value={principalResolutionOptions.incidentPlace} onChange={(event) => updatePrincipalResolutionOption('incidentPlace', event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block font-bold">관련 학생 관계</label>
                <input className="w-full rounded-xl border p-3" value={principalResolutionOptions.studentRelationship} onChange={(event) => updatePrincipalResolutionOption('studentRelationship', event.target.value)} />
              </div>
            </div>
            <fieldset className="rounded-xl border p-4">
              <legend className="px-1 font-bold">폭력 유형</legend>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {violenceTypeOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input type="checkbox" checked={principalResolutionOptions.violenceTypes.includes(option)} onChange={() => togglePrincipalResolutionOption('violenceTypes', option)} />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">2. 학교장 자체해결 법정요건</h2>
            {[
              ['2주 이상 진단서 발급 여부', 'diagnosisStatus', [['none', '없음'], ['issued', '있음'], ['planned', '발급 예정 또는 검토 중'], ['unknown', '모름']]],
              ['재산상 피해 여부', 'propertyDamageStatus', [['none', '없음'], ['restored', '있음, 즉시 복구 완료'], ['promised', '있음, 복구 약속 있음'], ['unrestored', '있음, 복구 안 됨'], ['unknown', '모름']]],
              ['지속성 여부', 'continuityStatus', [['once', '1회성'], ['two-three', '2~3회'], ['repeated', '반복 또는 지속'], ['unknown', '모름']]],
              ['보복행위 여부', 'retaliationStatus', [['none', '아님'], ['suspected', '보복행위 의심'], ['confirmed', '보복행위 있음'], ['unknown', '모름']]],
              ['피해학생 및 보호자의 심의위원회 개최 의사', 'committeeIntent', [['not-wanted', '원하지 않음'], ['wanted', '원함'], ['unchecked', '아직 확인 안 됨'], ['unknown', '모름']]],
            ].map(([title, key, options]) => (
              <fieldset key={String(key)} className="rounded-xl border p-4">
                <legend className="px-1 font-bold">{String(title)}</legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {(options as string[][]).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 rounded-xl border px-3 py-2">
                      <input
                        type="radio"
                        name={String(key)}
                        checked={principalResolutionOptions[key as keyof PrincipalResolutionOptions] === value}
                        onChange={() => updatePrincipalResolutionOption(key as keyof PrincipalResolutionOptions, value as never)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">3. 관계회복 및 감경 요소</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['apology', '사과 여부'],
                ['remorse', '반성 여부'],
                ['reconciliation', '화해 또는 합의 가능성'],
                ['recoveryEffort', '피해회복 노력 여부'],
                ['guardianCommunication', '보호자 간 소통 가능성'],
                ['preventionPromise', '재발방지 약속 가능성'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border p-3">
                  <input type="checkbox" checked={Boolean(principalResolutionOptions[key as keyof PrincipalResolutionOptions])} onChange={(event) => updatePrincipalResolutionOption(key as keyof PrincipalResolutionOptions, event.target.checked as never)} />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">4. 심의 위험 요소</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {principalRiskOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-xl border p-3">
                  <input type="checkbox" checked={principalResolutionOptions.riskFactors.includes(option)} onChange={() => togglePrincipalResolutionOption('riskFactors', option)} />
                  {option}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">5. 증거 및 준비상태</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['diagnosisSubmitted', '진단서 제출 여부'],
                ['evidenceAvailable', '카카오톡, 문자, 사진, 녹음, CCTV 등 증거자료 여부'],
                ['witnessStatement', '목격자 진술 여부'],
                ['counselingRecord', '담임 또는 상담교사 상담 기록 여부'],
                ['victimNeedsChecked', '피해학생 측 요구사항 확인 여부'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border p-3">
                  <input type="checkbox" checked={Boolean(principalResolutionOptions[key as keyof PrincipalResolutionOptions])} onChange={(event) => updatePrincipalResolutionOption(key as keyof PrincipalResolutionOptions, event.target.checked as never)} />
                  {label}
                </label>
              ))}
            </div>
          </section>
        </div>
      ) : isAdminAppeal ? (
        <div className="space-y-5">
          <section className="space-y-4">
            <h2 className="text-lg font-black">1. 현재 입장</h2>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-xl border p-3">
                <input type="radio" name="position" checked={adminAppealOptions.position === 'perpetrator'} onChange={() => updateAdminAppealOption('position', 'perpetrator')} />
                가해학생 측
              </label>
              <label className="flex items-center gap-2 rounded-xl border p-3">
                <input type="radio" name="position" checked={adminAppealOptions.position === 'victim'} onChange={() => updateAdminAppealOption('position', 'victim')} />
                피해학생 측
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">2. 심의 진행 상태</h2>
            <div className="flex flex-wrap gap-3">
              {[
                ['before-review', '심의 전'],
                ['completed-before-notice', '심의 완료, 통지 전'],
                ['notice-received', '조치결정 통지 받음'],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="radio"
                    name="reviewStatus"
                    checked={adminAppealOptions.reviewStatus === value}
                    onChange={() => updateAdminAppealOption('reviewStatus', value as AdminAppealOptions['reviewStatus'])}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black">3. 조치결정 통지일</h2>
            <input
              type="date"
              className="w-full rounded-xl border p-3 md:w-auto"
              value={adminAppealOptions.noticeDate}
              onChange={(event) => updateAdminAppealOption('noticeDate', event.target.value)}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">4. 가해학생 조치</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {offenderMeasureOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={adminAppealOptions.offenderMeasures.includes(option)}
                    onChange={() => toggleAdminAppealOption('offenderMeasures', option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">5. 피해학생 보호조치</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {victimMeasureOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={adminAppealOptions.victimMeasures.includes(option)}
                    onChange={() => toggleAdminAppealOption('victimMeasures', option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">6. 불복 방향</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {(adminAppealOptions.position === 'perpetrator' ? perpetratorObjectionOptions : victimObjectionOptions).map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={adminAppealOptions.objectionReasons.includes(option)}
                    onChange={() => toggleAdminAppealOption('objectionReasons', option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </section>

          {[
            ['7. 절차상 문제', 'procedureIssues', procedureIssueOptions],
            ['8. 사실관계·증거 문제', 'evidenceIssues', evidenceIssueOptions],
            ['9. 비례원칙 관련', 'proportionalityIssues', proportionalityIssueOptions],
            ['10. 긴급성', 'urgency', urgencyOptions],
          ].map(([title, key, options]) => (
            <section key={String(key)} className="space-y-4">
              <h2 className="text-lg font-black">{String(title)}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {(options as string[]).map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border p-3">
                    <input
                      type="checkbox"
                      checked={adminAppealOptions[key as keyof AdminAppealOptions].includes(option)}
                      onChange={() => toggleAdminAppealOption(key as 'procedureIssues' | 'evidenceIssues' | 'proportionalityIssues' | 'urgency', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : isMeasure ? (
        <div className="space-y-5">
          <section className="space-y-4">
            <h2 className="text-lg font-black">기본 사실관계</h2>
            <fieldset className="rounded-xl border p-4">
              <legend className="px-1 font-bold">현재 입장</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center gap-2">
                  <input type="radio" name="measurePosition" checked={measureOptions.position === 'perpetrator'} onChange={() => updateMeasureOption('position', 'perpetrator')} />
                  가해지목학생 측
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="measurePosition" checked={measureOptions.position === 'victim'} onChange={() => updateMeasureOption('position', 'victim')} />
                  피해학생 측
                </label>
              </div>
            </fieldset>
            <div>
              <label className="mb-2 block font-bold">사건 내용</label>
              <textarea
                className="h-40 w-full rounded-xl border p-3"
                placeholder="사건 발생일, 장소, 관련 학생, 구체적인 경위와 피해 내용을 입력해 주세요."
                value={measureOptions.incidentContent}
                onChange={(event) => updateMeasureOption('incidentContent', event.target.value)}
              />
            </div>

            <fieldset className="rounded-xl border p-4">
              <legend className="px-1 font-bold">피해 정도</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center gap-2">
                  <input type="radio" name="damageLevel" checked={measureOptions.damageLevel === 'minor'} onChange={() => updateMeasureOption('damageLevel', 'minor')} />
                  경미
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="damageLevel" checked={measureOptions.damageLevel === 'middle'} onChange={() => updateMeasureOption('damageLevel', 'middle')} />
                  중간
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="damageLevel" checked={measureOptions.damageLevel === 'severe'} onChange={() => updateMeasureOption('damageLevel', 'severe')} />
                  큼
                </label>
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <fieldset className="rounded-xl border p-4">
                <legend className="px-1 font-bold">발생 횟수</legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="frequency" checked={measureOptions.frequency === 'once'} onChange={() => updateMeasureOption('frequency', 'once')} />
                    1회
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="frequency" checked={measureOptions.frequency === 'two-three'} onChange={() => updateMeasureOption('frequency', 'two-three')} />
                    2~3회
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="frequency" checked={measureOptions.frequency === 'repeated'} onChange={() => updateMeasureOption('frequency', 'repeated')} />
                    반복
                  </label>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border p-4">
                <legend className="px-1 font-bold">발생 기간</legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="duration" checked={measureOptions.duration === 'one-day'} onChange={() => updateMeasureOption('duration', 'one-day')} />
                    1일
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="duration" checked={measureOptions.duration === 'within-week'} onChange={() => updateMeasureOption('duration', 'within-week')} />
                    1주 이내
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="duration" checked={measureOptions.duration === 'within-month'} onChange={() => updateMeasureOption('duration', 'within-month')} />
                    1개월 이내
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="duration" checked={measureOptions.duration === 'over-month'} onChange={() => updateMeasureOption('duration', 'over-month')} />
                    1개월 초과
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['continued', '지속성 여부'],
                ['physicalViolence', '신체폭력 여부'],
                ['verbalViolence', '언어폭력 여부'],
                ['cyberViolence', '사이버폭력 여부'],
                ['extortion', '금품갈취 여부'],
                ['coercion', '강요 여부'],
                ['sexualIssue', '성 관련 사안 여부'],
                ['groupAction', '집단행위 여부'],
                ['weaponUse', '위험한 물건 사용 여부'],
                ['retaliation', '보복행위 여부'],
                ['victimDisabled', '피해학생이 장애학생인지 여부'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(measureOptions[key as keyof MeasureOptions])}
                    onChange={(event) => updateMeasureOption(key as keyof MeasureOptions, event.target.checked as never)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">가해지목학생 측 요소</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['intentional', '고의성 여부'],
                ['remorse', '반성 여부'],
                ['apology', '사과 여부'],
                ['reconciliation', '화해 또는 합의 여부'],
                ['guardianEffort', '보호자 사과 또는 재발방지 노력 여부'],
                ['previousSimilarCase', '이전 유사 사안 여부'],
                ['firstOffense', '초범 여부'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(measureOptions[key as keyof MeasureOptions])}
                    onChange={(event) => updateMeasureOption(key as keyof MeasureOptions, event.target.checked as never)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">증거 및 대응 요소</h2>
            <fieldset className="rounded-xl border p-4">
              <legend className="px-1 font-bold">피해진술 구체성</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center gap-2">
                  <input type="radio" name="statementSpecificity" checked={measureOptions.statementSpecificity === 'low'} onChange={() => updateMeasureOption('statementSpecificity', 'low')} />
                  낮음
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="statementSpecificity" checked={measureOptions.statementSpecificity === 'middle'} onChange={() => updateMeasureOption('statementSpecificity', 'middle')} />
                  보통
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="statementSpecificity" checked={measureOptions.statementSpecificity === 'high'} onChange={() => updateMeasureOption('statementSpecificity', 'high')} />
                  높음
                </label>
              </div>
            </fieldset>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['hasEvidence', '증거자료 보유 여부'],
                ['objectiveEvidence', '목격자 또는 객관자료 여부'],
                ['factualDispute', '사실관계 다툼 여부'],
                ['unclearSchoolViolence', '학교폭력 해당성 자체가 불명확함'],
                ['simpleConflict', '단순 갈등 또는 오해에 가까움'],
                ['mutualConflict', '쌍방 갈등 성격'],
                ['witnessConflict', '목격자 진술 불일치'],
                ['lowMeasureNeed', '조치 필요성이 낮음'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(measureOptions[key as keyof MeasureOptions])}
                    onChange={(event) => updateMeasureOption(key as keyof MeasureOptions, event.target.checked as never)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <textarea
          className="h-60 w-full rounded-xl border p-3"
          placeholder="사건 발생일, 장소, 관련 학생, 구체적인 내용, 증거자료를 입력해 주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      )}

      <button onClick={handleDiagnosis} className="btn-primary mt-5">
        AI 진단하기
      </button>
    </div>
  );
}
