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

const notice =
  '본 결과는 입력 내용을 기준으로 한 1차 검토자료이며, 실제 판단은 학교의 조사 및 심의 결과에 따라 달라질 수 있습니다.';

const measureNotice =
  '이 결과는 학교폭력예방법 제17조, 같은 법 시행령 제19조 및 가해학생 조치별 적용 세부기준의 판단요소를 참고한 1차 검토자료이며, 실제 조치는 교육지원청 학교폭력대책심의위원회의 판단에 따라 달라질 수 있습니다.';

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
  let expectedMeasure = '낮음: 1~3호 조치 가능성';

  if (highRiskFlags || totalScore >= 17) {
    expectedMeasure = '높음: 6~9호 조치 가능성';
  } else if (
    totalScore >= 11 ||
    (options.physicalViolence && options.damageLevel === 'severe') ||
    (options.physicalViolence && options.frequency === 'repeated' && options.intentional)
  ) {
    expectedMeasure = '보통 이상: 4~5호 조치 가능성';
  } else if (totalScore >= 6 || (options.verbalViolence && persistenceScore >= 3 && !options.apology)) {
    expectedMeasure = '보통: 2~4호 조치 가능성';
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
    expectedMeasure = '낮음: 1~3호 조치 가능성';
  }

  reasons.push(`심각성 ${seriousnessScore}점, 지속성 ${persistenceScore}점, 고의성 ${intentionalityScore}점으로 1차 산정했습니다.`);
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
  ].join('\n');

  const inputSummary = [
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
  ].join('\n');

  return {
    diagnosisType: '조치수위 예측 V2',
    inputSummary,
    factorAnalysis,
    expectedMeasure,
    reasons: reasons.join('\n'),
    mitigatingFactors: joinLines(mitigatingFactors, '뚜렷한 감경 요소가 입력되지 않았습니다.'),
    aggravatingFactors: joinLines(aggravatingFactors, '중대한 가중 위험 요소는 제한적으로 입력되었습니다.'),
    caution: cautions.join('\n'),
    nextSteps:
      '사건 일시, 장소, 관련 학생, 피해 상태, 증거자료 목록을 시간순으로 정리한 뒤 상담예약을 통해 실제 대응방향을 점검해 주세요.\n4호 이상 조치 가능성이 있는 경우 생활기록부, 진학, 행정심판 가능성까지 함께 검토가 필요합니다.',
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
  });
  const router = useRouter();
  const isMeasure = ['measure', 'action-level', 'D04'].includes(params.type);

  const updateMeasureOption = <K extends keyof MeasureOptions>(key: K, value: MeasureOptions[K]) => {
    setMeasureOptions((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleDiagnosis = () => {
    if (isMeasure && !measureOptions.incidentContent.trim()) {
      alert('사건 내용을 입력해 주세요.');
      return;
    }

    if (!isMeasure && !content.trim()) {
      alert('사건 내용을 입력해 주세요.');
      return;
    }

    const resultId = Date.now().toString();
    const storageKey = `${DIAGNOSIS_STORAGE_KEY_PREFIX}:${resultId}`;
    const measureResult = isMeasure ? calculateMeasureResult(measureOptions) : null;
    const result = measureResult
      ? [
          `예상 조치수위: ${measureResult.expectedMeasure}`,
          `심의 판단요소 분석: ${measureResult.factorAnalysis}`,
          `판단 이유: ${measureResult.reasons}`,
          `감경 가능 요소: ${measureResult.mitigatingFactors}`,
          `가중 위험 요소: ${measureResult.aggravatingFactors}`,
          `주의사항: ${measureResult.caution}`,
          `다음 대응방향: ${measureResult.nextSteps}`,
        ].join('\n\n')
      : buildResult(params.type, content);
    const savedContent = measureResult ? measureResult.inputSummary : content;

    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        type: measureResult ? measureResult.diagnosisType : params.type,
        content: savedContent,
        result,
        resultSections: measureResult,
      })
    );

    router.push(`/diagnosis/result/${resultId}`);
  };

  return (
    <div className="card">
      <h1 className="mb-6 text-2xl font-black">
        무료진단 입력 - {isMeasure ? '조치수위 예측 V2' : params.type}
      </h1>

      {isMeasure ? (
        <div className="space-y-5">
          <section className="space-y-4">
            <h2 className="text-lg font-black">기본 사실관계</h2>
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
