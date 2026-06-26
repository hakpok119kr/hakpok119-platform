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
  severityLevel: MeasureScoreLevel;
  persistenceLevel: MeasureScoreLevel;
  intentionalityLevel: MeasureScoreLevel;
  remorseLevel: MeasureScoreLevel;
  reconciliationLevel: MeasureScoreLevel;
  aggravatingItems: string[];
  mitigatingItems: string[];
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

type MeasureScoreLevel = 'very-high' | 'high' | 'middle' | 'low' | 'none';

type D04InputDetails = {
  severity: string;
  persistence: string;
  intentionality: string;
  remorse: string;
  reconciliation: string;
  caseSummary: string;
  incidentContent: string;
};

type SharedMeasureLevel = 'none' | 'no-measure' | '1-3' | '4' | '5-6' | '7-9' | 'unknown';

type SharedMeasureAssessment = {
  level: SharedMeasureLevel;
  label: string;
  reasons: string[];
};

type MeasureResultSections = {
  diagnosisType: string;
  measureScoreV2?: boolean;
  inputSummary: string;
  inputDetails?: D04InputDetails;
  reasoningPoints?: string[];
  factorAnalysis: string;
  baseScore?: string;
  aggravatingItems?: string;
  mitigatingItems?: string;
  finalScore?: string;
  expectedMeasure: string;
  sharedMeasureAssessment?: SharedMeasureAssessment;
  reasons: string;
  comprehensiveOpinion?: string;
  mitigatingFactors: string;
  aggravatingFactors: string;
  caution: string;
  nextSteps: string;
};

type D05RiskGrade =
  | '4호 이상 가능성 매우 높음'
  | '4호 이상 가능성 높음'
  | '4호 이상 가능성 보통'
  | '4호 이상 가능성 낮음';

type D05RiskResultSections = {
  diagnosisType: string;
  d05RiskV2: true;
  inputSummary: string;
  inputDetails?: {
    selectedItems: string;
    factSummary: string;
  };
  factSummary?: string;
  reasoningPoints?: string[];
  diagnosisResult: string;
  riskLevel: D05RiskGrade;
  riskFactors: string[];
  mitigatingFactors: string[];
  expectedMeasures: string;
  sharedMeasureAssessment?: SharedMeasureAssessment;
  studentRecordImpact: string;
  recommendedMaterials: string[];
  schoolRecordPossibility?: string;
  admissionImpactPossibility?: string;
  additionalChecks: string;
  nextActions: string;
  expertOpinion: string;
  nextSteps: string;
  caution: string;
};

type AdminAppealOptions = {
  position: 'perpetrator' | 'victim';
  reviewStatus: 'before-review' | 'completed-before-notice' | 'notice-received';
  noticeDate: string;
  factSummary: string;
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
  inputDetails: {
    currentPosition: string;
    reviewStatus: string;
    noticeDate: string;
    offenderMeasures: string;
    victimMeasures: string;
    objectionReasons: string;
    procedureIssues: string;
    evidenceIssues: string;
    proportionalityIssues: string;
    urgency: string;
    factSummary: string;
  };
  inputSummary: string;
  factSummary: string;
  reasoningPoints: string[];
  appealGrounds: string[];
  riskFactors: string[];
  recommendedMaterials: string[];
  appealLevel: '낮음' | '보통' | '높음' | '매우 높음';
  stayNeed: '낮음' | '보통' | '높음' | '매우 높음';
  stayNeedDescription: string;
  nextActions: string;
  expertOpinion: string;
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

type SchoolViolenceEligibilityGrade =
  | '학교폭력 해당 가능성 높음'
  | '학교폭력 해당 가능성 있음'
  | '학교폭력 해당 가능성 낮음'
  | '단순 갈등 또는 학교폭력 아님 가능성';

type SchoolViolenceEligibilityResultSections = {
  diagnosisType: string;
  schoolViolenceEligibilityV2: true;
  inputContent: string;
  factSummary: string;
  reasoningPoints: string[];
  diagnosisResult: SchoolViolenceEligibilityGrade;
  grounds: string;
  additionalChecks: string;
  evidenceMaterials: string;
  caution: string;
  nextSteps: string;
};

type EvidenceCapabilityResultSections = {
  diagnosisType: string;
  evidenceCapabilityV2: true;
  inputContent: string;
  factSummary: string;
  inputDetails: {
    evidenceTypes: string;
    factSummary: string;
  };
  reasoningPoints: string[];
  diagnosisResult: string;
  missingEvidenceMaterials: string[];
  evidenceMaterials: string;
  additionalEvidenceMaterials: string;
  expertOpinion: string;
  caution: string;
  nextSteps: string;
};

type D06RecordRiskLevel = '낮음' | '보통' | '높음' | '매우 높음';

type D06StudentRecordResultSections = {
  diagnosisType: string;
  d06StudentRecordV2: true;
  inputContent: string;
  factSummary: string;
  inputDetails: {
    selectedItems: string;
    expectedMeasure: string;
    schoolLevel: string;
    grade: string;
    factSummary: string;
  };
  inputSummary: string;
  reasoningPoints: string[];
  sharedMeasureAssessment?: SharedMeasureAssessment;
  recordRiskLevel: string;
  recordRiskDescription: string;
  recordImpactFactors: string[];
  deleteReviewNeed: string;
  deleteReviewEligibility?: string;
  deleteReviewTiming?: string;
  deleteReviewReason?: string;
  deleteReviewDescription: string;
  recommendedMaterials: string[];
  nextActions: string;
  expertOpinion: string;
  caution: string;
  nextSteps: string;
};

type D07AdmissionImpactLevel = '낮음' | '보통' | '높음' | '매우 높음';

const d07AdmissionImpactLevels: Record<'low' | 'normal' | 'high' | 'veryHigh', D07AdmissionImpactLevel> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
  veryHigh: '매우 높음',
};

type D07AdmissionImpactResultSections = {
  diagnosisType: string;
  d07AdmissionImpactV2: true;
  inputContent: string;
  factSummary: string;
  inputDetails: {
    selectedItems: string;
    expectedMeasure: string;
    schoolLevel: string;
    grade: string;
    admissionConcern: string;
    factSummary: string;
  };
  inputSummary: string;
  reasoningPoints: string[];
  sharedMeasureAssessment?: SharedMeasureAssessment;
  admissionImpactLevel: D07AdmissionImpactLevel;
  admissionImpactDescription: string;
  admissionImpactFactors: string[];
  universityCheckPoints: string[];
  recommendedMaterials: string[];
  nextActions: string;
  expertOpinion: string;
  caution: string;
  nextSteps: string;
};

type PrincipalResolutionOptions = {
  incidentContent: string;
  factSummary: string;
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
  inputDetails: {
    diagnosisStatus: string;
    propertyDamageStatus: string;
    continuityStatus: string;
    retaliationStatus: string;
    committeeIntent: string;
    factSummary: string;
  };
  inputSummary: string;
  reasoningPoints: string[];
  possibility: string;
  legalRequirements: string;
  relationshipRecovery: string;
  riskFactors: string;
  additionalChecks: string;
  expertOpinion: string;
  caution: string;
  nextSteps: string;
  preparationDocuments: string;
};

const notice =
  '본 결과는 입력 내용을 기준으로 한 1차 검토자료이며, 실제 판단은 학교의 조사 및 심의 결과에 따라 달라질 수 있습니다.';

const measureNotice =
  '이 결과는 학교폭력예방법 제17조, 같은 법 시행령 제19조 및 가해학생 조치별 적용 세부기준의 판단요소를 참고한 1차 검토자료이며, 실제 조치는 교육지원청 학교폭력대책심의위원회의 판단에 따라 달라질 수 있습니다.';

const preparationDocuments = [
  '학교폭력 조치결정 통보서',
  '학교폭력대책심의위원회 결과통지서',
  '전담조사관 조사보고서 또는 사안조사 자료',
  '심의위원회 제출 의견서',
  '학생 진술서',
  '보호자 의견서',
  '반성문',
  '사과 및 화해 노력 자료',
  '피해회복 관련 자료',
  '목격학생 진술서',
  '문자, 카카오톡, DM, 단체방 캡처',
  '사진, 동영상, 녹음파일',
  '병원 진단서 또는 상담확인서',
  '생활기록부 기재 관련 자료',
  '행정심판 청구기간 확인 자료',
];

const d08NextActions = [
  '현재 입력내용을 기준으로 행정심판 가능성을 검토하려면 먼저 조치결정 통보서, 심의결과 통지서, 조사자료, 제출 의견서, 증거자료를 시간순으로 정리해야 합니다.',
  '행정심판은 처분을 안 날부터 90일, 처분이 있었던 날부터 180일 이내 제기하는 것이 원칙이므로 청구기간을 반드시 확인해야 합니다.',
  '생활기록부 기재, 전학, 특별교육 등 처분 집행으로 회복하기 어려운 손해가 예상되는 경우에는 집행정지 신청도 함께 검토하는 것이 좋습니다.',
].join('\n');

const d08ExpertOpinion = [
  '행정심판 가능성은 단순히 억울하다는 사정만으로 판단되지 않고, 절차상 하자, 사실오인, 증거 부족, 처분 과중, 감경사유 미반영 여부를 종합적으로 검토해야 합니다.',
  '특히 조치결정 통보서, 심의자료, 학생 진술, 목격자 진술, 증거자료, 반성·화해·피해회복 자료를 비교하여 어떤 부분을 다툴 수 있는지 정리하는 것이 중요합니다.',
  '처분으로 생활기록부 기재 등 회복하기 어려운 손해가 발생할 가능성이 있다면 행정심판과 함께 집행정지 신청 여부를 신속하게 검토할 필요가 있습니다.',
].join('\n');

const d08Caution = [
  '본 결과는 입력내용을 기준으로 한 1차 참고자료이며, 법적 확정판단은 아닙니다.',
  '행정심판 가능성은 실제 처분서, 심의자료, 조사자료, 증거자료, 절차 진행 내용에 따라 달라질 수 있습니다.',
  '행정심판은 청구기간 제한이 있으므로 처분 통지를 받은 경우 즉시 기간을 확인해야 합니다.',
].join('\n');

const measureV2Notice =
  '본 결과는 학교폭력예방법 시행령 제19조 및 가해학생 조치별 적용 세부기준의 판단 요소를 참고한 예측 결과입니다. 실제 학교폭력대책심의위원회는 구체적 사실관계, 피해 정도, 진술, 증거, 선도 가능성 등을 종합적으로 판단하므로 실제 결과와 다를 수 있습니다.';

const measureScoreOptions: { value: MeasureScoreLevel; label: string }[] = [
  { value: 'very-high', label: '매우 높음' },
  { value: 'high', label: '높음' },
  { value: 'middle', label: '보통' },
  { value: 'low', label: '낮음' },
  { value: 'none', label: '없음' },
];

const d04ReadableLevelLabels: Record<MeasureScoreLevel, string> = {
  'very-high': '매우 높음',
  high: '높음',
  middle: '보통',
  low: '낮음',
  none: '없음',
};

const isHighMeasureLevel = (level: MeasureScoreLevel) => level === 'very-high' || level === 'high';

const buildD04ReasoningPoints = (options: MeasureOptions) => {
  const severityReason = isHighMeasureLevel(options.severityLevel)
    ? '피해의 심각성이 높게 평가되어 조치수위 상승요소로 작용할 수 있습니다.'
    : options.severityLevel === 'middle'
      ? '피해의 심각성은 보통 수준으로 평가됩니다.'
      : '피해의 심각성이 낮게 평가되어 중한 조치 가능성은 상대적으로 낮습니다.';
  const persistenceReason = isHighMeasureLevel(options.persistenceLevel)
    ? '행위가 반복적·지속적으로 이루어진 것으로 평가되어 불리한 요소가 될 수 있습니다.'
    : options.persistenceLevel === 'middle'
      ? '행위의 지속성은 보통 수준으로 평가됩니다.'
      : '행위의 지속성이 낮아 일회성 사안으로 볼 여지가 있습니다.';
  const intentionalityReason = isHighMeasureLevel(options.intentionalityLevel)
    ? '고의성이 높게 평가되어 책임이 무겁게 판단될 수 있습니다.'
    : options.intentionalityLevel === 'middle'
      ? '고의성은 보통 수준으로 평가됩니다.'
      : '고의성이 낮게 평가되어 감경요소로 고려될 수 있습니다.';
  const remorseReason = isHighMeasureLevel(options.remorseLevel)
    ? '반성 정도가 높게 확인되어 감경요소로 고려될 수 있습니다.'
    : options.remorseLevel === 'middle'
      ? '반성 정도는 보통 수준으로 평가됩니다.'
      : '반성 정도가 낮아 조치수위 감경에는 한계가 있을 수 있습니다.';
  const reconciliationReason = isHighMeasureLevel(options.reconciliationLevel)
    ? '화해 또는 관계회복 가능성이 높아 감경요소로 고려될 수 있습니다.'
    : options.reconciliationLevel === 'middle'
      ? '화해 정도는 보통 수준으로 평가됩니다.'
      : '화해가 충분히 이루어지지 않아 분쟁 지속 가능성이 있습니다.';

  return [
    severityReason,
    persistenceReason,
    intentionalityReason,
    remorseReason,
    reconciliationReason,
  ];
};

const measurePositiveScoreMap: Record<MeasureScoreLevel, number> = {
  'very-high': 4,
  high: 3,
  middle: 2,
  low: 1,
  none: 0,
};

const measureMitigationScoreMap: Record<MeasureScoreLevel, number> = {
  'very-high': 0,
  high: 1,
  middle: 2,
  low: 3,
  none: 4,
};

const measureAggravatingOptions = [
  '집단행위',
  '보복행위',
  '성 관련 사안',
  '사이버 유포',
  '장애학생 피해',
  '강요 또는 금품갈취',
  '신체폭행',
  '진단서 제출',
  '위험한 물건 사용',
  '반복 신고 이력',
];

const measureHighRiskAggravatingOptions = ['보복행위', '성 관련 사안', '사이버 유포', '장애학생 피해'];

const measureMitigatingOptions = [
  '초범',
  '1회성 사건',
  '즉시 사과',
  '반성문 제출',
  '상담 참여',
  '피해회복 노력',
  '화해 성립',
  '재발방지 약속',
  '보호자 협조',
  '증거 불명확',
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

const sharedMeasureLevelRank: Record<SharedMeasureLevel, number> = {
  none: 0,
  'no-measure': 1,
  '1-3': 2,
  '4': 3,
  '5-6': 4,
  '7-9': 5,
  unknown: -1,
};

const sharedMeasureLabels: Record<SharedMeasureLevel, string> = {
  none: '학교폭력 아님 가능성',
  'no-measure': '조치없음 가능성',
  '1-3': '1~3호 가능성',
  '4': '4호 이상 조치 가능성',
  '5-6': '5호 특별교육 또는 6호 출석정지 가능성',
  '7-9': '7~9호 중대 조치 가능성',
  unknown: '입력내용만으로 조치수위 특정 어려움',
};

const normalizeMeasureText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/[~∼～]/g, '-');

const upgradeSharedMeasureAssessment = (
  assessment: SharedMeasureAssessment,
  minimumLevel: SharedMeasureLevel,
  reason: string
): SharedMeasureAssessment => {
  if (
    sharedMeasureLevelRank[assessment.level] < sharedMeasureLevelRank[minimumLevel] ||
    assessment.level === 'unknown'
  ) {
    return {
      level: minimumLevel,
      label: sharedMeasureLabels[minimumLevel],
      reasons: [...assessment.reasons, reason],
    };
  }

  return {
    ...assessment,
    reasons: assessment.reasons.includes(reason) ? assessment.reasons : [...assessment.reasons, reason],
  };
};

const inferSchoolViolenceMeasureLevel = (...values: Array<string | undefined | null>): SharedMeasureAssessment => {
  const source = normalizeMeasureText(values.filter(Boolean).join('\n'));
  const reasons: string[] = [];
  let level: SharedMeasureLevel = 'unknown';

  const setLevel = (nextLevel: SharedMeasureLevel, reason: string) => {
    if (sharedMeasureLevelRank[nextLevel] > sharedMeasureLevelRank[level] || level === 'unknown') {
      level = nextLevel;
    }
    if (!reasons.includes(reason)) reasons.push(reason);
  };
  const hasAnyText = (keywords: string[]) =>
    keywords.some((keyword) => source.includes(normalizeMeasureText(keyword)));
  const highSignals = [
    hasAnyText(['2주이상진단', '2주이상치료', '진료확인서', '병원진료', '치료확인서']) ? '2주 이상 진단서 또는 병원 진료 정황' : null,
    hasAnyText(['위클래스상담', '상담확인서', '불안', '우울', '등교거부']) ? '상담 또는 심리적 피해 정황' : null,
    hasAnyText(['3주반복', '3주이상반복', '반복괴롭힘', '지속적괴롭힘', '여러차례']) ? '반복성 또는 지속성 정황' : null,
    hasAnyText(['다수가해', '집단괴롭힘', '집단행위', '같은반학생3명']) ? '다수 또는 집단 가해 정황' : null,
    hasAnyText(['단체카카오톡방', '단체카톡방', '카카오톡', '카톡', 'sns', '사이버폭력', '사진유포', '조롱글', '따돌림유도']) ? '사이버폭력 또는 유포 정황' : null,
    hasAnyText(['보복행위', '행정심판', '집행정지']) ? '불복 또는 보복 관련 정황' : null,
    hasAnyText(['심의위원회개최', '심의개최', '위원회개최요청']) ? '학교폭력대책심의위원회 개최 정황' : null,
  ].filter(Boolean) as string[];

  if (hasAnyText(['학교폭력아님', '해당없음', '학폭아님'])) {
    setLevel('none', '학교폭력 아님 또는 해당 없음 표현이 확인되었습니다.');
  }
  if (hasAnyText(['조치없음', '처분없음'])) {
    setLevel('no-measure', '조치없음 표현이 확인되었습니다.');
  }
  if (hasAnyText(['1호', '서면사과', '2호', '접촉금지', '3호', '교내봉사'])) {
    setLevel('1-3', '1~3호 조치 표현이 확인되었습니다.');
  }
  if (hasAnyText(['4호', '사회봉사', '4호이상', '4호이상가능성'])) {
    setLevel('4', '4호 이상 조치 가능성 표현이 확인되었습니다.');
  }
  if (hasAnyText(['5호', '6호', '5호이상', '특별교육', '출석정지', '5호또는6호', '5호특별교육', '6호출석정지'])) {
    setLevel('5-6', '5호 특별교육 또는 6호 출석정지 가능성 표현이 확인되었습니다.');
  }
  if (hasAnyText(['7호', '8호', '9호', '학급교체', '전학', '퇴학'])) {
    setLevel('7-9', '7~9호 중대 조치 표현이 확인되었습니다.');
  }
  if (highSignals.length >= 4) {
    setLevel('5-6', `${highSignals.join(', ')}이 함께 확인되어 5~6호 가능성을 검토해야 합니다.`);
  } else if (highSignals.length >= 2) {
    setLevel('4', `${highSignals.join(', ')}이 함께 확인되어 4호 이상 가능성을 검토해야 합니다.`);
  }

  return {
    level,
    label: sharedMeasureLabels[level],
    reasons: reasons.length ? reasons : ['조치수위 추정에 필요한 직접 표현 또는 고위험 정황이 제한적으로 확인되었습니다.'],
  };
};

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
  '진단서 또는 진료확인서',
  '재산피해 내역 및 복구 확인자료',
  '사과문 또는 화해 확인자료',
  '피해학생 및 보호자 의사 확인자료',
  '담임교사 또는 상담교사 상담 기록',
  '사건 경위 메모',
  '문자, 카카오톡, 사진, 녹음 등 관련 증거자료',
];

const principalCautions = [
  '본 결과는 입력내용을 기준으로 한 1차 참고자료이며, 법적 확정판단은 아닙니다.',
  '학교장 자체해결 여부는 학교의 사안조사 결과, 피해학생 측 의사, 전담기구 판단, 관련 법령과 지침에 따라 달라질 수 있습니다.',
];

const principalAdditionalChecks = [
  '피해학생 측에서 2주 이상의 치료를 요하는 진단서를 제출했는지 확인해 주세요.',
  '재산상 피해가 있는 경우 즉시 복구되었는지 확인해 주세요.',
  '행위가 일회성인지, 반복·지속된 사안인지 확인해 주세요.',
  '신고 이후 보복행위 또는 2차 가해로 볼 사정이 있는지 확인해 주세요.',
  '피해학생 및 보호자가 심의위원회 개최를 원하는지 명확히 확인해 주세요.',
  '학교장 자체해결은 요건을 모두 충족해야 가능하므로 하나라도 충족하지 못하면 심의로 넘어갈 수 있습니다.',
];

const principalNextSteps =
  '현재 입력내용을 기준으로 학교장 자체해결 가능성을 검토할 수 있습니다.\n다만 자체해결은 모든 요건을 충족해야 가능하므로, 진단서 제출 여부, 재산피해 회복 여부, 지속성, 보복행위 여부, 피해학생 측 의사를 정확히 확인해야 합니다.\n요건이 명확하지 않거나 피해학생 측이 심의위원회 개최를 원하는 경우에는 학교폭력대책심의위원회 절차를 준비하는 것이 필요합니다.';

const principalExpertOpinion =
  '학교장 자체해결은 단순히 경미한 사안이라는 이유만으로 결정되는 것이 아니라, 법령과 지침상 요건을 모두 충족하는지에 따라 판단됩니다.\n특히 2주 이상의 진단서, 지속성, 보복행위, 피해학생 측 심의위원회 개최 의사는 자체해결 여부에 큰 영향을 미칩니다.\n따라서 학교와 협의하기 전 사실관계와 증빙자료를 정리하고, 필요한 경우 전문가 상담을 통해 자체해결 가능성과 심의 대비 여부를 함께 검토하는 것이 좋습니다.';

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

  const reasoningPoints = [
    options.diagnosisStatus === 'issued'
      ? '2주 이상의 치료를 요하는 진단서가 있는 경우 학교장 자체해결이 어려울 수 있습니다.'
      : options.diagnosisStatus === 'none'
        ? '2주 이상의 치료를 요하는 진단서가 확인되지 않아 자체해결 가능성을 높이는 요소로 볼 수 있습니다.'
        : '2주 이상의 치료를 요하는 진단서 제출 여부가 명확하지 않아 추가 확인이 필요합니다.',
    options.propertyDamageStatus === 'unrestored'
      ? '재산상 피해가 회복되지 않은 경우 자체해결 판단에 불리하게 작용할 수 있습니다.'
      : ['none', 'restored', 'promised'].includes(options.propertyDamageStatus)
        ? '재산상 피해가 없거나 즉시 복구된 경우 자체해결 가능성을 높이는 요소가 됩니다.'
        : '재산상 피해가 있는지, 있다면 즉시 복구되었는지 추가 확인이 필요합니다.',
    options.continuityStatus === 'repeated'
      ? '행위가 반복·지속된 경우 자체해결이 어려울 수 있습니다.'
      : options.continuityStatus === 'once' || options.continuityStatus === 'two-three'
        ? '사안이 지속적이지 않은 경우 자체해결 가능성이 있습니다.'
        : '행위가 일회성인지 반복·지속된 사안인지 추가 확인이 필요합니다.',
    options.retaliationStatus === 'confirmed' || options.retaliationStatus === 'suspected'
      ? '보복행위에 해당할 가능성이 있으면 자체해결이 어려울 수 있습니다.'
      : options.retaliationStatus === 'none'
        ? '보복행위로 보기 어려운 경우 자체해결 검토가 가능합니다.'
        : '보복행위 또는 2차 가해로 볼 사정이 있는지 추가 확인이 필요합니다.',
    options.committeeIntent === 'wanted'
      ? '피해학생 또는 보호자가 심의위원회 개최를 원하는 경우 자체해결은 어렵습니다.'
      : options.committeeIntent === 'not-wanted'
        ? '피해학생 및 보호자가 심의위원회 개최를 원하지 않는 경우 자체해결 요건 검토가 가능합니다.'
        : '피해학생 및 보호자가 심의위원회 개최를 원하는지 명확히 확인해야 합니다.',
  ];

  const inputSummary = [
    `사건 내용: ${options.incidentContent}`,
    `발생일 또는 발생 기간: ${options.incidentDateOrPeriod || '미입력'}`,
    `발생 장소: ${options.incidentPlace || '미입력'}`,
    `관련 학생 관계: ${options.studentRelationship || '미입력'}`,
    `폭력 유형: ${joinLines(options.violenceTypes, '선택 없음')}`,
    `2주 이상 진단서 여부: ${getPrincipalLabel(options.diagnosisStatus)}`,
    `재산피해 여부: ${getPrincipalLabel(options.propertyDamageStatus)}`,
    `지속성 여부: ${getPrincipalLabel(options.continuityStatus)}`,
    `보복행위 여부: ${getPrincipalLabel(options.retaliationStatus)}`,
    `피해학생 측 심의위원회 개최 희망 여부: ${getPrincipalLabel(options.committeeIntent)}`,
    `사실관계 요약: ${options.factSummary.trim() || '입력된 사실관계 요약이 없습니다.'}`,
    `진단서 제출 여부: ${getYesNoLabel(options.diagnosisSubmitted)}`,
    `증거자료 여부: ${getYesNoLabel(options.evidenceAvailable)}`,
    `목격자 진술 여부: ${getYesNoLabel(options.witnessStatement)}`,
    `상담 기록 여부: ${getYesNoLabel(options.counselingRecord)}`,
    `피해학생 측 요구사항 확인 여부: ${getYesNoLabel(options.victimNeedsChecked)}`,
  ].join('\n');

  return {
    diagnosisType: '학교장 자체해결 V2',
    principalResolutionV2: true,
    inputDetails: {
      diagnosisStatus: getPrincipalLabel(options.diagnosisStatus),
      propertyDamageStatus: getPrincipalLabel(options.propertyDamageStatus),
      continuityStatus: getPrincipalLabel(options.continuityStatus),
      retaliationStatus: getPrincipalLabel(options.retaliationStatus),
      committeeIntent: getPrincipalLabel(options.committeeIntent),
      factSummary: options.factSummary.trim(),
    },
    inputSummary,
    reasoningPoints,
    possibility: `${possibility}\n분류: ${classification}${
      blockerReasons.length > 0 ? `\n주요 사유: ${blockerReasons.join(', ')}` : ''
    }${riskCount > 0 ? `\n심의 위험 요소 ${riskCount}개가 확인되어 자체해결 가능성이 낮아질 수 있습니다.` : ''}`,
    legalRequirements,
    relationshipRecovery:
      recoveryItems.length > 0
        ? `${recoveryItems.join(', ')} 요소가 있어 관계회복 가능성은 검토할 수 있습니다.\n다만 관계회복 요소는 법정요건을 대체할 수 없습니다.`
        : '관계회복 요소가 충분히 확인되지 않았습니다. 사과, 반성, 화해, 피해회복, 재발방지 약속 가능성을 추가로 확인하세요.\n다만 관계회복 요소는 법정요건을 대체할 수 없습니다.',
    riskFactors: joinLines(options.riskFactors, '선택된 심의 위험 요소가 없습니다.'),
    additionalChecks: principalAdditionalChecks.join('\n'),
    expertOpinion: principalExpertOpinion,
    caution: principalCautions.join('\n'),
    nextSteps: principalNextSteps,
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

const pushUnique = (items: string[], item: string) => {
  if (!items.includes(item)) items.push(item);
};

const getD08Level = (score: number): AdminAppealResultSections['appealLevel'] => {
  if (score >= 10) return '매우 높음';
  if (score >= 7) return '높음';
  if (score >= 3) return '보통';
  return '낮음';
};

const getD08StayNeedDescription = (stayNeed: AdminAppealResultSections['stayNeed']) => {
  if (stayNeed === '매우 높음') {
    return '처분 집행으로 회복하기 어려운 손해가 예상되고 불복 사유도 있는 경우 행정심판과 함께 집행정지를 신속히 검토해야 합니다.';
  }
  if (stayNeed === '높음') {
    return '생활기록부 기재, 전학, 특별교육 등 회복하기 어려운 손해가 예상되는 경우 집행정지 신청을 적극 검토할 필요가 있습니다.';
  }
  if (stayNeed === '보통') {
    return '처분의 집행으로 불이익이 예상되는 경우 집행정지 신청 여부를 함께 검토할 수 있습니다.';
  }
  return '현재 입력내용만으로는 집행정지 필요성이 크다고 보기는 어렵습니다.';
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
  const normalizedFactSummary = options.factSummary.replace(/\s+/g, '');

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

  const appealGrounds: string[] = [];
  const riskFactors: string[] = [];
  const reasoningPoints: string[] = [];

  if (
    procedureCount > 0 ||
    includesAny(normalizedFactSummary, ['절차', '의견진술', '통지', '안내미흡', '미검토', '열람', '의견서'])
  ) {
    pushUnique(appealGrounds, '심의 절차에서 의견진술 기회가 충분히 보장되지 않았다면 절차상 하자를 검토할 수 있습니다.');
    pushUnique(reasoningPoints, '절차상 하자 또는 의견진술 기회 부족 가능성이 있습니다.');
  }
  if (
    evidenceCount > 0 ||
    includesAny(normalizedFactSummary, ['증거부족', '객관적증거부족', '진술만', '사실오인', '신빙성', '목격자', '불일치'])
  ) {
    pushUnique(appealGrounds, '객관적 증거가 부족하고 진술만으로 판단된 경우 사실오인 또는 증거 부족을 주장할 여지가 있습니다.');
    pushUnique(reasoningPoints, '객관적 증거 부족 또는 사실오인 주장을 검토할 수 있습니다.');
  }
  if (
    proportionalityCount > 0 ||
    options.objectionReasons.some((item) => item.includes('높음') || item.includes('낮음') || item.includes('감경')) ||
    includesAny(normalizedFactSummary, ['과하', '과도', '불균형', '형평', '1회성', '감경', '반성', '사과', '화해', '피해회복'])
  ) {
    pushUnique(appealGrounds, '사안의 정도에 비해 조치수위가 과하다고 볼 사정이 있으면 처분 과중을 검토할 수 있습니다.');
    pushUnique(appealGrounds, '반성, 사과, 화해, 피해회복 등 감경사유가 충분히 반영되지 않았다면 조치수위 다툼이 가능할 수 있습니다.');
    pushUnique(reasoningPoints, '처분수위가 사안에 비해 과하다고 볼 여지가 있습니다.');
  }
  if (
    urgencyCount > 0 ||
    includesAny(normalizedFactSummary, ['생활기록부', '생기부', '전학', '출석정지', '특별교육', '회복하기어려운손해'])
  ) {
    pushUnique(appealGrounds, '생활기록부 기재 등 회복하기 어려운 손해가 예상되는 경우 집행정지 필요성을 함께 검토할 수 있습니다.');
    pushUnique(reasoningPoints, '처분 집행으로 회복하기 어려운 손해가 발생할 우려가 있습니다.');
  }
  if (appealGrounds.length === 0) {
    pushUnique(appealGrounds, '현재 입력내용만으로는 뚜렷한 불복 사유가 많지 않으므로 처분서와 심의자료 확인이 우선 필요합니다.');
    pushUnique(reasoningPoints, '명확한 불복 쟁점이 제한적으로 입력되어 추가 자료 확인이 필요합니다.');
  }

  if (
    options.evidenceIssues.includes('카카오톡, 녹음, CCTV 등 객관자료가 있음') ||
    includesAny(normalizedFactSummary, ['객관적증거충분', 'cctv', 'CCTV', '녹음', '동영상'])
  ) {
    pushUnique(riskFactors, '객관적 증거가 충분한 경우 사실오인 주장은 받아들여지기 어려울 수 있습니다.');
  }
  if (
    includesAny(normalizedFactSummary, ['반복', '지속', '고의', '피해가큼', '피해정도큼']) ||
    options.objectionReasons.includes('고의성·지속성이 과대평가됨') ||
    options.objectionReasons.includes('지속성·고의성이 과소평가됨')
  ) {
    pushUnique(riskFactors, '반복성, 고의성, 피해 정도가 높게 인정된 경우 처분 과중 주장은 제한될 수 있습니다.');
  }
  if (options.procedureIssues.includes('절차상 문제 없음')) {
    pushUnique(riskFactors, '절차상 하자가 명확하지 않으면 행정심판에서 다툴 쟁점이 약해질 수 있습니다.');
  }
  if (
    includesAny(normalizedFactSummary, ['반성부족', '화해미이행', '사과없', '피해회복부족', '보복', '2차가해']) ||
    options.urgency.includes('전학·출석정지 등 즉시 영향 있음')
  ) {
    pushUnique(riskFactors, '피해회복이나 화해 노력이 부족한 경우 감경 주장이 약해질 수 있습니다.');
  }
  if (riskFactors.length === 0) {
    pushUnique(riskFactors, '현재 입력내용만으로는 뚜렷한 불리한 요소가 확인되지 않았습니다.');
  }

  let appealLevel = getD08Level(score);
  if (score >= 10 || urgencyCount >= 2) appealLevel = '매우 높음';
  if (options.reviewStatus === 'before-review') appealLevel = score >= 5 ? '보통' : '낮음';
  if (options.position === 'perpetrator' && hasNoOffenderAction) appealLevel = '낮음';

  let stayScore = urgencyCount;
  if (highOffenderMeasures) stayScore += 2;
  if (includesAny(normalizedFactSummary, ['생활기록부', '생기부', '전학', '출석정지', '특별교육', '회복하기어려운손해'])) stayScore += 3;
  const stayNeed: AdminAppealResultSections['stayNeed'] =
    stayScore >= 5 && appealLevel !== '낮음' ? '매우 높음' : stayScore >= 3 ? '높음' : stayScore >= 1 ? '보통' : '낮음';
  const stayNeedDescription = getD08StayNeedDescription(stayNeed);
  const appealNeed = appealLevel;

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
  const caution = [d08Caution, noActionPerpetratorCaution].filter(Boolean).join('\n');
  const inputDetails = {
    currentPosition: positionLabel,
    reviewStatus: reviewStatusLabel,
    noticeDate: options.noticeDate || '미입력',
    offenderMeasures: offenderSummary,
    victimMeasures: victimSummary,
    objectionReasons: joinLines(options.objectionReasons, '입력된 불복 방향이 없습니다.'),
    procedureIssues: joinLines(options.procedureIssues, '입력된 절차상 문제가 없습니다.'),
    evidenceIssues: joinLines(options.evidenceIssues, '입력된 사실관계·증거 문제가 없습니다.'),
    proportionalityIssues: joinLines(options.proportionalityIssues, '입력된 비례원칙 관련 쟁점이 없습니다.'),
    urgency: joinLines(options.urgency, '입력된 긴급성 항목이 없습니다.'),
    factSummary: options.factSummary.trim(),
  };
  const inputSummary = [
    `현재 입장: ${inputDetails.currentPosition}`,
    `심의 진행 상태: ${inputDetails.reviewStatus}`,
    `조치결정 통지일: ${inputDetails.noticeDate}`,
    `가해학생 조치: ${inputDetails.offenderMeasures}`,
    `피해학생 보호조치: ${inputDetails.victimMeasures}`,
    `불복 방향: ${inputDetails.objectionReasons}`,
    `절차상 문제: ${inputDetails.procedureIssues}`,
    `사실관계·증거 문제: ${inputDetails.evidenceIssues}`,
    `비례원칙 관련: ${inputDetails.proportionalityIssues}`,
    `긴급성: ${inputDetails.urgency}`,
    `사실관계 요약: ${inputDetails.factSummary || '입력된 사실관계 요약이 없습니다.'}`,
  ].join('\n');

  return {
    diagnosisType: '행정심판 가능성 V2',
    adminAppealV2: true,
    inputDetails,
    inputSummary,
    factSummary: options.factSummary.trim(),
    reasoningPoints,
    appealGrounds,
    riskFactors,
    recommendedMaterials: preparationDocuments,
    appealLevel,
    stayNeed,
    stayNeedDescription,
    nextActions: d08NextActions,
    expertOpinion: d08ExpertOpinion,
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
    nextSteps: d08NextActions,
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

  const isVerbalOnlyMinorCase =
    options.verbalViolence &&
    !options.physicalViolence &&
    !options.cyberViolence &&
    !options.extortion &&
    !options.coercion &&
    !options.sexualIssue &&
    !options.groupAction &&
    !options.weaponUse &&
    !options.retaliation &&
    !options.victimDisabled;
  const isVerbalOnlyLightFrequency =
    isVerbalOnlyMinorCase &&
    options.damageLevel === 'minor' &&
    (options.frequency === 'once' || options.frequency === 'two-three') &&
    !options.continued &&
    (options.duration === 'one-day' || options.duration === 'within-week');

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
  if (isVerbalOnlyMinorCase) {
    intentionalityScore = Math.min(intentionalityScore, 2);
  }

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

  if (isVerbalOnlyMinorCase) {
    mitigatingFactors.push('언어폭력 단독 사안으로 신체폭력, 금품갈취, 강요·협박성, 성 관련 사안 등 중대 유형은 입력되지 않았습니다.');
  }
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
  if (isVerbalOnlyLightFrequency) {
    cautions.push('언어폭력 단독이고 피해가 경미하며 1회 또는 2~3회 정도의 단기간 사안이면, 중대 가중요소가 추가로 확인되지 않는 한 1~3호 범위를 우선 검토합니다.');
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

  if (isVerbalOnlyLightFrequency && !options.previousSimilarCase) {
    expectedMeasure = '1~3호 가능성';
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
  if (isVerbalOnlyMinorCase) {
    reasons.push('언어폭력 단독 사안은 고의성이 입력되더라도 신체폭력, 금품갈취, 강요·협박성, 성 관련 사안이 없는 경우 고의성 점수 상한을 낮춰 반영했습니다.');
  }
  if (isVerbalOnlyLightFrequency) {
    reasons.push('언어폭력 단독, 경미 피해, 1회 또는 2~3회 정도의 단기간 사안이므로 기본 조치 범위는 1~3호를 우선 표시했습니다.');
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
    `고의성: ${intentionalityScore}점 - ${
      isVerbalOnlyMinorCase
        ? '언어폭력 단독 사안은 고의성 점수 상한을 낮춰 반영했습니다.'
        : '고의성 및 계획적·보복적 정황을 반영했습니다.'
    }`,
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

const calculateMeasureScoreResult = (options: MeasureOptions): MeasureResultSections => {
  const severityScore = measurePositiveScoreMap[options.severityLevel];
  const persistenceScore = measurePositiveScoreMap[options.persistenceLevel];
  const intentionalityScore = measurePositiveScoreMap[options.intentionalityLevel];
  const remorseScore = measureMitigationScoreMap[options.remorseLevel];
  const reconciliationScore = measureMitigationScoreMap[options.reconciliationLevel];
  const baseScore = severityScore + persistenceScore + intentionalityScore + remorseScore + reconciliationScore;

  const hasHighRiskAggravating = options.aggravatingItems.some((item) =>
    measureHighRiskAggravatingOptions.includes(item)
  );
  let aggravatingAdjustment = 0;
  if (options.aggravatingItems.length >= 3) aggravatingAdjustment = 2;
  else if (options.aggravatingItems.length >= 1) aggravatingAdjustment = 1;
  if (hasHighRiskAggravating) aggravatingAdjustment = Math.max(aggravatingAdjustment, 2);

  let mitigatingAdjustment = 0;
  if (options.mitigatingItems.length >= 5) mitigatingAdjustment = -3;
  else if (options.mitigatingItems.length >= 3) mitigatingAdjustment = -2;
  else if (options.mitigatingItems.length >= 1) mitigatingAdjustment = -1;

  let finalScore = Math.max(0, baseScore + aggravatingAdjustment + mitigatingAdjustment);
  const allCoreNone =
    options.severityLevel === 'none' &&
    options.persistenceLevel === 'none' &&
    options.intentionalityLevel === 'none';
  const coreLowOrBelow =
    (options.severityLevel === 'low' || options.severityLevel === 'none') &&
    (options.persistenceLevel === 'low' || options.persistenceLevel === 'none') &&
    (options.intentionalityLevel === 'low' || options.intentionalityLevel === 'none');
  const oneTimeRecovered =
    options.mitigatingItems.includes('1회성 사건') &&
    !options.aggravatingItems.includes('신체폭행') &&
    !options.aggravatingItems.includes('진단서 제출') &&
    (options.mitigatingItems.includes('피해회복 노력') || options.mitigatingItems.includes('화해 성립'));
  const strongRemorseAndReconciliation =
    (options.remorseLevel === 'very-high' || options.remorseLevel === 'high') &&
    (options.reconciliationLevel === 'very-high' || options.reconciliationLevel === 'high') &&
    options.mitigatingItems.includes('초범');

  const getMeasureByScore = (score: number) => {
    if (score <= 3) {
      return {
        expectedMeasure: '학교폭력 아님 또는 조치없음 가능성',
        description:
          '사안의 심각성, 지속성, 고의성이 낮거나 확인되지 않아 조치가 없거나 학교폭력으로 인정되지 않을 가능성이 있습니다.',
        rank: 0,
      };
    }
    if (score <= 6) {
      return {
        expectedMeasure: '1호 서면사과 가능성',
        description:
          '비교적 경미한 사안으로 볼 수 있으나, 피해학생 보호와 관계회복을 위해 서면사과 조치가 검토될 수 있습니다.',
        rank: 1,
      };
    }
    if (score <= 9) {
      return {
        expectedMeasure: '1호~2호 가능성',
        description: '서면사과 또는 접촉·협박·보복행위 금지 조치가 검토될 수 있습니다.',
        rank: 2,
      };
    }
    if (score <= 12) {
      return {
        expectedMeasure: '2호~3호 가능성',
        description: '접촉금지 또는 학교에서의 봉사 조치가 검토될 수 있습니다.',
        rank: 3,
      };
    }
    if (score <= 15) {
      return {
        expectedMeasure: '3호~5호 가능성',
        description: '학교봉사, 사회봉사, 특별교육 이수 등이 검토될 수 있습니다.',
        rank: 4,
      };
    }
    if (score <= 18) {
      return {
        expectedMeasure: '5호~7호 가능성',
        description: '특별교육, 출석정지, 학급교체 등 비교적 중한 조치가 검토될 수 있습니다.',
        rank: 5,
      };
    }
    return {
      expectedMeasure: '8호~9호 가능성',
      description: '전학 또는 퇴학처분 수준의 중대한 사안으로 평가될 가능성이 있습니다.',
      rank: 6,
    };
  };

  let measureResult = getMeasureByScore(finalScore);
  const applyMaximumRank = (maxRank: number) => {
    while (measureResult.rank > maxRank && finalScore > 0) {
      finalScore -= 1;
      measureResult = getMeasureByScore(finalScore);
    }
  };

  if (allCoreNone) {
    finalScore = Math.min(finalScore, 3);
    measureResult = getMeasureByScore(finalScore);
  }
  if (coreLowOrBelow) applyMaximumRank(3);
  if (oneTimeRecovered) applyMaximumRank(2);
  if (strongRemorseAndReconciliation && measureResult.rank > 0) {
    const currentRank = measureResult.rank;
    while (measureResult.rank >= currentRank && finalScore > 0) {
      finalScore -= 1;
      measureResult = getMeasureByScore(finalScore);
    }
  }

  const labelOf = (level: MeasureScoreLevel) =>
    measureScoreOptions.find((option) => option.value === level)?.label ?? level;
  const selectedAggravating = joinLines(options.aggravatingItems, '선택한 가중요소가 없습니다.');
  const selectedMitigating = joinLines(options.mitigatingItems, '선택한 감경요소가 없습니다.');
  const cautions = [measureV2Notice];
  if (hasHighRiskAggravating) {
    cautions.push('고위험 가중요소가 확인되어 실제 심의에서 조치수위가 높아질 수 있습니다.');
  }

  const reasons = [
    `심각성 ${severityScore}점, 지속성 ${persistenceScore}점, 고의성 ${intentionalityScore}점, 반성정도 ${remorseScore}점, 화해정도 ${reconciliationScore}점을 합산했습니다.`,
    `가중요소 ${options.aggravatingItems.length}개로 +${aggravatingAdjustment}점, 감경요소 ${options.mitigatingItems.length}개로 ${mitigatingAdjustment}점을 반영했습니다.`,
  ];
  if (coreLowOrBelow) {
    reasons.push('심각성, 지속성, 고의성이 모두 낮음 이하로 입력되어 4호 이상으로 과대평가되지 않도록 제한했습니다.');
  }
  if (allCoreNone) {
    reasons.push('심각성, 지속성, 고의성이 모두 없음으로 입력되어 학교폭력 아님 가능성을 우선 표시했습니다.');
  }
  if (oneTimeRecovered) {
    reasons.push('1회성 사건이고 신체폭행·진단서 제출이 없으며 피해회복 또는 화해 요소가 있어 3호 이상으로 나오지 않도록 제한했습니다.');
  }
  if (strongRemorseAndReconciliation) {
    reasons.push('반성정도와 화해정도가 높음 이상이고 초범이어서 결과를 한 단계 낮춰 표시했습니다.');
  }

  const inputSummary = [
    `심각성: ${labelOf(options.severityLevel)}`,
    `지속성: ${labelOf(options.persistenceLevel)}`,
    `고의성: ${labelOf(options.intentionalityLevel)}`,
    `반성정도: ${labelOf(options.remorseLevel)}`,
    `화해정도: ${labelOf(options.reconciliationLevel)}`,
  ].join('\n');

  const factorAnalysis = [
    `심각성: ${labelOf(options.severityLevel)} (${severityScore}점)`,
    `지속성: ${labelOf(options.persistenceLevel)} (${persistenceScore}점)`,
    `고의성: ${labelOf(options.intentionalityLevel)} (${intentionalityScore}점)`,
    `반성정도: ${labelOf(options.remorseLevel)} (${remorseScore}점, 감경요소 역산)`,
    `화해정도: ${labelOf(options.reconciliationLevel)} (${reconciliationScore}점, 감경요소 역산)`,
  ].join('\n');

  const sharedMeasureAssessment = inferSchoolViolenceMeasureLevel(
    options.incidentContent,
    measureResult.expectedMeasure,
    measureResult.description,
    selectedAggravating,
    selectedMitigating,
    reasons.join('\n')
  );

  return {
    diagnosisType: '조치수위 예측',
    measureScoreV2: true,
    inputSummary,
    inputDetails: {
      severity: d04ReadableLevelLabels[options.severityLevel],
      persistence: d04ReadableLevelLabels[options.persistenceLevel],
      intentionality: d04ReadableLevelLabels[options.intentionalityLevel],
      remorse: d04ReadableLevelLabels[options.remorseLevel],
      reconciliation: d04ReadableLevelLabels[options.reconciliationLevel],
      caseSummary: options.incidentContent.trim(),
      incidentContent: options.incidentContent.trim(),
    },
    reasoningPoints: buildD04ReasoningPoints(options),
    factorAnalysis,
    baseScore: `${baseScore}점`,
    aggravatingItems: `${selectedAggravating}\n보정: +${aggravatingAdjustment}점`,
    mitigatingItems: `${selectedMitigating}\n보정: ${mitigatingAdjustment}점`,
    finalScore: `${finalScore}점`,
    expectedMeasure: measureResult.expectedMeasure,
    sharedMeasureAssessment,
    reasons: reasons.join('\n'),
    comprehensiveOpinion: measureResult.description,
    mitigatingFactors: selectedMitigating,
    aggravatingFactors: selectedAggravating,
    caution: cautions.join('\n'),
    nextSteps:
      '선택 항목과 실제 증거자료가 일치하는지 확인하고, 사건 일시·장소·관련 학생·피해 상태·증거 목록을 시간순으로 정리해 상담예약을 통해 실제 대응방향을 점검해 주세요.',
  };
};

const hasD05Keyword = (content: string, keywords: string[]) => {
  const normalized = content.replace(/\s/g, '').toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.replace(/\s/g, '').toLowerCase()));
};

const calculateD05RiskResult = (options: MeasureOptions) => {
  const content = options.incidentContent;
  const hasThreat = hasD05Keyword(content, ['협박', '위협', '겁을 줌', '죽이겠다', '가만두지 않겠다']);
  const hasPhotoVideoSpread = hasD05Keyword(content, [
    '사진 유포',
    '영상 유포',
    '동영상 유포',
    '불법촬영',
    '촬영물',
    '캡처 유포',
    '단톡방 공유',
    'sns 게시',
  ]);
  const hasDiagnosisOrTreatment = hasD05Keyword(content, ['진단서', '소견서', '병원', '치료', '상담센터', '의무기록']);
  const hasCounselingRecord = hasD05Keyword(content, ['상담자료', '상담기록', '상담확인서', '위클래스', '전문상담']);
  const hasMinorDamage = options.damageLevel === 'minor';
  const hasOneTime = options.frequency === 'once' && !options.continued && options.duration === 'one-day';

  const riskFactors = [
    { label: '신체폭력', matched: options.physicalViolence, score: 4 },
    { label: '반복 발생', matched: options.frequency === 'repeated', score: 4 },
    { label: '지속성 있음', matched: options.continued || options.duration === 'within-month' || options.duration === 'over-month', score: 3 },
    { label: '고의성 있음', matched: options.intentional, score: 3 },
    { label: '협박', matched: hasThreat, score: 3 },
    { label: '강요', matched: options.coercion, score: 3 },
    { label: '금품갈취', matched: options.extortion, score: 3 },
    { label: '성 관련 사안', matched: options.sexualIssue, score: 6 },
    { label: '사이버폭력', matched: options.cyberViolence, score: 3 },
    { label: '사진·영상 유포', matched: hasPhotoVideoSpread, score: 5 },
    { label: '집단행위', matched: options.groupAction, score: 4 },
    { label: '보복행위', matched: options.retaliation, score: 5 },
    { label: '위험한 물건 사용', matched: options.weaponUse, score: 6 },
    { label: '피해학생이 장애학생인 경우', matched: options.victimDisabled, score: 4 },
    { label: '병원 진단서 또는 치료자료 있음', matched: hasDiagnosisOrTreatment, score: 3 },
    { label: '피해학생 상담자료 있음', matched: hasCounselingRecord, score: 2 },
    { label: '목격자 또는 객관자료 있음', matched: options.objectiveEvidence || options.hasEvidence, score: 2 },
    { label: '이전 유사 사안 있음', matched: options.previousSimilarCase, score: 3 },
    { label: '반성 없음', matched: !options.remorse, score: 2 },
    { label: '사과 없음', matched: !options.apology, score: 2 },
    { label: '화해 또는 합의 없음', matched: !options.reconciliation, score: 2 },
    { label: '보호자 재발방지 노력 없음', matched: !options.guardianEffort, score: 2 },
  ];

  const mitigatingFactors = [
    { label: '1회성', matched: hasOneTime, score: 3 },
    { label: '피해 경미', matched: hasMinorDamage, score: 3 },
    { label: '단순 말다툼', matched: options.simpleConflict, score: 3 },
    { label: '오해 또는 장난', matched: options.unclearSchoolViolence || hasD05Keyword(content, ['오해', '장난']), score: 2 },
    { label: '즉시 사과', matched: options.apology && hasD05Keyword(content, ['즉시 사과', '바로 사과', '당일 사과']), score: 2 },
    { label: '화해 또는 합의', matched: options.reconciliation, score: 3 },
    { label: '보호자 사과', matched: options.guardianEffort && hasD05Keyword(content, ['보호자 사과', '부모 사과', '학부모 사과']), score: 2 },
    { label: '재발방지 약속', matched: options.guardianEffort, score: 2 },
    { label: '초범', matched: options.firstOffense, score: 2 },
    { label: '객관자료 부족', matched: !options.objectiveEvidence && !options.hasEvidence, score: 2 },
    { label: '사실관계 다툼 있음', matched: options.factualDispute, score: 2 },
    { label: '학교폭력 해당성 불명확', matched: options.unclearSchoolViolence, score: 3 },
    { label: '쌍방 갈등 성격', matched: options.mutualConflict, score: 2 },
  ];

  const riskScore = riskFactors
    .filter((factor) => factor.matched)
    .reduce((sum, factor) => sum + factor.score, 0);
  const mitigationScore = mitigatingFactors
    .filter((factor) => factor.matched)
    .reduce((sum, factor) => sum + factor.score, 0);
  const totalScore = Math.max(0, riskScore - mitigationScore);
  const coreRiskCount = [
    options.physicalViolence,
    options.frequency === 'repeated',
    options.continued,
    options.intentional,
    hasThreat || options.coercion,
    options.groupAction,
    options.retaliation,
    options.sexualIssue,
    options.weaponUse,
    hasPhotoVideoSpread,
    hasDiagnosisOrTreatment || options.objectiveEvidence,
  ].filter(Boolean).length;

  let riskLevel: D05RiskGrade = '4호 이상 가능성 낮음';
  if (totalScore >= 20 || coreRiskCount >= 6 || options.sexualIssue || options.weaponUse) {
    riskLevel = '4호 이상 가능성 매우 높음';
  } else if (totalScore >= 12 || coreRiskCount >= 3 || options.retaliation || options.groupAction) {
    riskLevel = '4호 이상 가능성 높음';
  } else if (totalScore >= 5 || riskScore > 0) {
    riskLevel = '4호 이상 가능성 보통';
  }

  if (
    riskLevel !== '4호 이상 가능성 매우 높음' &&
    hasOneTime &&
    hasMinorDamage &&
    (options.apology || options.reconciliation) &&
    !options.previousSimilarCase &&
    !options.sexualIssue &&
    !options.weaponUse &&
    !options.retaliation
  ) {
    riskLevel = riskScore >= 6 ? '4호 이상 가능성 보통' : '4호 이상 가능성 낮음';
  }

  const matchedRiskFactors = riskFactors.filter((factor) => factor.matched).map((factor) => factor.label);
  const matchedMitigatingFactors = mitigatingFactors.filter((factor) => factor.matched).map((factor) => factor.label);

  const guidanceByLevel: Record<D05RiskGrade, string[]> = {
    '4호 이상 가능성 매우 높음': [
      '신체폭력, 반복성, 고의성, 협박·강요, 집단성, 보복성, 피해자료 등이 복합적으로 확인되는 경우입니다.',
      '4호 이상 조치 가능성이 높고, 생활기록부 기재 및 진학 영향 검토가 필요합니다.',
      '사실관계와 증거자료를 시간순으로 정리해야 합니다.',
    ],
    '4호 이상 가능성 높음': [
      '피해 정도, 지속성, 고의성, 증거자료 중 일부 위험요소가 확인되는 경우입니다.',
      '4호 이상 가능성을 배제하기 어렵습니다.',
      '반성문, 사과, 화해 노력, 보호자 재발방지 자료를 준비할 필요가 있습니다.',
    ],
    '4호 이상 가능성 보통': [
      '일부 위험요소는 있으나 피해가 경미하거나 감경요소도 함께 있는 경우입니다.',
      '1~3호 또는 4호 이상 사이에서 다툼이 있을 수 있습니다.',
      '증거자료, 진술 일관성, 반성·화해 여부가 중요합니다.',
    ],
    '4호 이상 가능성 낮음': [
      '단순 갈등, 일회성, 피해 경미, 사과·화해, 초범, 객관자료 부족 등이 확인되는 경우입니다.',
      '4호 이상 가능성은 낮아 보이나, 추가 피해나 반복성이 확인되면 달라질 수 있습니다.',
      '학교폭력 해당성 자체와 조치 필요성부터 검토할 필요가 있습니다.',
    ],
  };

  const schoolRecordPossibility =
    riskLevel === '4호 이상 가능성 매우 높음' || riskLevel === '4호 이상 가능성 높음'
      ? '생활기록부 기재 가능성 있음'
      : riskLevel === '4호 이상 가능성 보통'
        ? '사안에 따라 생활기록부 기재 가능성 검토 필요'
        : '생활기록부 기재 가능성 낮음';
  const admissionImpactPossibility =
    riskLevel === '4호 이상 가능성 매우 높음' || riskLevel === '4호 이상 가능성 높음'
      ? '대학입시 영향 가능성 있음'
      : riskLevel === '4호 이상 가능성 보통'
        ? '전형과 대학 기준에 따라 영향 가능성 검토 필요'
        : '현재 입력내용만으로는 대학입시 영향 가능성 낮음';

  const inputSummary = [
    `진단유형: 4호 이상 위험도 진단`,
    `현재 입장: ${options.position === 'perpetrator' ? '가해학생 측' : '피해학생 측'}`,
    `사건 내용: ${content}`,
    `피해 정도: ${getDamageLevelLabel(options.damageLevel)}`,
    `발생 횟수: ${getFrequencyLabel(options.frequency)}`,
    `발생 기간: ${getDurationLabel(options.duration)}`,
    `증거자료 보유 여부: ${options.hasEvidence || options.objectiveEvidence ? '있음' : '부족하거나 미입력'}`,
    `사실관계 다툼 여부: ${options.factualDispute ? '있음' : '명확히 입력되지 않음'}`,
  ].join('\n');

  return {
    diagnosisType: '4호 이상 위험도 진단',
    d05RiskV2: true,
    inputSummary,
    diagnosisResult: guidanceByLevel[riskLevel].join('\n'),
    riskLevel,
    riskFactors: matchedRiskFactors.length > 0 ? matchedRiskFactors.join('\n') : '현재 입력내용에서 뚜렷한 위험요소가 충분히 확인되지 않았습니다.',
    mitigatingFactors:
      matchedMitigatingFactors.length > 0 ? matchedMitigatingFactors.join('\n') : '현재 입력내용에서 뚜렷한 감경요소가 충분히 확인되지 않았습니다.',
    schoolRecordPossibility,
    admissionImpactPossibility,
    additionalChecks: [
      '피해 발생 일시, 장소, 관련 학생, 목격자를 시간순으로 확인해 주세요.',
      '진단서, 치료자료, 상담자료, 사진·영상, 문자·SNS, CCTV 등 객관자료가 있는지 확인해 주세요.',
      '반복성, 고의성, 협박·강요, 보복성, 집단성 여부를 구체적인 표현과 행동으로 정리해 주세요.',
      '사과, 반성, 화해 또는 합의, 보호자 재발방지 노력 자료가 있는지 확인해 주세요.',
    ].join('\n'),
    nextSteps: [
      riskLevel === '4호 이상 가능성 매우 높음' || riskLevel === '4호 이상 가능성 높음'
        ? '증거자료와 진술을 먼저 정리하고, 생활기록부 및 진학 영향까지 함께 검토해 주세요.'
        : riskLevel === '4호 이상 가능성 보통'
          ? '위험요소와 감경요소를 나누어 정리하고, 1~3호와 4호 이상 판단에서 다툴 지점을 확인해 주세요.'
          : '학교폭력 해당성, 조치 필요성, 추가 피해 또는 반복성 여부부터 차분히 확인해 주세요.',
      '입력하지 못한 자료가 있으면 결과가 달라질 수 있으므로, 사안조사 자료와 객관자료를 보완해 주세요.',
      '필요하면 상담예약을 통해 실제 대응방향을 점검해 주세요.',
    ].join('\n'),
    caution:
      '이 결과는 입력내용을 기준으로 한 1차 위험도 진단입니다. 법률상 확정판단이 아니며, 실제 조치와 생활기록부·입시 영향은 조사 결과, 증거자료, 심의 판단, 학교와 교육청 기준에 따라 달라질 수 있어 추가 확인이 필요합니다.',
  };
};

const calculateD05RiskReportResult = (
  options: MeasureOptions,
  factSummary: string
): D05RiskResultSections => {
  const incidentContent = options.incidentContent.trim();
  const trimmedFactSummary = factSummary.trim();
  const combinedContent = `${incidentContent}\n${trimmedFactSummary}`;

  const addUnique = (items: string[], item: string) => {
    if (!items.includes(item)) items.push(item);
  };

  const riskFactors: string[] = [];
  const mitigatingFactors: string[] = [];
  const reasoningPoints: string[] = [];
  const recommendedMaterials: string[] = [
    '사건 경위서',
    '학생 진술서',
    '보호자 의견서',
  ];

  const hasRepeated = options.frequency === 'repeated' || options.continued || options.duration === 'within-month' || options.duration === 'over-month' || hasD05Keyword(combinedContent, ['반복', '지속', '계속', '여러 차례', '2주 이상']);
  const hasSevereDamage = options.damageLevel === 'severe' || hasD05Keyword(combinedContent, ['상해', '진단서', '병원', '치료', '불안', '상담', '등교 거부']);
  const hasDiagnosisOrTreatment = hasD05Keyword(combinedContent, ['진단서', '소견서', '병원', '치료', '상담확인서', '상담기록']);
  const hasCyberSpread = options.cyberViolence || hasD05Keyword(combinedContent, ['단체방', '카카오톡', '카톡', 'dm', 'sns', '캡처', '사진 유포', '영상 유포', '게시']);
  const hasRetaliationOrSecondary = options.retaliation || hasD05Keyword(combinedContent, ['보복', '2차 가해', '신고하면', '가만두지']);
  const hasThreatOrCoercion = options.coercion || options.extortion || hasD05Keyword(combinedContent, ['협박', '위협', '강요', '금품', '돈', '갈취']);
  const hasRepairEffort = options.apology || options.reconciliation || options.guardianEffort || hasD05Keyword(combinedContent, ['사과', '화해', '합의', '피해회복', '재발방지', '반성문']);

  if (hasRepeated) {
    addUnique(riskFactors, '행위가 반복되거나 지속된 경우 4호 이상 조치 가능성을 높이는 요소가 될 수 있습니다.');
    addUnique(reasoningPoints, '반복성 또는 지속성이 확인되어 조치수위 상승 요소로 검토됩니다.');
  }
  if (hasSevereDamage) {
    addUnique(riskFactors, '피해 정도가 무겁거나 병원 진료가 필요한 경우 중한 조치 가능성이 높아질 수 있습니다.');
    addUnique(reasoningPoints, '피해 정도와 진료 가능성이 핵심 판단요소로 반영되었습니다.');
  }
  if (options.groupAction) {
    addUnique(riskFactors, '다수 학생이 관여한 경우 집단성 요소로 평가될 수 있습니다.');
    addUnique(reasoningPoints, '집단행위 여부가 4호 이상 위험도 판단에 반영되었습니다.');
  }
  if (hasCyberSpread) {
    addUnique(riskFactors, '사이버폭력 또는 단체방 유포가 있는 경우 피해 확산 가능성이 고려될 수 있습니다.');
    addUnique(reasoningPoints, '온라인 전파 가능성이 피해 확대 요소로 검토되었습니다.');
  }
  if (hasRetaliationOrSecondary) {
    addUnique(riskFactors, '보복행위 또는 2차 가해가 의심되는 경우 불리한 요소가 될 수 있습니다.');
    addUnique(reasoningPoints, '보복 또는 2차 가해 가능성이 위험요소로 반영되었습니다.');
  }
  if (hasThreatOrCoercion) {
    addUnique(riskFactors, '협박, 강요, 금품요구 등은 4호 이상 위험도를 높일 수 있습니다.');
    addUnique(reasoningPoints, '협박, 강요, 금품요구 관련 입력이 조치수위 상승 요소로 검토되었습니다.');
  }
  if (options.sexualIssue || options.weaponUse || options.previousSimilarCase) {
    addUnique(riskFactors, '성 관련 사안, 위험한 물건 사용, 기존 유사 이력은 중한 조치 위험을 높일 수 있습니다.');
    addUnique(reasoningPoints, '고위험 사안 유형 또는 재발 가능성이 확인되었습니다.');
  }
  if (!options.remorse) addUnique(riskFactors, '반성 정도가 부족한 경우 감경이 제한될 수 있습니다.');
  if (!options.apology) addUnique(riskFactors, '사과 또는 피해회복 노력이 확인되지 않으면 불리한 요소가 될 수 있습니다.');
  if (!options.reconciliation) addUnique(riskFactors, '화해 또는 관계회복이 충분히 확인되지 않았습니다.');

  if (options.frequency === 'once' && !options.continued) {
    addUnique(mitigatingFactors, '사안이 1회성에 가깝다면 중한 조치 가능성은 낮아질 수 있습니다.');
  }
  if (options.damageLevel === 'minor' && !hasDiagnosisOrTreatment) {
    addUnique(mitigatingFactors, '피해 정도가 경미하고 진단서가 없는 경우 감경요소로 고려될 수 있습니다.');
  }
  if (hasRepairEffort) {
    addUnique(mitigatingFactors, '사과, 반성, 상담 참여, 보호자 지도 의사 등은 재발방지 노력으로 평가될 수 있습니다.');
  }
  if (options.firstOffense) addUnique(mitigatingFactors, '기존 동종 전력이나 재발 가능성이 낮다면 감경요소가 될 수 있습니다.');
  if (options.unclearSchoolViolence || options.simpleConflict || options.mutualConflict || options.factualDispute) {
    addUnique(mitigatingFactors, '사실관계 다툼, 쌍방 갈등, 단순 오해 가능성은 추가 확인이 필요한 감경요소입니다.');
  }

  const riskScore =
    (hasRepeated ? 4 : 0) +
    (hasSevereDamage ? 4 : 0) +
    (options.groupAction ? 3 : 0) +
    (hasCyberSpread ? 3 : 0) +
    (hasRetaliationOrSecondary ? 4 : 0) +
    (hasThreatOrCoercion ? 3 : 0) +
    (options.sexualIssue ? 5 : 0) +
    (options.weaponUse ? 5 : 0) +
    (options.previousSimilarCase ? 3 : 0) +
    (!options.remorse ? 2 : 0) +
    (!options.apology ? 1 : 0) +
    (!options.reconciliation ? 1 : 0);
  const mitigationScore =
    (options.frequency === 'once' && !options.continued ? 3 : 0) +
    (options.damageLevel === 'minor' && !hasDiagnosisOrTreatment ? 3 : 0) +
    (hasRepairEffort ? 3 : 0) +
    (options.firstOffense ? 2 : 0) +
    (options.unclearSchoolViolence || options.simpleConflict || options.mutualConflict || options.factualDispute ? 2 : 0);
  const totalScore = Math.max(0, riskScore - mitigationScore);

  let riskLevel: D05RiskGrade = '4호 이상 가능성 낮음';
  if (totalScore >= 17 || options.sexualIssue || options.weaponUse || (hasRepeated && hasSevereDamage && hasRetaliationOrSecondary)) {
    riskLevel = '4호 이상 가능성 매우 높음';
  } else if (totalScore >= 10 || hasRetaliationOrSecondary || options.groupAction || (hasRepeated && hasSevereDamage)) {
    riskLevel = '4호 이상 가능성 높음';
  } else if (totalScore >= 4 || riskFactors.length > 0) {
    riskLevel = '4호 이상 가능성 보통';
  }

  const expectedMeasuresByLevel: Record<D05RiskGrade, string> = {
    '4호 이상 가능성 낮음': '조치없음 또는 1~2호 가능성 검토',
    '4호 이상 가능성 보통': '1~3호 가능성 검토',
    '4호 이상 가능성 높음': '3~5호 가능성 검토',
    '4호 이상 가능성 매우 높음': '4호 이상 조치 가능성 높음, 사안에 따라 5~9호까지 검토 필요',
  };

  const studentRecordImpactByLevel: Record<D05RiskGrade, string> = {
    '4호 이상 가능성 낮음': '현재 입력내용만으로는 생활기록부 기재 위험이 상대적으로 낮아 보입니다.',
    '4호 이상 가능성 보통': '조치수위에 따라 생활기록부 기재 여부가 달라질 수 있으므로 추가 확인이 필요합니다.',
    '4호 이상 가능성 높음': '4호 이상 조치 가능성이 있는 경우 생활기록부 기재 및 향후 문제제기 여부를 함께 검토해야 합니다.',
    '4호 이상 가능성 매우 높음': '4호 이상 조치 가능성이 높아 생활기록부 기재, 문제제기, 향후 진학 영향까지 함께 검토할 필요가 있습니다.',
  };

  if (hasRepairEffort) {
    addUnique(recommendedMaterials, '반성문');
    addUnique(recommendedMaterials, '사과 및 화해 노력 자료');
    addUnique(recommendedMaterials, '피해회복 관련 자료');
  }
  if (hasDiagnosisOrTreatment) addUnique(recommendedMaterials, '병원 진단서 또는 진료확인서');
  if (hasCyberSpread) addUnique(recommendedMaterials, '문자, 카카오톡, DM, 단체방 캡처');
  if (options.groupAction || options.objectiveEvidence) addUnique(recommendedMaterials, '목격학생 진술서');
  if (options.hasEvidence || options.objectiveEvidence) addUnique(recommendedMaterials, '사진, 동영상, 녹음파일');
  addUnique(recommendedMaterials, '상담확인서');
  addUnique(recommendedMaterials, '학폭 상담 기록');
  addUnique(recommendedMaterials, '재발방지 계획서');

  if (riskFactors.length === 0) {
    addUnique(riskFactors, '현재 입력내용에서는 뚜렷한 4호 이상 위험요인이 충분히 확인되지 않았습니다.');
  }
  if (mitigatingFactors.length === 0) {
    addUnique(mitigatingFactors, '현재 입력내용에서는 뚜렷한 감경요인이 충분히 확인되지 않았습니다.');
  }
  if (reasoningPoints.length === 0) {
    addUnique(reasoningPoints, '입력된 사건 내용과 선택 항목을 기준으로 4호 이상 위험도를 1차 검토했습니다.');
  }

  const selectedItems = [
    `현재 입장: ${options.position === 'perpetrator' ? '가해학생 측' : '피해학생 측'}`,
    `사건 내용: ${incidentContent}`,
    `피해 정도: ${getDamageLevelLabel(options.damageLevel)}`,
    `발생 횟수: ${getFrequencyLabel(options.frequency)}`,
    `발생 기간: ${getDurationLabel(options.duration)}`,
    `증거자료 보유 여부: ${options.hasEvidence || options.objectiveEvidence ? '있음' : '부족하거나 미입력'}`,
    `사실관계 다툼 여부: ${options.factualDispute ? '있음' : '명확히 입력되지 않음'}`,
  ].join('\n');

  const diagnosisResult = [
    `4호 이상 위험도: ${riskLevel.replace('4호 이상 가능성 ', '')}`,
    '',
    '주요 사유',
    ...reasoningPoints.map((point) => `- ${point}`),
  ].join('\n');

  const nextActions = [
    '현재 입력내용을 기준으로 4호 이상 조치 가능성에 영향을 줄 수 있는 위험요인과 감경요인을 함께 정리해야 합니다.',
    '위험요인이 많은 경우에는 심의위원회 제출자료를 미리 준비하고 반성, 사과, 피해회복, 재발방지 노력 등 감경자료를 함께 정리하는 것이 중요합니다.',
    '생활기록부 기재 가능성이 있는 조치가 예상되는 경우에는 조치수위, 문제제기 가능성, 향후 진학 영향까지 함께 검토하는 것이 좋습니다.',
  ].join('\n');

  const expertOpinion = [
    '4호 이상 조치 여부는 단순한 사건 유형만으로 결정되지 않고, 사건의 지속성, 고의성, 반성 정도, 화해 여부, 피해회복 노력, 재발 가능성 등을 종합하여 판단합니다.',
    '특히 반복적 상해 정도, 집단성, 사이버 확산, 보복행위, 반성 부족은 4호 이상 위험도를 높일 수 있습니다.',
    '반대로 진정한 사과, 화해 노력, 피해회복, 반성문, 보호자 지도, 상담 참여 등은 감경요소로 검토될 수 있습니다.',
    '따라서 현재 사안에서는 위험요인과 감경요인을 함께 정리하여 심의 전 제출자료와 진술 방향을 준비하는 것이 좋습니다.',
  ].join('\n');

  let sharedMeasureAssessment = inferSchoolViolenceMeasureLevel(
    incidentContent,
    trimmedFactSummary,
    expectedMeasuresByLevel[riskLevel],
    diagnosisResult,
    reasoningPoints.join('\n')
  );
  if (totalScore >= 17 || options.sexualIssue || options.weaponUse) {
    sharedMeasureAssessment = upgradeSharedMeasureAssessment(
      sharedMeasureAssessment,
      '5-6',
      'D05 4호 이상 위험도가 매우 높음으로 산정되어 최소 5~6호 가능성을 함께 검토해야 합니다.'
    );
  } else if (totalScore >= 10 || riskFactors.length > 0) {
    sharedMeasureAssessment = upgradeSharedMeasureAssessment(
      sharedMeasureAssessment,
      '4',
      'D05 4호 이상 위험도가 높음 이상으로 산정되어 최소 4호 이상 가능성을 함께 검토해야 합니다.'
    );
  }

  return {
    diagnosisType: '4호 이상 위험도 진단',
    d05RiskV2: true,
    inputSummary: selectedItems,
    inputDetails: {
      selectedItems,
      factSummary: trimmedFactSummary,
    },
    factSummary: trimmedFactSummary,
    reasoningPoints,
    diagnosisResult,
    riskLevel,
    riskFactors,
    mitigatingFactors,
    expectedMeasures: `${expectedMeasuresByLevel[riskLevel]}\n\n실제 최종 조치는 학교폭력대책심의위원회 판단에 따라 달라질 수 있습니다.`,
    sharedMeasureAssessment,
    studentRecordImpact: studentRecordImpactByLevel[riskLevel],
    recommendedMaterials,
    schoolRecordPossibility: studentRecordImpactByLevel[riskLevel],
    admissionImpactPossibility: studentRecordImpactByLevel[riskLevel],
    additionalChecks: reasoningPoints.join('\n'),
    nextActions,
    nextSteps: nextActions,
    expertOpinion,
    caution:
      '본 결과는 입력내용을 기준으로 한 1차 참고자료이며, 법적 확정판단은 아닙니다.\n실제 조치수위는 학폭 조사, 전담기구 검토, 학교폭력대책심의위원회 판단, 피해 정도, 증거자료, 학생 진술, 반성 및 화해 여부에 따라 달라질 수 있습니다.\n생활기록부 기재 및 문제제기 여부는 최종 조치수위와 관련 지침에 따라 달라질 수 있습니다.',
  };
};

const d03EvidenceItems = [
  {
    label: '사건 당시 대화자료',
    keywords: ['문자', '카카오톡', '카톡', 'dm', '디엠', '단톡', '단체방', '캡처', '채팅', '메시지'],
    reasoning:
      '문자, 카카오톡, DM 등 대화자료는 사건 당시의 발언과 정황을 확인하는 데 도움이 될 수 있습니다.',
  },
  {
    label: '사진 또는 동영상',
    keywords: ['사진', '동영상', '영상', '촬영', '캡처사진'],
    reasoning:
      '사진 또는 동영상 자료는 피해 정황이나 현장 상황을 객관적으로 확인하는 데 도움이 될 수 있습니다.',
  },
  {
    label: '녹음파일',
    keywords: ['녹음', '녹취', '음성파일', '음성 파일'],
    reasoning:
      '녹음파일은 발언 내용과 당시 상황을 확인하는 자료가 될 수 있으나, 녹음 경위와 편집 여부가 함께 확인될 필요가 있습니다.',
  },
  {
    label: '병원 진단서 또는 진료확인서',
    keywords: ['병원', '진단서', '진료확인서', '진료 확인서', '소견서', '치료'],
    reasoning:
      '병원 진단서 또는 진료확인서는 신체적·정신적 피해 정도를 설명하는 데 중요한 자료가 될 수 있습니다.',
  },
  {
    label: '위클래스 상담확인서',
    keywords: ['위클래스', 'wee', '학교상담', '학교 상담'],
    reasoning:
      '상담확인서는 피해학생의 불안, 우울, 학교생활 곤란 등 정신적 피해를 설명하는 보완자료가 될 수 있습니다.',
  },
  {
    label: '외부 전문기관 상담확인서',
    keywords: ['상담확인서', '상담 확인서', '전문기관', '청소년상담', '정신건강', '상담센터'],
    reasoning:
      '상담확인서는 피해학생의 불안, 우울, 학교생활 곤란 등 정신적 피해를 설명하는 보완자료가 될 수 있습니다.',
  },
  {
    label: '목격학생 진술서',
    keywords: ['목격', '목격자', '목격학생', '진술서', '친구 진술'],
    reasoning:
      '목격학생 진술은 사건 당시 상황을 제3자의 관점에서 보완하는 자료가 될 수 있습니다.',
  },
  {
    label: '사건 경위 메모',
    keywords: ['경위', '메모', '일지', '시간순', '정리', '기록'],
    reasoning:
      '사건 경위 메모는 발생일시, 장소, 관련학생, 피해내용을 시간순으로 설명하는 기초자료가 될 수 있습니다.',
  },
];

const d03AdditionalEvidenceMaterials = [
  '문자, 카카오톡, DM, 단체방 캡처 원본',
  '사진, 동영상 원본 파일',
  '녹음파일 및 녹음 일시 메모',
  '병원 진단서 또는 진료확인서',
  '위클래스 상담확인서',
  '외부 전문기관 상담확인서',
  '목격학생 진술서',
  '담임교사 또는 학교 상담 기록',
  '사건 발생일 기준 시간순 경위서',
];

const d03NextSteps = [
  '현재 확보한 증거자료를 기준으로 사건의 발생일시, 장소, 관련학생, 피해내용을 시간순으로 정리하는 것이 중요합니다.',
  '증거자료는 가능한 원본을 보관하고, 캡처자료는 날짜와 상대방 표시가 보이도록 정리해 주세요.',
  '피해 정도를 입증할 필요가 있는 경우 병원 진단서, 진료확인서, 위클래스 상담확인서, 외부 전문기관 상담자료를 함께 준비하는 것이 좋습니다.',
];

const d03ExpertOpinion = [
  '학교폭력 사안에서는 단순히 증거의 개수보다 사건과 직접 관련되는지, 시간순으로 정리되어 있는지, 원본성이 유지되는지가 중요합니다.',
  '카카오톡, 문자, 사진, 녹음, 상담확인서, 목격학생 진술 등은 서로 보완관계에 있으므로 한 가지 자료만으로 부족할 수 있습니다.',
  '따라서 현재 확보한 자료를 기준으로 부족한 증거를 보완하고, 필요한 경우 전문가 상담을 통해 제출자료의 순서와 표현을 점검하는 것이 좋습니다.',
];

const d03Caution = [
  '본 결과는 입력내용을 기준으로 한 1차 참고자료이며, 법적 확정판단은 아닙니다.',
  '증거의 인정 여부와 판단 비중은 학교 조사, 전담기구 검토, 심의위원회 판단, 실제 자료의 원본성·관련성·구체성에 따라 달라질 수 있습니다.',
];

const calculateEvidenceCapabilityResult = (
  inputContent: string,
  factSummary: string
): EvidenceCapabilityResultSections => {
  const normalized = `${inputContent}\n${factSummary}`.replace(/\s/g, '').toLowerCase();
  const matchedItems = d03EvidenceItems.filter((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword.replace(/\s/g, '').toLowerCase()))
  );
  const selectedLabels = matchedItems.map((item) => item.label);
  const missingEvidenceMaterials = d03EvidenceItems
    .filter((item) => !selectedLabels.includes(item.label) && item.label !== '녹음파일')
    .map((item) => item.label);
  const reasoningPoints = Array.from(new Set(matchedItems.map((item) => item.reasoning)));

  if (reasoningPoints.length === 0 || (matchedItems.length <= 1 && factSummary.trim())) {
    reasoningPoints.push('현재 입력내용만으로는 증거가 충분하다고 보기 어려우므로 추가 자료 확보가 필요합니다.');
  }

  const diagnosisResult =
    matchedItems.length >= 5
      ? '증거자료 확보 수준: 비교적 양호'
      : matchedItems.length >= 3
        ? '증거자료 확보 수준: 보완 필요'
        : '증거자료 확보 수준: 추가 확보 필요';

  return {
    diagnosisType: '증거능력 진단 V2',
    evidenceCapabilityV2: true,
    inputContent: inputContent.trim(),
    factSummary: factSummary.trim(),
    inputDetails: {
      evidenceTypes: inputContent.trim(),
      factSummary: factSummary.trim(),
    },
    reasoningPoints,
    diagnosisResult,
    missingEvidenceMaterials,
    evidenceMaterials: d03AdditionalEvidenceMaterials.join('\n'),
    additionalEvidenceMaterials: d03AdditionalEvidenceMaterials.join('\n'),
    expertOpinion: d03ExpertOpinion.join('\n'),
    caution: d03Caution.join('\n'),
    nextSteps: d03NextSteps.join('\n'),
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

const d01HighRiskKeywords = [
  '폭행',
  '때림',
  '맞음',
  '밀침',
  '욕설',
  '협박',
  '모욕',
  '따돌림',
  '왕따',
  '괴롭힘',
  '단체방',
  '단톡방',
  '카톡',
  '카카오톡',
  'dm',
  '인스타',
  '사진유포',
  '사진 유포',
  '동영상유포',
  '유포',
  '금품요구',
  '금품 요구',
  '돈요구',
  '돈 요구',
  '갈취',
  '강요',
  '지속',
  '반복',
  '계속',
  '보복',
  '병원',
  '진단서',
  '상담',
  '불안',
  '우울',
  '성폭력',
  '명예훼손',
  '사이버',
];

const d01LowRiskKeywords = [
  '서로 말다툼',
  '말다툼',
  '오해',
  '장난',
  '일회성',
  '한번',
  '사과',
  '화해',
  '피해 없음',
  '피해없음',
  '다친 곳 없음',
  '다친곳 없음',
  '다친 곳 없다',
  '다친곳 없다',
];

const d01ContextKeywords = {
  student: ['학생', '친구', '같은 반', '같은반', '반 친구', '동급생', '선배', '후배'],
  school: ['학교', '교실', '복도', '운동장', '급식', '수업', '등교', '하교', '학급', '단체방', '단톡방'],
  harm: ['다침', '상처', '멍', '통증', '병원', '진단서', '불안', '우울', '상담', '공포', '등교 거부'],
  intent: ['고의', '일부러', '반복', '지속', '계속', '집단', '여러 명', '여러명', '단체로', '보복'],
};

const d01ReasoningKeywords = {
  physical: ['폭행', '상해', '때림', '맞음', '밀침', '발로', '주먹', '신체폭력', '다침', '상처', '멍', '통증'],
  verbal: ['욕설', '모욕', '비하', '놀림', '별명', '협박', '명예훼손', '욕', '말로'],
  cyber: ['단톡방', '단체방', 'sns', '카톡', '카카오톡', '메시지', '문자', 'dm', '온라인', '게시글', '유포', '사이버'],
  bullying: ['따돌림', '왕따', '배제', '무시', '관계 단절', '놀림', '반복', '지속'],
};

const d01EvidenceMaterials = [
  '문자, 카카오톡, DM, 단체방 캡처',
  '사진, 동영상, 녹음파일',
  '병원 진단서 또는 진료확인서',
  '위클래스 상담확인서',
  '외부 전문기관 상담확인서',
  '목격자 진술',
  '담임교사 또는 학교 상담 기록',
  '사건 경위 메모',
];

const d01NextStepsByGrade: Record<SchoolViolenceEligibilityGrade, string[]> = {
  '학교폭력 해당 가능성 높음': [
    '신고 전후 사실관계와 증거를 시간순으로 정리해야 합니다.',
    '피해 내용, 발생일시, 장소, 가해학생, 목격자를 구체화해야 합니다.',
    '긴급보호조치, 분리조치, 상담자료 확보 필요성을 검토해 주세요.',
  ],
  '학교폭력 해당 가능성 있음': [
    '단순 갈등인지 학교폭력 사안인지 추가 확인이 필요합니다.',
    '피해 정도, 반복성, 고의성, 학생 사이의 관계성을 확인해 주세요.',
    '증거자료를 먼저 정리한 후 신고 또는 상담을 검토해 주세요.',
  ],
  '학교폭력 해당 가능성 낮음': [
    '학교폭력보다는 학생 간 갈등 또는 생활지도 사안일 가능성이 있습니다.',
    '다만 피해감정, 반복 여부, 추가 증거에 따라 달라질 수 있습니다.',
    '학교 상담, 담임 면담, 화해중재를 우선 검토해 볼 수 있습니다.',
  ],
  '단순 갈등 또는 학교폭력 아님 가능성': [
    '현재 입력내용만으로는 학교폭력 해당성이 약해 보입니다.',
    '감정 대립, 오해, 일회성 다툼 가능성이 있는지 확인해 주세요.',
    '추가 피해나 반복 발생 시 다시 진단하고 자료를 정리해 주세요.',
  ],
};

const getMatchedD01Keywords = (content: string, keywords: string[]) =>
  keywords.filter((keyword) => content.includes(keyword.toLowerCase()));

const hasD01Keyword = (content: string, keywords: string[]) =>
  getMatchedD01Keywords(content, keywords).length > 0;

const d06RecommendedMaterials = [
  '학교폭력 조치결정 통보서',
  '학교폭력대책심의위원회 결과통지서',
  '생활기록부 기재 여부 확인자료',
  '조치 이행 확인자료',
  '반성문',
  '사과 및 화해 노력 자료',
  '피해회복 관련 자료',
  '상담확인서',
  '봉사활동 또는 특별교육 이수자료',
  '담임교사 또는 학교 상담 기록',
  '행정심판 관련 자료',
  '집행정지 검토 자료',
  '삭제심의 신청 관련 자료',
];

const d06NextActions = [
  '현재 입력내용을 기준으로 생활기록부 기재 가능성과 삭제심의 필요성을 함께 검토해야 합니다.',
  '특히 4호 이상 조치가 예상되거나 이미 결정된 경우 조치결정 통보서, 심의결과, 조치 이행자료, 반성·화해·피해회복 자료를 정리하는 것이 중요합니다.',
  '생활기록부 기재로 인해 진학이나 학교생활에 불이익이 예상되는 경우에는 삭제심의, 행정심판, 집행정지 가능성도 함께 검토하는 것이 좋습니다.',
].join('\n');

const d06ExpertOpinion = [
  '생활기록부 영향은 단순히 학교폭력 신고 여부만으로 결정되는 것이 아니라 최종 조치수위, 학교급, 학년, 조치 이행 여부, 삭제심의 가능성에 따라 달라질 수 있습니다.',
  '특히 4호 이상 조치가 예상되거나 결정된 경우에는 생활기록부 기재 여부와 삭제 가능성, 행정심판 가능성을 함께 검토해야 합니다.',
  '따라서 조치결정 통보를 받은 경우에는 기재 여부, 불복기간, 삭제심의 시기, 제출자료를 신속히 확인하는 것이 좋습니다.',
].join('\n');

const d06Caution = [
  '본 결과는 입력내용을 기준으로 한 1차 참고자료이며, 법적 확정판단은 아닙니다.',
  '생활기록부 기재 여부와 삭제심의 가능성은 최종 조치수위, 학교급, 관련 법령, 교육부 지침, 학교의 처리 절차에 따라 달라질 수 있습니다.',
  '입시 영향은 대학별 반영 방식과 모집요강에 따라 달라질 수 있으므로 D07 대학입시 영향 진단에서 별도로 확인하는 것이 좋습니다.',
].join('\n');

const calculateD06StudentRecordResult = (
  content: string,
  factSummary: string
): D06StudentRecordResultSections => {
  const inputContent = content.trim();
  const trimmedFactSummary = factSummary.trim();
  const source = `${inputContent}\n${trimmedFactSummary}`.toLowerCase();
  const compact = source.replace(/\s/g, '');
  const includesMeasure = (numbers: number[]) =>
    numbers.some((number) => compact.includes(`${number}호`));
  const hasHighMeasure = includesMeasure([4, 5, 6, 7, 8, 9]) || includesAny(source, ['4호 이상', '사회봉사', '특별교육', '출석정지', '학급교체', '전학', '퇴학']);
  const hasFiveOrMore = includesMeasure([5, 6, 7, 8, 9]) || includesAny(source, ['5호 이상', '특별교육', '출석정지', '학급교체', '전학', '퇴학']);
  const hasEightOrNine = includesMeasure([8, 9]) || includesAny(source, ['전학', '퇴학']);
  const hasLowMeasure = includesMeasure([1, 2, 3]) || includesAny(source, ['서면사과', '접촉금지', '보복행위 금지', '학교봉사']);
  const isElementary = includesAny(source, ['초등학교', '초등학생', '초등']);
  const isMiddle = includesAny(source, ['중학교', '중학생', '중등']);
  const isHighSchool = includesAny(source, ['고등학교', '고등학생', '고1', '고2', '고3', '대입', '입시', '진학']);
  const needsAppeal = includesAny(source, ['행정심판', '집행정지', '불복', '이의', '처분', '통보서']);
  const needsDeleteReview = includesAny(source, ['삭제심의', '삭제', '졸업 전 삭제', '생기부 삭제']);
  const admissionConcern = includesAny(source, ['대입', '입시', '진학', '고등학생', '고등학교']);

  const recordRiskLevel: D06RecordRiskLevel = hasEightOrNine
    ? '매우 높음'
    : hasFiveOrMore
      ? '높음'
      : hasHighMeasure || (admissionConcern && needsDeleteReview)
        ? '높음'
        : hasLowMeasure
          ? '낮음'
          : '보통';

  const recordRiskDescription = hasEightOrNine
    ? '전학 또는 퇴학 수준의 조치가 예상되는 경우 생활기록부 및 진학 영향이 매우 클 수 있으므로 즉시 대응전략을 검토해야 합니다.'
    : hasFiveOrMore
      ? '5호 이상 조치는 생활기록부 기재와 향후 삭제심의, 진학 영향까지 함께 검토할 필요가 있습니다.'
      : hasHighMeasure
        ? '4호 이상 조치가 예상되거나 결정된 경우 생활기록부 기재 가능성을 신중히 검토해야 합니다.'
        : '1호~3호 조치의 경우 생활기록부 기재 영향은 상대적으로 낮을 수 있으나, 구체적인 조치와 관련 지침 확인이 필요합니다.';

  const deleteReviewNeed: D06RecordRiskLevel = hasEightOrNine || (hasFiveOrMore && needsAppeal)
    ? '매우 높음'
    : hasFiveOrMore || hasHighMeasure || needsDeleteReview
      ? '높음'
      : hasLowMeasure
        ? '낮음'
        : '보통';

  const deleteReviewDescriptionMap: Record<D06RecordRiskLevel, string> = {
    낮음: '현재 입력내용만으로는 삭제심의를 즉시 검토할 필요성은 크지 않아 보입니다.',
    보통: '조치수위와 학교급에 따라 삭제심의 가능성을 확인할 필요가 있습니다.',
    높음: '생활기록부 기재 가능성이 있는 조치라면 삭제심의 요건과 시기를 함께 검토해야 합니다.',
    '매우 높음': '중한 조치가 예상되거나 결정된 경우 생활기록부 기재, 삭제심의, 행정심판 가능성을 함께 검토하는 것이 좋습니다.',
  };

  const recordImpactFactors = [
    hasHighMeasure ? '4호 이상 조치 가능성' : null,
    includesMeasure([5]) || source.includes('특별교육') ? '5호 특별교육 가능성' : null,
    includesMeasure([6]) || source.includes('출석정지') ? '6호 출석정지 가능성' : null,
    includesMeasure([7]) || source.includes('학급교체') ? '7호 학급교체 가능성' : null,
    includesMeasure([8]) || source.includes('전학') ? '8호 전학 가능성' : null,
    includesMeasure([9]) || source.includes('퇴학') ? '9호 퇴학 가능성' : null,
    isHighSchool || admissionConcern ? '고등학생 또는 대입 예정 학생' : null,
    includesAny(source, ['불복기간', '기간 경과', '통보']) ? '조치결정 이후 불복기간 경과 우려' : null,
    needsDeleteReview ? '삭제심의 필요성' : null,
    needsAppeal ? '행정심판 또는 집행정지 필요성' : null,
  ].filter(Boolean) as string[];

  if (recordImpactFactors.length === 0) {
    recordImpactFactors.push('최종 조치수위와 학교급 확인 필요');
  }

  const reasoningPoints = [
    hasLowMeasure && !hasHighMeasure
      ? '입력내용에 1호~3호 수준 조치가 포함되어 생활기록부 기재 영향은 상대적으로 낮게 검토됩니다.'
      : '입력내용을 기준으로 받은 조치 또는 예상 조치수위를 우선 검토했습니다.',
    hasHighMeasure
      ? '4호 이상 조치 가능성이 있어 생활기록부 기재 여부와 후속 대응 필요성이 커질 수 있습니다.'
      : '4호 이상 조치 가능성은 명확하지 않으므로 조치결정 통보서와 심의결과 확인이 필요합니다.',
    hasFiveOrMore
      ? '5호 이상 조치 가능성이 있어 삭제심의와 진학 영향까지 함께 검토할 필요가 있습니다.'
      : '5호 이상 중한 조치 여부는 현재 입력내용만으로 제한적으로 확인됩니다.',
    isElementary || isMiddle || isHighSchool
      ? `학교급은 ${isElementary ? '초등학교' : isMiddle ? '중학교' : '고등학교'}로 파악되어 학교급별 기재·삭제 기준 확인이 필요합니다.`
      : '학교급과 학년 정보가 명확할수록 생활기록부 기재 및 삭제심의 판단 정확도가 높아집니다.',
    needsAppeal
      ? '행정심판 또는 집행정지 관련 표현이 있어 불복기간과 처분 집행 가능성을 함께 확인해야 합니다.'
      : '조치결정 이후 불복 또는 집행정지 검토 필요성은 통보서 수령 여부에 따라 달라질 수 있습니다.',
  ];

  const expectedMeasure = hasEightOrNine
    ? '8호 전학 또는 9호 퇴학 수준'
    : hasFiveOrMore
      ? '5호 이상 조치 가능성'
      : hasHighMeasure
        ? '4호 이상 조치 가능성'
        : hasLowMeasure
          ? '1호~3호 수준'
          : '구체적인 조치수위 추가 확인 필요';
  const schoolLevel = isElementary ? '초등학교' : isMiddle ? '중학교' : isHighSchool ? '고등학교' : '추가 확인 필요';
  const gradeMatch = source.match(/([1-6])\s*학년|초\s*([1-6])|중\s*([1-3])|고\s*([1-3])/);
  const grade = gradeMatch?.[0] ?? '추가 확인 필요';
  const inputSummary = [
    `선택/입력한 D06 항목: ${inputContent}`,
    `받은 조치 또는 예상 조치: ${expectedMeasure}`,
    `학교급: ${schoolLevel}`,
    `학년: ${grade}`,
    `사실관계 요약: ${trimmedFactSummary || '입력된 사실관계 요약이 없습니다.'}`,
  ].join('\n');

  let sharedMeasureAssessment = inferSchoolViolenceMeasureLevel(
    inputContent,
    trimmedFactSummary,
    expectedMeasure,
    recordRiskDescription,
    reasoningPoints.join('\n')
  );
  if (hasEightOrNine) {
    sharedMeasureAssessment = upgradeSharedMeasureAssessment(
      sharedMeasureAssessment,
      '7-9',
      'D06에서 전학 또는 퇴학 등 중대 조치 가능성이 확인되어 7~9호 수준으로 보정했습니다.'
    );
  } else if (hasFiveOrMore) {
    sharedMeasureAssessment = upgradeSharedMeasureAssessment(
      sharedMeasureAssessment,
      '5-6',
      'D06에서 5호 이상 조치 가능성이 확인되어 최소 5~6호 수준으로 보정했습니다.'
    );
  } else if (hasHighMeasure) {
    sharedMeasureAssessment = upgradeSharedMeasureAssessment(
      sharedMeasureAssessment,
      '4',
      'D06에서 4호 이상 조치 가능성이 확인되어 최소 4호 수준으로 보정했습니다.'
    );
  }

  return {
    diagnosisType: '생활기록부 영향 진단',
    d06StudentRecordV2: true,
    inputContent,
    factSummary: trimmedFactSummary,
    inputDetails: {
      selectedItems: inputContent,
      expectedMeasure,
      schoolLevel,
      grade,
      factSummary: trimmedFactSummary,
    },
    inputSummary,
    reasoningPoints,
    sharedMeasureAssessment,
    recordRiskLevel,
    recordRiskDescription,
    recordImpactFactors,
    deleteReviewNeed,
    deleteReviewDescription: deleteReviewDescriptionMap[deleteReviewNeed],
    recommendedMaterials: d06RecommendedMaterials,
    nextActions: d06NextActions,
    expertOpinion: d06ExpertOpinion,
    caution: d06Caution,
    nextSteps: d06NextActions,
  };
};

const d06V2RecommendedMaterials = [
  '조치결정통지서',
  '특별교육 이수 확인서 또는 이행자료',
  '반성문',
  '재발방지 약속서',
  '담임교사 또는 상담교사 의견자료',
  '봉사활동 또는 학교생활 개선자료',
  '피해회복 노력자료',
  '보호자 협조자료',
];

const d06V2Caution =
  '본 진단은 입력 내용에 따른 참고용 안내입니다. 최종 판단은 조치결정서, 학교생활기록부 기재 지침, 학교 및 교육청 안내에 따라 달라질 수 있습니다.';

const calculateD06StudentRecordAssessmentResult = (
  content: string,
  factSummary: string
): D06StudentRecordResultSections => {
  const inputContent = content.trim();
  const trimmedFactSummary = factSummary.trim();
  const source = `${inputContent}\n${trimmedFactSummary}`;
  const compact = source.replace(/\s/g, '');
  const includesKeyword = (keyword: string) => source.includes(keyword) || compact.includes(keyword.replace(/\s/g, ''));
  const includesAnyKeyword = (keywords: string[]) => keywords.some(includesKeyword);
  const highMeasureKeywords = ['4호', '사회봉사', '5호', '특별교육', '6호', '출석정지', '7호', '학급교체', '8호', '전학', '9호', '퇴학'];
  const lowMeasureKeywords = ['학교폭력 아님', '조치없음', '1호', '서면사과', '2호', '접촉금지', '3호', '교내봉사'];
  const hasHighMeasure = includesAnyKeyword(highMeasureKeywords);
  const hasLowMeasure = includesAnyKeyword(lowMeasureKeywords);
  const isHighSchool = includesAnyKeyword(['고등학교', '고등학생', '고1', '고2', '고3', '대입', '입시']);
  const isMiddleSchool = includesAnyKeyword(['중학교', '중학생', '중1', '중2', '중3']);
  const isElementarySchool = includesAnyKeyword(['초등학교', '초등학생', '초1', '초2', '초3', '초4', '초5', '초6']);
  const caseType = hasHighMeasure && isHighSchool
    ? 'high-school-high-measure'
    : hasHighMeasure && isMiddleSchool
      ? 'middle-school-high-measure'
      : hasLowMeasure
        ? 'low-measure'
        : hasHighMeasure
          ? 'high-measure'
          : 'unknown';
  const recordRiskLevel = caseType === 'high-school-high-measure'
    ? '높음'
    : caseType === 'middle-school-high-measure' || caseType === 'high-measure'
      ? '있음'
      : caseType === 'low-measure'
        ? '낮음'
        : '추가 확인 필요';
  const deleteReviewEligibility = caseType === 'low-measure' ? '해당 가능성 낮음' : hasHighMeasure ? '검토 필요' : '추가 확인 필요';
  const deleteReviewTiming = caseType === 'high-school-high-measure'
    ? '졸업 전 삭제심의 가능 여부 및 요건 확인 필요'
    : caseType === 'middle-school-high-measure'
      ? '졸업 전 또는 상급학교 진학 전 삭제 가능 여부 확인 필요'
      : caseType === 'low-measure'
        ? '현재 단계에서는 조치결정서 및 학교 안내 확인 필요'
        : '최종 조치수위와 학교 안내에 따른 삭제 가능 시기 확인 필요';
  const deleteReviewReason = caseType === 'high-school-high-measure'
    ? '대학입시 및 학생부 반영 가능성이 있으므로 조치결정 이후부터 자료 준비가 필요합니다.'
    : caseType === 'middle-school-high-measure'
      ? '상급학교 진학 및 학생부 관리 측면에서 삭제심의 가능성을 미리 확인할 필요가 있습니다.'
      : caseType === 'low-measure'
        ? '최종 기재 여부는 조치결정서와 생활기록부 기재 지침에 따라 달라질 수 있습니다.'
        : '생활기록부 기재 여부는 최종 조치수위와 학교급에 따라 달라지므로 조치결정서 확인 후 자료 준비 여부를 판단해야 합니다.';
  const schoolLevel = isHighSchool
    ? '고등학교'
    : isMiddleSchool
      ? '중학교'
      : isElementarySchool
        ? '초등학교'
        : '추가 확인 필요';
  const gradeMatch = source.match(/(?:초|중|고)?\s*([1-6])\s*학년|(?:초|중|고)\s*([1-6])/);
  const grade = gradeMatch?.[0].trim() ?? '추가 확인 필요';
  const expectedMeasure = hasHighMeasure
    ? '4호 이상 조치 가능성 또는 결정'
    : hasLowMeasure
      ? '1호~3호 또는 조치없음/학교폭력 아님'
      : '구체적인 조치수위 추가 확인 필요';
  const recordRiskDescription = `입력 내용 기준 생활기록부 기재 가능성은 "${recordRiskLevel}"으로 판단됩니다.`;
  const deleteReviewDescription = `삭제심의 대상 여부는 "${deleteReviewEligibility}"이며, ${deleteReviewTiming}입니다.`;
  const recordImpactFactors = [
    hasHighMeasure ? '4호 이상 조치 키워드가 확인되었습니다.' : null,
    hasLowMeasure ? '1호~3호, 조치없음 또는 학교폭력 아님 키워드가 확인되었습니다.' : null,
    isHighSchool ? '고등학교 재학 또는 대입 영향 우려가 확인되었습니다.' : null,
    isMiddleSchool ? '중학교 재학 정보가 확인되었습니다.' : null,
  ].filter(Boolean) as string[];
  if (recordImpactFactors.length === 0) {
    recordImpactFactors.push('학교급과 최종 조치수위 확인이 필요합니다.');
  }
  const reasoningPoints = [
    hasHighMeasure
      ? '4호 이상 키워드가 확인되어 생활기록부 기재 가능성과 삭제심의 검토 필요성을 함께 판단했습니다.'
      : hasLowMeasure
        ? '1호~3호, 조치없음 또는 학교폭력 아님 키워드가 확인되어 생활기록부 기재 가능성을 낮게 판단했습니다.'
        : '입력 내용만으로 조치수위가 명확하지 않아 조치결정서 확인이 필요합니다.',
    schoolLevel !== '추가 확인 필요'
      ? `학교급은 ${schoolLevel}로 확인되어 해당 학교급 기준으로 삭제심의 시기를 안내했습니다.`
      : '학교급이 명확하지 않아 일반적인 확인 필요 안내를 제공합니다.',
    deleteReviewReason,
  ];
  const inputSummary = [
    `선택/입력한 D06 항목: ${inputContent}`,
    `받은 조치 또는 예상 조치: ${expectedMeasure}`,
    `학교급: ${schoolLevel}`,
    `학년: ${grade}`,
    `사실관계 요약: ${trimmedFactSummary || '입력된 사실관계 요약이 없습니다.'}`,
  ].join('\n');
  let sharedMeasureAssessment = inferSchoolViolenceMeasureLevel(inputContent, trimmedFactSummary, expectedMeasure, reasoningPoints.join('\n'));
  if (hasHighMeasure) {
    sharedMeasureAssessment = upgradeSharedMeasureAssessment(
      sharedMeasureAssessment,
      '4',
      'D06에서 4호 이상 조치 키워드가 확인되어 최소 4호 이상 수준으로 보정했습니다.'
    );
  }

  return {
    diagnosisType: '생활기록부 영향 진단',
    d06StudentRecordV2: true,
    inputContent,
    factSummary: trimmedFactSummary,
    inputDetails: {
      selectedItems: inputContent,
      expectedMeasure,
      schoolLevel,
      grade,
      factSummary: trimmedFactSummary,
    },
    inputSummary,
    reasoningPoints,
    sharedMeasureAssessment,
    recordRiskLevel,
    recordRiskDescription,
    recordImpactFactors,
    deleteReviewNeed: deleteReviewEligibility,
    deleteReviewEligibility,
    deleteReviewTiming,
    deleteReviewReason,
    deleteReviewDescription,
    recommendedMaterials: d06V2RecommendedMaterials,
    nextActions: deleteReviewReason,
    expertOpinion: deleteReviewDescription,
    caution: d06V2Caution,
    nextSteps: deleteReviewReason,
  };
};

const buildD01ReasoningPoints = (
  normalizedContent: string,
  compactContent: string,
  hasHarm: boolean,
  highRiskMatches: string[]
) => {
  const reasoningPoints: string[] = [];

  if (
    hasD01Keyword(normalizedContent, d01ReasoningKeywords.physical) ||
    hasD01Keyword(compactContent, d01ReasoningKeywords.physical)
  ) {
    reasoningPoints.push('폭행 또는 신체적 피해 관련 내용이 확인되어 학교폭력 해당 가능성이 있습니다.');
  }

  if (
    hasD01Keyword(normalizedContent, d01ReasoningKeywords.verbal) ||
    hasD01Keyword(compactContent, d01ReasoningKeywords.verbal)
  ) {
    reasoningPoints.push('욕설, 모욕, 비하 표현 등 언어폭력 요소가 확인됩니다.');
  }

  if (
    hasD01Keyword(normalizedContent, d01ReasoningKeywords.cyber) ||
    hasD01Keyword(compactContent, d01ReasoningKeywords.cyber)
  ) {
    reasoningPoints.push('단톡방, SNS, 메시지 등 사이버폭력 요소가 확인됩니다.');
  }

  if (
    hasD01Keyword(normalizedContent, d01ReasoningKeywords.bullying) ||
    hasD01Keyword(compactContent, d01ReasoningKeywords.bullying)
  ) {
    reasoningPoints.push('반복적인 배제, 놀림, 관계 단절 등 따돌림 요소가 확인됩니다.');
  }

  if (!hasHarm || highRiskMatches.length === 0) {
    reasoningPoints.push('입력내용만으로는 학교폭력 해당성을 단정하기 어려우므로 추가 사실확인이 필요합니다.');
  }

  return reasoningPoints;
};

const calculateSchoolViolenceEligibilityResult = (
  content: string,
  factSummary: string
): SchoolViolenceEligibilityResultSections => {
  const inputContent = content.trim();
  const trimmedFactSummary = factSummary.trim();
  const normalized = inputContent.toLowerCase();
  const compact = normalized.replace(/\s/g, '');
  const highRiskMatches = getMatchedD01Keywords(normalized, d01HighRiskKeywords);
  const lowRiskMatches = getMatchedD01Keywords(normalized, d01LowRiskKeywords);
  const hasStudentContext =
    hasD01Keyword(normalized, d01ContextKeywords.student) ||
    hasD01Keyword(compact, d01ContextKeywords.student);
  const hasSchoolContext =
    hasD01Keyword(normalized, d01ContextKeywords.school) ||
    hasD01Keyword(compact, d01ContextKeywords.school);
  const hasHarm =
    hasD01Keyword(normalized, d01ContextKeywords.harm) ||
    hasD01Keyword(compact, d01ContextKeywords.harm);
  const hasIntent =
    hasD01Keyword(normalized, d01ContextKeywords.intent) ||
    hasD01Keyword(compact, d01ContextKeywords.intent);

  let score = highRiskMatches.length * 2 - lowRiskMatches.length * 2;
  if (hasStudentContext) score += 2;
  if (hasSchoolContext) score += 2;
  if (hasHarm) score += 2;
  if (hasIntent) score += 2;

  const diagnosisResult: SchoolViolenceEligibilityGrade =
    score >= 10
      ? '학교폭력 해당 가능성 높음'
      : score >= 5
        ? '학교폭력 해당 가능성 있음'
        : score >= 1
          ? '학교폭력 해당 가능성 낮음'
          : '단순 갈등 또는 학교폭력 아님 가능성';

  const grounds = [
    hasStudentContext
      ? '학생 간 사건으로 볼 수 있는 표현이 포함되어 있습니다.'
      : '관련 당사자가 학생인지 추가 확인이 필요합니다.',
    hasSchoolContext
      ? '학교 내 또는 학교생활과 관련된 사건으로 볼 수 있는 표현이 있습니다.'
      : '학교 안 사건인지, 등하교·학급·단체방 등 학교생활 관련성이 있는지 확인이 필요합니다.',
    highRiskMatches.length > 0
      ? `학교폭력 유형 또는 피해 정황과 관련될 수 있는 표현이 확인됩니다: ${highRiskMatches.join(', ')}.`
      : '신체폭력, 언어폭력, 사이버폭력, 금품갈취, 강요, 따돌림 등 구체 유형은 아직 뚜렷하지 않습니다.',
    hasHarm
      ? '피해학생의 신체적 또는 정신적 피해를 의심할 수 있는 표현이 있습니다.'
      : '피해학생의 신체적·정신적 피해 정도는 추가 확인이 필요합니다.',
    hasIntent
      ? '고의성, 반복성, 지속성, 집단성 또는 보복성 관련 표현이 포함되어 있습니다.'
      : '고의성, 반복성, 지속성, 집단성, 보복성 여부는 더 확인해야 합니다.',
    lowRiskMatches.length > 0
      ? `다만 해당 가능성을 낮출 수 있는 표현도 함께 확인됩니다: ${lowRiskMatches.join(', ')}.`
      : '단순 장난, 오해, 일회성 다툼, 사과·화해 여부는 별도로 확인하는 것이 좋습니다.',
  ];
  const reasoningPoints = buildD01ReasoningPoints(normalized, compact, hasHarm, highRiskMatches);

  const additionalChecks = [
    '가해학생과 피해학생이 모두 학생인지 확인해 주세요.',
    '사건이 학교 안에서 발생했는지, 또는 등하교·학급·단체방 등 학교생활과 관련되는지 확인해 주세요.',
    '폭행, 욕설, 협박, 모욕, 따돌림, 사이버폭력, 금품요구, 강요 등 구체 유형을 구분해 주세요.',
    '피해학생에게 신체 상처, 병원 진료, 불안·우울, 상담 필요 등 피해가 있었는지 확인해 주세요.',
    '일회성인지, 반복·지속되었는지, 여러 학생이 함께했는지, 보복 목적이 있었는지 확인해 주세요.',
    '서로 말다툼, 오해, 장난, 사과·화해 등 단순 갈등으로 볼 사정이 있는지 함께 확인해 주세요.',
  ];

  return {
    diagnosisType: '학교폭력 해당성 진단',
    schoolViolenceEligibilityV2: true,
    inputContent,
    factSummary: trimmedFactSummary,
    reasoningPoints,
    diagnosisResult,
    grounds: grounds.join('\n'),
    additionalChecks: additionalChecks.join('\n'),
    evidenceMaterials: d01EvidenceMaterials.join('\n'),
    caution:
      '본 결과는 입력내용을 기준으로 한 1차 검토자료이며, 법률적 확정판단은 아닙니다. 실제 판단은 추가 사실관계와 증거자료에 따라 달라질 수 있습니다.',
    nextSteps: d01NextStepsByGrade[diagnosisResult].join('\n'),
  };
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

const calculateD07AdmissionImpactResult = (
  content: string,
  factSummary: string
): D07AdmissionImpactResultSections => {
  const inputContent = content.trim();
  const trimmedFactSummary = factSummary.trim();
  const source = `${inputContent}\n${trimmedFactSummary}`.toLowerCase();
  const hasAny = (keywords: string[]) => keywords.some((keyword) => source.includes(keyword.toLowerCase()));
  const addUnique = (items: string[], item: string) => {
    if (!items.includes(item)) items.push(item);
  };

  const hasMeasure1To3 = hasAny(['1호', '2호', '3호', '서면사과', '접촉금지', '교내봉사']);
  const hasMeasure4OrMore = hasAny([
    '4호',
    '5호',
    '6호',
    '7호',
    '8호',
    '9호',
    '사회봉사',
    '특별교육',
    '출석정지',
    '학급교체',
    '전학',
    '퇴학',
  ]);
  const hasMeasure5OrMore = hasAny(['5호', '6호', '7호', '8호', '9호', '특별교육', '출석정지', '학급교체', '전학', '퇴학']);
  const isHighSchool = hasAny(['고등학교', '고등학생', '고1', '고2', '고3', '고등']);
  const isAdmissionStudent = hasAny(['대입', '입시', '진학', '수시', '정시', '학생부', '종합전형', '교과전형', '대학']);
  const hasSoonAdmission = hasAny(['고2', '고3', '3학년', '2학년', '내년', '올해', '지원 예정', '원서']);
  const hasSusiConcern = hasAny(['수시', '학생부종합', '학종', '학생부교과', '교과전형']);
  const hasJungsiConcern = hasAny(['정시', '수능']);
  const hasRecordConcern = hasAny(['생활기록부', '생기부', '기재', '삭제', '삭제심의']);
  const hasUniversityConcern = hasAny(['모집요강', '대학별', '지원 대학', '지원 예정 대학', '반영 기준', '감점', '지원 제한']);
  const hasAppealConcern = hasAny(['행정심판', '집행정지', '불복', '청구기간', '통보서', '조치결정']);

  let sharedMeasureAssessment = inferSchoolViolenceMeasureLevel(inputContent, trimmedFactSummary);
  const sharedLevel = sharedMeasureAssessment.level;

  let score = 0;
  if (hasMeasure1To3) score += 1;
  if (hasMeasure4OrMore) score += 3;
  if (hasMeasure5OrMore) score += 2;
  if (isHighSchool) score += 2;
  if (isAdmissionStudent) score += 2;
  if (hasSoonAdmission) score += 1;
  if (hasSusiConcern) score += 2;
  if (hasJungsiConcern) score += 1;
  if (hasRecordConcern) score += 2;
  if (hasUniversityConcern) score += 1;
  if (hasAppealConcern) score += 1;

  let admissionImpactLevel: D07AdmissionImpactLevel =
    hasMeasure5OrMore && (isHighSchool || isAdmissionStudent || hasRecordConcern)
      ? '매우 높음'
      : score >= 9
        ? '매우 높음'
        : hasMeasure4OrMore || score >= 6
          ? '높음'
          : score >= 3
            ? '보통'
            : '낮음';

  if (sharedLevel === '7-9') {
    admissionImpactLevel = d07AdmissionImpactLevels.veryHigh;
  } else if (sharedLevel === '5-6') {
    admissionImpactLevel = isHighSchool || isAdmissionStudent
      ? d07AdmissionImpactLevels.veryHigh
      : admissionImpactLevel === d07AdmissionImpactLevels.low
        ? d07AdmissionImpactLevels.high
        : admissionImpactLevel;
  } else if (sharedLevel === '4') {
    admissionImpactLevel =
      admissionImpactLevel === d07AdmissionImpactLevels.low ||
      admissionImpactLevel === d07AdmissionImpactLevels.normal
        ? d07AdmissionImpactLevels.high
        : admissionImpactLevel;
  } else if ((hasMeasure4OrMore || hasMeasure5OrMore) && admissionImpactLevel === d07AdmissionImpactLevels.low) {
    admissionImpactLevel = d07AdmissionImpactLevels.normal;
  }

  const admissionImpactDescriptionMap: Record<D07AdmissionImpactLevel, string> = {
    낮음:
      '현재 입력내용만으로는 대학입시 영향이 크다고 보기는 어렵지만, 최종 조치수위와 대학별 모집요강 확인은 필요합니다.',
    보통:
      '조치수위와 생활기록부 기재 여부에 따라 대입 영향이 달라질 수 있으므로 대학별 반영 기준 확인이 필요합니다.',
    높음:
      '4호 이상 조치가 예상되거나 결정된 경우 생활기록부 기재 및 대학별 학교폭력 조치 반영 여부를 신중히 확인해야 합니다.',
    '매우 높음':
      '5호 이상 조치 또는 중한 조치가 예상되는 경우 수시·정시 전형에서 불이익 가능성을 검토하고, 행정심판·집행정지·삭제심의 가능성도 함께 검토할 필요가 있습니다.',
  };

  const reasoningPoints: string[] = [];
  sharedMeasureAssessment.reasons.forEach((reason) => {
    addUnique(reasoningPoints, `공통 조치수위 추정: ${reason}`);
  });
  addUnique(
    reasoningPoints,
    hasMeasure5OrMore
      ? '5호 특별교육 이상 또는 중한 조치 가능성이 확인되어 대입 영향 검토 필요성이 큽니다.'
      : hasMeasure4OrMore
        ? '4호 이상 조치가 예상되거나 결정된 경우 생활기록부 기재와 대학별 반영 기준 확인이 필요합니다.'
        : hasMeasure1To3
          ? '1호~3호 조치 중심으로 입력되어 상대적으로 중한 조치 가능성은 제한적으로 보입니다.'
          : '받은 조치 또는 예상 조치수위가 명확하지 않아 최종 조치결정 확인이 필요합니다.'
  );
  if (isHighSchool || isAdmissionStudent) {
    addUnique(reasoningPoints, '고등학생 또는 대입 예정 학생으로 보여 입시 반영 가능성을 함께 검토해야 합니다.');
  }
  if (hasSusiConcern || hasJungsiConcern) {
    addUnique(reasoningPoints, '수시·정시 또는 학생부 전형 관련 우려가 있어 전형별 반영 방식을 확인해야 합니다.');
  }
  if (hasRecordConcern) {
    addUnique(reasoningPoints, '생활기록부 기재 또는 삭제심의 관련 우려가 확인되어 기재 여부와 삭제 가능성 검토가 필요합니다.');
  }
  if (hasUniversityConcern) {
    addUnique(reasoningPoints, '지원 예정 대학의 모집요강과 학교폭력 조치 반영 기준 확인이 필요합니다.');
  }
  if (hasAppealConcern || hasMeasure5OrMore) {
    addUnique(reasoningPoints, '조치결정에 불복할 필요가 있는 경우 행정심판 청구기간과 집행정지 필요성을 함께 확인해야 합니다.');
  }

  if (sharedLevel === '5-6' || sharedLevel === '7-9') {
    addUnique(reasoningPoints, '입력내용상 5호 특별교육 또는 6호 출석정지 이상 가능성이 언급되거나 추정되어 대입 영향 가능성을 낮게 보기 어렵습니다.');
  } else if (sharedLevel === '4') {
    addUnique(reasoningPoints, '2주 이상 진료확인서, 반복성, 집단성, 사이버폭력 등 고위험 정황이 함께 확인되어 4호 이상 조치 가능성을 검토할 필요가 있습니다.');
  }

  const admissionImpactFactors: string[] = [];
  if (sharedLevel === '4' || sharedLevel === '5-6' || sharedLevel === '7-9') {
    addUnique(admissionImpactFactors, '4호 이상 조치 가능성');
    addUnique(admissionImpactFactors, '생활기록부 기재 가능성');
    addUnique(admissionImpactFactors, '대학별 학교폭력 조치 반영 기준 확인 필요');
  }
  if (sharedLevel === '5-6' || sharedLevel === '7-9') {
    addUnique(admissionImpactFactors, '5호 특별교육 또는 6호 출석정지 가능성');
    addUnique(admissionImpactFactors, '삭제심의 또는 행정심판 검토 필요');
  }
  if (isHighSchool || isAdmissionStudent) addUnique(admissionImpactFactors, '고등학생 또는 대입 예정 학생');
  if (hasMeasure4OrMore) addUnique(admissionImpactFactors, '4호 이상 조치 가능성');
  if (hasMeasure5OrMore) addUnique(admissionImpactFactors, '5호 특별교육 이상 조치 가능성');
  if (hasRecordConcern || hasMeasure4OrMore) addUnique(admissionImpactFactors, '생활기록부 기재 가능성');
  if (hasSusiConcern || hasAny(['학생부종합', '학종'])) addUnique(admissionImpactFactors, '수시 학생부종합전형 지원 예정');
  if (hasSusiConcern || hasAny(['학생부교과', '교과전형'])) addUnique(admissionImpactFactors, '수시 학생부교과전형 지원 예정');
  addUnique(admissionImpactFactors, '대학별 학교폭력 조치 반영 기준 확인 필요');
  if (hasAppealConcern) addUnique(admissionImpactFactors, '조치결정 이후 불복기간 경과 우려');
  if (hasRecordConcern || hasAppealConcern) addUnique(admissionImpactFactors, '삭제심의 또는 행정심판 검토 필요');
  if (hasAppealConcern || hasMeasure5OrMore) addUnique(admissionImpactFactors, '집행정지 검토 필요');
  if (admissionImpactFactors.length === 1) {
    addUnique(admissionImpactFactors, '최종 조치수위와 생활기록부 기재 여부 확인 필요');
  }

  const universityCheckPoints = [
    '지원 예정 대학의 모집요강에서 학교폭력 조치 반영 여부를 확인해야 합니다.',
    '수시 학생부종합전형, 학생부교과전형, 정시전형별 반영 방식이 다른지 확인해야 합니다.',
    '조치수위별 감점, 지원 제한, 정성평가 반영 여부를 확인해야 합니다.',
    '생활기록부 기재 여부와 삭제심의 가능성을 함께 확인해야 합니다.',
    '조치결정에 불복할 경우 행정심판 청구기간과 집행정지 필요성을 확인해야 합니다.',
  ];

  const recommendedMaterials = [
    '학교폭력 조치결정 통보서',
    '학교폭력대책심의위원회 결과통지서',
    '생활기록부 기재 여부 확인자료',
    '지원 예정 대학 모집요강',
    '수시/정시 지원 예정 전형 자료',
    '학생부종합전형 평가요소 자료',
    '조치 이행 확인자료',
    '반성문',
    '사과 및 화해 노력 자료',
    '피해회복 관련 자료',
    '상담확인서',
    '봉사활동 또는 특별교육 이수자료',
    '삭제심의 신청 관련 자료',
    '행정심판 및 집행정지 검토 자료',
  ];

  const expectedMeasure = sharedLevel !== 'unknown'
    ? sharedMeasureAssessment.label
    : hasMeasure5OrMore
    ? '5호 이상 조치 또는 중한 조치 가능성'
    : hasMeasure4OrMore
      ? '4호 이상 조치 가능성'
      : hasMeasure1To3
        ? '1호~3호 조치 가능성'
        : '입력내용만으로 조치수위 특정 어려움';
  const schoolLevel = isHighSchool ? '고등학생 또는 고등학교 재학으로 보임' : '입력내용만으로 학교급 특정 어려움';
  const grade = hasAny(['고3', '3학년'])
    ? '3학년 또는 대입 임박'
    : hasAny(['고2', '2학년'])
      ? '2학년 또는 대입 준비 단계'
      : hasAny(['고1', '1학년'])
        ? '1학년'
        : '입력내용만으로 학년 특정 어려움';
  const admissionConcern = [
    hasSusiConcern ? '수시/학생부 전형 우려' : null,
    hasJungsiConcern ? '정시 전형 우려' : null,
    hasUniversityConcern ? '대학별 모집요강 확인 필요' : null,
    hasRecordConcern ? '생활기록부 기재 우려' : null,
  ]
    .filter(Boolean)
    .join(', ') || '입력내용만으로 전형 관련 우려 특정 어려움';

  const inputSummary = [
    `선택/입력한 D07 항목: ${inputContent || '입력된 D07 항목이 없습니다.'}`,
    `받은 조치 또는 예상 조치: ${expectedMeasure}`,
    `학교급: ${schoolLevel}`,
    `학년: ${grade}`,
    `지원 예정 전형 또는 대입 우려사항: ${admissionConcern}`,
    `사실관계 요약: ${trimmedFactSummary || '입력한 사실관계 요약이 없습니다.'}`,
  ].join('\n');

  const nextActions = [
    '현재 입력내용을 기준으로 대학입시 영향 가능성과 생활기록부 기재 여부를 함께 검토해야 합니다.',
    '특히 4호 이상 조치가 예상되거나 결정된 경우 지원 예정 대학의 모집요강, 전형별 학교폭력 조치 반영 방식, 조치수위별 감점 또는 정성평가 반영 여부를 확인하는 것이 중요합니다.',
    '조치가 과도하다고 판단되거나 생활기록부 기재로 회복하기 어려운 손해가 예상되는 경우에는 삭제심의, 행정심판, 집행정지 가능성도 함께 검토하는 것이 좋습니다.',
  ].join('\n');

  const expertOpinion = [
    '대학입시 영향은 단순히 학교폭력 신고 여부만으로 결정되는 것이 아니라 최종 조치수위, 생활기록부 기재 여부, 학교급과 학년, 지원 대학의 모집요강, 전형 방식에 따라 달라질 수 있습니다.',
    '특히 4호 이상 조치가 예상되거나 결정된 경우에는 생활기록부 기재 가능성과 대학별 반영 기준을 함께 확인해야 합니다.',
    '따라서 조치결정 통보를 받은 경우에는 불복기간, 삭제심의 가능성, 집행정지 필요성, 지원 예정 대학의 반영 기준을 신속히 확인하는 것이 좋습니다.',
  ].join('\n');

  const caution = [
    '본 결과는 입력내용을 기준으로 한 1차 참고자료이며, 법적 또는 입시상 확정판단은 아닙니다.',
    '대학입시 반영 방식은 대학별 모집요강, 전형 유형, 학년도별 기준에 따라 달라질 수 있습니다.',
    '따라서 지원 예정 대학의 최신 모집요강과 학교폭력 조치 반영 기준을 반드시 별도로 확인해야 합니다.',
  ].join('\n');

  return {
    diagnosisType: '대학입시 영향 진단',
    d07AdmissionImpactV2: true,
    inputContent,
    factSummary: trimmedFactSummary,
    inputDetails: {
      selectedItems: inputContent || '입력된 D07 항목이 없습니다.',
      expectedMeasure,
      schoolLevel,
      grade,
      admissionConcern,
      factSummary: trimmedFactSummary,
    },
    inputSummary,
    reasoningPoints,
    sharedMeasureAssessment,
    admissionImpactLevel,
    admissionImpactDescription: admissionImpactDescriptionMap[admissionImpactLevel],
    admissionImpactFactors,
    universityCheckPoints,
    recommendedMaterials,
    nextActions,
    expertOpinion,
    caution,
    nextSteps: nextActions,
  };
};

export default function DiagnosisInputPage({ params }: { params: { type: string } }) {
  const [content, setContent] = useState('');
  const [d01FactSummary, setD01FactSummary] = useState('');
  const [d03FactSummary, setD03FactSummary] = useState('');
  const [d05FactSummary, setD05FactSummary] = useState('');
  const [d06FactSummary, setD06FactSummary] = useState('');
  const [d07FactSummary, setD07FactSummary] = useState('');
  const [measureOptions, setMeasureOptions] = useState<MeasureOptions>({
    position: 'perpetrator',
    incidentContent: '',
    severityLevel: 'low',
    persistenceLevel: 'low',
    intentionalityLevel: 'low',
    remorseLevel: 'middle',
    reconciliationLevel: 'middle',
    aggravatingItems: [],
    mitigatingItems: [],
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
    factSummary: '',
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
      factSummary: '',
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
  const isD07AdmissionImpact = ['D07', 'admission', 'college-admission'].includes(params.type);
  const isD05Risk = params.type === 'D05';
  const isMeasure = ['measure', 'action-level', 'D04', 'D05'].includes(params.type);
  const isD04Measure = isMeasure && !isD05Risk;
  const isAdminAppeal = ['D08', 'admin-appeal', 'appeal'].includes(params.type);
  const isPrincipalResolution = ['D02', 'school-resolution', 'principal-resolution'].includes(params.type);

  const updateMeasureOption = <K extends keyof MeasureOptions>(key: K, value: MeasureOptions[K]) => {
    setMeasureOptions((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const toggleMeasureArrayOption = (key: 'aggravatingItems' | 'mitigatingItems', value: string) => {
    setMeasureOptions((previous) => ({
      ...previous,
      [key]: toggleSelection(previous[key], value),
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
    if (isD05Risk && !measureOptions.incidentContent.trim()) {
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
    const schoolViolenceEligibilityResult =
      params.type === 'D01' ? calculateSchoolViolenceEligibilityResult(content, d01FactSummary) : null;
    const evidenceCapabilityResult =
      params.type === 'D03' ? calculateEvidenceCapabilityResult(content, d03FactSummary) : null;
    const d06StudentRecordResult =
      params.type === 'D06' ? calculateD06StudentRecordAssessmentResult(content, d06FactSummary) : null;
    const d07AdmissionImpactResult =
      isD07AdmissionImpact ? calculateD07AdmissionImpactResult(content, d07FactSummary) : null;
    const d05RiskResult = isD05Risk ? calculateD05RiskReportResult(measureOptions, d05FactSummary) : null;
    const measureResult = isD04Measure ? calculateMeasureScoreResult(measureOptions) : null;
    const adminAppealResult = isAdminAppeal ? calculateAdminAppealResult(adminAppealOptions) : null;
    const principalResolutionResult = isPrincipalResolution
      ? calculatePrincipalResolutionResult(principalResolutionOptions)
      : null;
    const result = schoolViolenceEligibilityResult
      ? [
          `입력내용:\n${schoolViolenceEligibilityResult.inputContent}`,
          `사실관계 요약:\n${schoolViolenceEligibilityResult.factSummary || '입력된 사실관계 요약이 없습니다.'}`,
          `판단근거:\n${schoolViolenceEligibilityResult.reasoningPoints.join('\n')}`,
          `진단결과: ${schoolViolenceEligibilityResult.diagnosisResult}`,
          `세부 판단근거:\n${schoolViolenceEligibilityResult.grounds}`,
          `추가로 확인할 사항:\n${schoolViolenceEligibilityResult.additionalChecks}`,
          `준비할 증거자료:\n${schoolViolenceEligibilityResult.evidenceMaterials}`,
          `다음 대응방향:\n${schoolViolenceEligibilityResult.nextSteps}`,
          `주의사항:\n${schoolViolenceEligibilityResult.caution}`,
        ].join('\n\n')
      : adminAppealResult
      ? [
          `입력내용:\n${adminAppealResult.inputSummary}`,
          `불복 가능 사유:\n${adminAppealResult.appealGrounds.join('\n')}`,
          `불리한 요소:\n${adminAppealResult.riskFactors.join('\n')}`,
          `판단근거:\n${adminAppealResult.reasoningPoints.join('\n')}`,
          `행정심판 가능성: ${adminAppealResult.appealLevel}`,
          `집행정지 필요성: ${adminAppealResult.stayNeed}\n${adminAppealResult.stayNeedDescription}`,
          `보완자료:\n${adminAppealResult.recommendedMaterials.join('\n')}`,
          `다음 대응방향:\n${adminAppealResult.nextActions}`,
          `전문가 의견:\n${adminAppealResult.expertOpinion}`,
          `주의사항:\n${adminAppealResult.caution}`,
        ].join('\n\n')
      : d05RiskResult
      ? [
          `입력내용:\n${d05RiskResult.inputSummary}`,
          `사실관계 요약:\n${d05RiskResult.factSummary || '입력된 사실관계 요약이 없습니다.'}`,
          `판단근거:\n${d05RiskResult.reasoningPoints?.join('\n') ?? ''}`,
          `진단결과:\n${d05RiskResult.diagnosisResult}`,
          `4호 이상 위험도: ${d05RiskResult.riskLevel}`,
          `예상 조치수위:\n${d05RiskResult.expectedMeasures}`,
          `위험요소:\n${d05RiskResult.riskFactors.join('\n')}`,
          `감경요소:\n${d05RiskResult.mitigatingFactors.join('\n')}`,
          `생활기록부 영향:\n${d05RiskResult.studentRecordImpact}`,
          `권장 준비자료:\n${d05RiskResult.recommendedMaterials.join('\n')}`,
          `다음 대응방향:\n${d05RiskResult.nextActions}`,
          `전문가 의견:\n${d05RiskResult.expertOpinion}`,
          `주의사항:\n${d05RiskResult.caution}`,
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
          `입력내용:\n${principalResolutionResult.inputSummary}`,
          `판단근거:\n${principalResolutionResult.reasoningPoints.join('\n')}`,
          `진단결과:\n${principalResolutionResult.possibility}`,
          `추가로 확인할 사항:\n${principalResolutionResult.additionalChecks}`,
          `준비할 자료:\n${principalResolutionResult.preparationDocuments}`,
          `다음 대응방향:\n${principalResolutionResult.nextSteps}`,
          `전문가 의견:\n${principalResolutionResult.expertOpinion}`,
          `주의사항:\n${principalResolutionResult.caution}`,
        ].join('\n\n')
      : evidenceCapabilityResult
      ? [
          `입력내용:\n선택/입력한 증거자료 종류: ${evidenceCapabilityResult.inputContent}`,
          `사실관계 요약:\n${evidenceCapabilityResult.factSummary || '입력된 사실관계 요약이 없습니다.'}`,
          `판단근거:\n${evidenceCapabilityResult.reasoningPoints.join('\n')}`,
          `진단결과:\n${evidenceCapabilityResult.diagnosisResult}`,
          `부족한 증거자료:\n${evidenceCapabilityResult.missingEvidenceMaterials.join('\n')}`,
          `추가로 확보하면 좋은 자료:\n${evidenceCapabilityResult.additionalEvidenceMaterials}`,
          `다음 대응방향:\n${evidenceCapabilityResult.nextSteps}`,
          `전문가 의견:\n${evidenceCapabilityResult.expertOpinion}`,
          `주의사항:\n${evidenceCapabilityResult.caution}`,
        ].join('\n\n')
      : d06StudentRecordResult
      ? [
          `입력내용:\n${d06StudentRecordResult.inputSummary}`,
          `판단근거:\n${d06StudentRecordResult.reasoningPoints.join('\n')}`,
          `생활기록부 기재 가능성: ${d06StudentRecordResult.recordRiskLevel}\n${d06StudentRecordResult.recordRiskDescription}`,
          `기재 영향 요소:\n${d06StudentRecordResult.recordImpactFactors.join('\n')}`,
          `삭제심의 검토 필요성: ${d06StudentRecordResult.deleteReviewNeed}\n${d06StudentRecordResult.deleteReviewDescription}`,
          `보완자료:\n${d06StudentRecordResult.recommendedMaterials.join('\n')}`,
          `다음 대응방향:\n${d06StudentRecordResult.nextActions}`,
          `전문가 의견:\n${d06StudentRecordResult.expertOpinion}`,
          `주의사항:\n${d06StudentRecordResult.caution}`,
        ].join('\n\n')
      : d07AdmissionImpactResult
      ? [
          `입력내용:\n${d07AdmissionImpactResult.inputSummary}`,
          `판단근거:\n${d07AdmissionImpactResult.reasoningPoints.join('\n')}`,
          `대입 영향 가능성: ${d07AdmissionImpactResult.admissionImpactLevel}\n${d07AdmissionImpactResult.admissionImpactDescription}`,
          `대입 영향 요소:\n${d07AdmissionImpactResult.admissionImpactFactors.join('\n')}`,
          `대학별 확인 필요사항:\n${d07AdmissionImpactResult.universityCheckPoints.join('\n')}`,
          `보완자료:\n${d07AdmissionImpactResult.recommendedMaterials.join('\n')}`,
          `다음 대응방향:\n${d07AdmissionImpactResult.nextActions}`,
          `전문가 의견:\n${d07AdmissionImpactResult.expertOpinion}`,
          `주의사항:\n${d07AdmissionImpactResult.caution}`,
        ].join('\n\n')
      : buildResult(params.type, content);
    const savedContent = schoolViolenceEligibilityResult
      ? [
          schoolViolenceEligibilityResult.inputContent,
          schoolViolenceEligibilityResult.factSummary
            ? `사실관계 요약: ${schoolViolenceEligibilityResult.factSummary}`
            : null,
        ].filter(Boolean).join('\n\n')
      : adminAppealResult
      ? [
          adminAppealResult.inputSummary,
        ].join('\n')
      : measureResult
        ? measureResult.inputSummary
        : d05RiskResult
          ? d05RiskResult.inputSummary
        : principalResolutionResult
          ? principalResolutionResult.inputSummary
        : evidenceCapabilityResult
          ? [
              `선택/입력한 증거자료 종류: ${evidenceCapabilityResult.inputContent}`,
              `사실관계 요약: ${evidenceCapabilityResult.factSummary || '입력된 사실관계 요약이 없습니다.'}`,
            ].join('\n')
        : d06StudentRecordResult
          ? d06StudentRecordResult.inputSummary
        : d07AdmissionImpactResult
          ? d07AdmissionImpactResult.inputSummary
        : content;

    const savedDiagnosisResult = {
        type: adminAppealResult
          ? adminAppealResult.diagnosisType
          : schoolViolenceEligibilityResult
            ? schoolViolenceEligibilityResult.diagnosisType
            : evidenceCapabilityResult
              ? evidenceCapabilityResult.diagnosisType
            : d06StudentRecordResult
              ? d06StudentRecordResult.diagnosisType
            : d07AdmissionImpactResult
              ? d07AdmissionImpactResult.diagnosisType
            : d05RiskResult
              ? d05RiskResult.diagnosisType
            : measureResult
              ? measureResult.diagnosisType
              : principalResolutionResult
                ? principalResolutionResult.diagnosisType
                : params.type,
        resultType: d07AdmissionImpactResult ? 'D07' : params.type,
        diagnosisCode: d07AdmissionImpactResult ? 'D07' : params.type,
        content: savedContent,
        result,
        resultSections:
          schoolViolenceEligibilityResult ??
          adminAppealResult ??
          d05RiskResult ??
          measureResult ??
          principalResolutionResult ??
          evidenceCapabilityResult ??
          d06StudentRecordResult ??
          d07AdmissionImpactResult,
      };

    sessionStorage.setItem(storageKey, JSON.stringify(savedDiagnosisResult));

    router.push(`/diagnosis/result/${resultId}`);
  };

  return (
    <div className="card">
      <h1 className="mb-6 text-2xl font-black">
        무료진단 입력 - {isPrincipalResolution ? '학교장 자체해결 V2' : isD05Risk ? '4호 이상 위험도 진단' : isMeasure ? '조치수위 예측 V2' : isAdminAppeal ? '행정심판 가능성 V2' : params.type}
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

          <section>
            <label className="mb-2 block font-bold">사실관계 요약 (선택입력)</label>
            <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              ※ 사건의 발생경위, 피해 정도, 화해 여부, 피해학생 측 의사를 간략히 입력해 주세요.
              {'\n'}※ 입력하지 않아도 진단은 가능합니다.
              {'\n'}※ 입력한 내용은 진단 결과 및 PDF 보고서에 함께 표시됩니다.
            </p>
            <textarea
              className="h-36 w-full rounded-xl border p-3"
              placeholder={`예)
• 피해학생이 2주 이상 진단서를 제출하지 않았습니다.
• 재산피해는 없고, 가해학생이 사과했습니다.
• 피해학생 측은 심의위원회 개최를 원하지 않는다고 했습니다.`}
              value={principalResolutionOptions.factSummary}
              onChange={(event) => updatePrincipalResolutionOption('factSummary', event.target.value)}
            />
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

          <section>
            <label className="mb-2 block text-lg font-black" htmlFor="d08-fact-summary">
              사실관계 요약 (선택입력)
            </label>
            <p className="mb-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              ※ 처분내용, 심의 절차, 억울한 점, 증거 부족, 처분이 과하다고 생각하는 이유를 간략히 입력해 주세요.
              {'\n'}※ 입력하지 않아도 진단은 가능합니다.
              {'\n'}※ 입력한 내용은 진단 결과 및 PDF 보고서에 함께 표시됩니다.
            </p>
            <textarea
              id="d08-fact-summary"
              className="min-h-40 w-full rounded-xl border p-3"
              placeholder={`예)
• 5호 특별교육 처분을 받았지만, 피해학생 진술 외 객관적 증거가 부족합니다.
• 심의위원회에서 제출한 의견서가 충분히 검토되지 않은 것 같습니다.
• 1회성 사안인데 4호 이상의 조치가 내려져 처분이 과하다고 생각합니다.`}
              value={adminAppealOptions.factSummary}
              onChange={(event) => updateAdminAppealOption('factSummary', event.target.value)}
            />
          </section>
        </div>
      ) : isD04Measure ? (
        <div className="space-y-6">
          <section className="rounded-xl border bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              학교폭력대책심의위원회는 심각성, 지속성, 고의성, 반성 정도, 화해 정도 등을 종합적으로 고려하여 가해학생 조치를 결정합니다. 아래 항목을 선택하면 예상 조치수위를 참고용으로 확인할 수 있습니다.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">판단요소 점수표</h2>
            {[
              ['심각성', 'severityLevel'],
              ['지속성', 'persistenceLevel'],
              ['고의성', 'intentionalityLevel'],
              ['반성정도', 'remorseLevel'],
              ['화해정도', 'reconciliationLevel'],
            ].map(([label, key]) => (
              <fieldset key={key} className="rounded-xl border p-4">
                <legend className="px-1 font-bold">{label}</legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {measureScoreOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 rounded-xl border px-3 py-2">
                      <input
                        type="radio"
                        name={key}
                        checked={measureOptions[key as keyof MeasureOptions] === option.value}
                        onChange={() => updateMeasureOption(key as keyof MeasureOptions, option.value as never)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </section>

          <section>
            <label className="mb-2 block font-bold">사실관계 요약 (선택입력)</label>
            <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              ※ 사건의 발생경위, 장소, 횟수, 주요 내용을 간략히 입력해 주세요.
              {'\n'}※ 입력하지 않아도 진단은 가능합니다.
              {'\n'}※ 입력한 내용은 진단 결과 및 PDF 보고서에 함께 표시됩니다.
            </p>
            <textarea
              className="h-36 w-full rounded-xl border p-3"
              placeholder={`예)
• 체육시간 중 친구를 1회 밀쳤습니다.
• 단톡방에서 욕설이 3일간 계속되었습니다.
• 쉬는 시간에 별명을 반복적으로 불렀습니다.`}
              value={measureOptions.incidentContent}
              onChange={(event) => updateMeasureOption('incidentContent', event.target.value)}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">가중요소</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {measureAggravatingOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={measureOptions.aggravatingItems.includes(option)}
                    onChange={() => toggleMeasureArrayOption('aggravatingItems', option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black">감경요소</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {measureMitigatingOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={measureOptions.mitigatingItems.includes(option)}
                    onChange={() => toggleMeasureArrayOption('mitigatingItems', option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </section>
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
          {isD05Risk ? (
            <section>
              <label className="mb-2 block font-bold">사실관계 요약 (선택입력)</label>
              <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {'- 4호 이상 조치와 관련될 수 있는 반복성, 상해 정도, 보복행위, 다수 가담, 반성·화해 여부를 간략히 입력해 주세요.'}
                {'\n- 입력하지 않아도 진단은 가능합니다.'}
                {'\n- 입력한 내용은 진단 결과 및 PDF 보고서에 함께 표시됩니다.'}
              </p>
              <textarea
                className="h-36 w-full rounded-xl border p-3"
                placeholder={`예)
피해학생은 병원 진료를 받았고 욕설과 괴롭힘이 2주 이상 반복되었습니다.
여러 학생이 단체방에서 피해학생을 조롱했고, 사과는 아직 이루어지지 않았습니다.
1회성 실수였고 가해학생이 사과했으며 피해학생 측과 화해를 시도하고 있습니다.`}
                value={d05FactSummary}
                onChange={(event) => setD05FactSummary(event.target.value)}
              />
            </section>
          ) : null}
        </div>
      ) : params.type === 'D03' ? (
        <div className="space-y-5">
          <textarea
            className="h-60 w-full rounded-xl border p-3"
            placeholder="확보했거나 준비 중인 증거자료 종류를 입력해 주세요. 예: 카카오톡 캡처, 사진, 녹음파일, 병원 진단서, 위클래스 상담확인서, 목격학생 진술서"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <section>
            <label className="mb-2 block font-bold">사실관계 요약 (선택입력)</label>
            <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              ※ 현재 확보한 증거자료, 증거가 필요한 이유, 부족하다고 느끼는 부분을 간략히 입력해 주세요.
              {'\n'}※ 입력하지 않아도 진단은 가능합니다.
              {'\n'}※ 입력한 내용은 진단 결과 및 PDF 보고서에 함께 표시됩니다.
            </p>
            <textarea
              className="h-36 w-full rounded-xl border p-3"
              placeholder={`예)
• 카카오톡 캡처와 목격학생 진술은 있으나 병원 진단서는 없습니다.
• 단톡방 욕설 캡처는 있지만 상대 학생이 삭제했다고 주장합니다.
• 피해학생이 위클래스 상담을 받았고 상담확인서를 준비 중입니다.`}
              value={d03FactSummary}
              onChange={(event) => setD03FactSummary(event.target.value)}
            />
          </section>
        </div>
      ) : params.type === 'D01' ? (
        <div className="space-y-5">
          <textarea
            className="h-60 w-full rounded-xl border p-3"
            placeholder="사건 발생일, 장소, 관련 학생, 구체적인 내용, 증거자료를 입력해 주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <section>
            <label className="mb-2 block font-bold">사실관계 요약 (선택입력)</label>
            <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              ※ 사건의 발생경위, 장소, 행위내용, 피해내용을 간략히 입력해 주세요.
              {'\n'}※ 입력하지 않아도 진단은 가능합니다.
              {'\n'}※ 입력한 내용은 진단 결과 및 PDF 보고서에 함께 표시됩니다.
            </p>
            <textarea
              className="h-36 w-full rounded-xl border p-3"
              placeholder={`예)
• 같은 반 학생이 지속적으로 욕설을 했습니다.
• 쉬는 시간마다 별명을 부르며 놀렸습니다.
• 단톡방에서 모욕적인 말을 했습니다.`}
              value={d01FactSummary}
              onChange={(event) => setD01FactSummary(event.target.value)}
            />
          </section>
        </div>
      ) : isD07AdmissionImpact ? (
        <div className="space-y-5">
          <textarea
            className="h-60 w-full rounded-xl border p-3"
            placeholder="받은 조치 또는 예상 조치, 학교급, 학년, 지원 예정 대학·전형, 대입 영향 우려사항을 입력해 주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <section>
            <label className="mb-2 block font-bold">사실관계 요약 (선택입력)</label>
            <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {'※ 받은 조치, 학년, 지원 예정 대학·전형, 대입 영향 우려사항을 간략히 입력해 주세요.'}
              {'\n※ 입력하지 않아도 진단은 가능합니다.'}
              {'\n※ 입력한 내용은 진단 결과 및 PDF 보고서에 함께 표시됩니다.'}
            </p>
            <textarea
              className="h-36 w-full rounded-xl border p-3"
              placeholder={`예)
• 고등학교 2학년이고 5호 특별교육 조치를 받을 가능성이 있습니다.
• 수시 학생부종합전형 지원 예정이라 학교폭력 조치 반영 여부가 걱정됩니다.
• 4호 이상 조치가 생활기록부에 기재될 경우 대입 감점 여부를 확인하고 싶습니다.`}
              value={d07FactSummary}
              onChange={(event) => setD07FactSummary(event.target.value)}
            />
          </section>
        </div>
      ) : params.type === 'D06' ? (
        <div className="space-y-5">
          <textarea
            className="h-60 w-full rounded-xl border p-3"
            placeholder="받은 조치 또는 예상 조치, 학교급, 학년, 생활기록부 기재 우려를 입력해 주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <section>
            <label className="mb-2 block font-bold">사실관계 요약 (선택입력)</label>
            <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {'※ 받은 조치 또는 예상 조치, 학교급, 학년, 생활기록부 기재 우려를 간략히 입력해 주세요.'}
              {'\n※ 입력하지 않아도 진단은 가능합니다.'}
              {'\n※ 입력한 내용은 진단 결과 및 PDF 보고서에 함께 표시됩니다.'}
            </p>
            <textarea
              className="h-36 w-full rounded-xl border p-3"
              placeholder={`예)
• 고등학교 2학년이고 5호 특별교육 조치를 받았습니다.
• 생활기록부 기재 여부와 대입 영향이 걱정됩니다.
• 6호 출석정지 가능성이 있어 학생부 기재 여부를 확인하고 싶습니다.`}
              value={d06FactSummary}
              onChange={(event) => setD06FactSummary(event.target.value)}
            />
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
