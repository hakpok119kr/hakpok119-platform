'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const DIAGNOSIS_STORAGE_KEY_PREFIX = 'diagnosis-result';

type SharedMeasureAssessment = {
  level: string;
  label: string;
  reasons: string[];
};

type DiagnosisResult = {
  type: string;
  resultType?: string;
  diagnosisCode?: string;
  content: string;
  result: string;
  resultSections?: {
    diagnosisType: string;
    adminAppealV2?: boolean;
    principalResolutionV2?: boolean;
    schoolViolenceEligibilityV2?: boolean;
    evidenceCapabilityV2?: boolean;
    d07AdmissionImpactV2?: boolean;
    d06StudentRecordV2?: boolean;
    d05RiskV2?: boolean;
    measureScoreV2?: boolean;
    inputDetails?: {
      severity?: string;
      persistence?: string;
      intentionality?: string;
      remorse?: string;
      reconciliation?: string;
      caseSummary?: string;
      incidentContent?: string;
      diagnosisStatus?: string;
      propertyDamageStatus?: string;
      continuityStatus?: string;
      retaliationStatus?: string;
      committeeIntent?: string;
      factSummary?: string;
      evidenceTypes?: string;
      selectedItems?: string;
      currentPosition?: string;
      reviewStatus?: string;
      noticeDate?: string;
      offenderMeasures?: string;
      victimMeasures?: string;
      objectionReasons?: string;
      procedureIssues?: string;
      evidenceIssues?: string;
      proportionalityIssues?: string;
      urgency?: string;
      expectedMeasure?: string;
      schoolLevel?: string;
      grade?: string;
      admissionConcern?: string;
    };
    reasoningPoints?: string[];
    sharedMeasureAssessment?: SharedMeasureAssessment;
    appealGrounds?: string[];
    inputContent?: string;
    factSummary?: string;
    diagnosisResult?: string;
    riskLevel?: string;
    grounds?: string;
    additionalChecks?: string;
    evidenceMaterials?: string;
    inputSummary?: string;
    possibility?: string;
    legalRequirements?: string;
    relationshipRecovery?: string;
    riskFactors?: string | string[];
    expertOpinion?: string;
    schoolRecordPossibility?: string;
    admissionImpactPossibility?: string;
    admissionImpactLevel?: string;
    admissionImpactDescription?: string;
    admissionImpactFactors?: string[];
    universityCheckPoints?: string[];
    recordRiskLevel?: string;
    recordRiskDescription?: string;
    recordImpactFactors?: string[];
    deleteReviewNeed?: string;
    deleteReviewEligibility?: string;
    deleteReviewTiming?: string;
    deleteReviewReason?: string;
    deleteReviewDescription?: string;
    expectedMeasures?: string;
    studentRecordImpact?: string;
    recommendedMaterials?: string[];
    nextActions?: string;
    factorAnalysis?: string;
    baseScore?: string;
    aggravatingItems?: string;
    mitigatingItems?: string;
    finalScore?: string;
    expectedMeasure?: string;
    reasons?: string;
    comprehensiveOpinion?: string;
    mitigatingFactors?: string | string[];
    aggravatingFactors?: string;
    currentPosition?: string;
    reviewStatus?: string;
    decisionSummary?: string;
    filingPeriodReview?: string;
    appealLevel?: string;
    stayNeed?: string;
    stayNeedDescription?: string;
    appealNeed?: string;
    objectionReasons?: string;
    procedureIssues?: string;
    evidenceIssues?: string;
    proportionalityIssues?: string;
    preparationDocuments?: string;
    missingEvidenceMaterials?: string[];
    additionalEvidenceMaterials?: string;
    caution: string;
    nextSteps: string;
  };
};

type DiagnosisCode = 'D01' | 'D02' | 'D03' | 'D04' | 'D05' | 'D06' | 'D07' | 'D08' | 'UNKNOWN';

type ResultViewModel = {
  code: DiagnosisCode;
  diagnosisType: string;
  coreLabel: string;
  coreValue: string;
  coreDescription?: string;
  aiOpinion: string[];
  grounds: string[];
  materials: string[];
  nextActions: string[];
  caution: string;
};

const splitResultLines = (value?: string | null) =>
  value
    ?.split('\n')
    .map((line) => line.trim())
    .filter(Boolean) ?? [];

const asResultItems = (value?: string | string[] | null) =>
  Array.isArray(value) ? value.filter(Boolean) : splitResultLines(value);

const uniqueItems = (items: Array<string | string[] | undefined | null>) => {
  const seen = new Set<string>();

  return items
    .flatMap((item) => asResultItems(item))
    .map((item) => item.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
};

const getSectionText = (result: string, title: string) => {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedTitle}:?\\n([\\s\\S]*?)(?=\\n\\n[^\\n]+:?\\n|$)`);

  return result.match(pattern)?.[1]?.trim() ?? '';
};

const getDiagnosisCode = (diagnosis: DiagnosisResult): DiagnosisCode => {
  const sections = diagnosis.resultSections;
  const identityText = [diagnosis.type, diagnosis.resultType, diagnosis.diagnosisCode, sections?.diagnosisType]
    .filter(Boolean)
    .join(' ');

  if (sections?.schoolViolenceEligibilityV2 || identityText.includes('D01')) return 'D01';
  if (sections?.principalResolutionV2 || identityText.includes('D02')) return 'D02';
  if (sections?.adminAppealV2 || identityText.includes('D03')) return 'D03';
  if (sections?.measureScoreV2 || identityText.includes('D04')) return 'D04';
  if (sections?.d05RiskV2 || identityText.includes('D05')) return 'D05';
  if (sections?.d06StudentRecordV2 || identityText.includes('D06')) return 'D06';
  if (sections?.d07AdmissionImpactV2 || identityText.includes('D07')) return 'D07';
  if (sections?.evidenceCapabilityV2 || identityText.includes('D08')) return 'D08';

  return 'UNKNOWN';
};

const getFallbackD07Sections = (diagnosis: DiagnosisResult) => {
  const admissionImpactText = getSectionText(diagnosis.result, '대입영향 가능성');
  const [level, ...descriptionLines] = splitResultLines(admissionImpactText);

  return {
    diagnosisType: '대입영향 진단',
    factSummary: '',
    reasoningPoints: splitResultLines(getSectionText(diagnosis.result, '판단근거')),
    admissionImpactLevel: level,
    admissionImpactDescription: descriptionLines.join('\n'),
    admissionImpactFactors: splitResultLines(getSectionText(diagnosis.result, '대입영향 요소')),
    universityCheckPoints: splitResultLines(getSectionText(diagnosis.result, '대학별 확인 필요사항')),
    recommendedMaterials: splitResultLines(getSectionText(diagnosis.result, '보완자료')),
    nextActions: getSectionText(diagnosis.result, '다음 대응방향'),
    expertOpinion: getSectionText(diagnosis.result, '전문가 의견'),
    caution: getSectionText(diagnosis.result, '주의사항') || diagnosis.result,
    nextSteps: getSectionText(diagnosis.result, '다음 대응방향'),
  };
};

const conciseActions = (items: string[]) =>
  items
    .flatMap((item) => item.split(/[.。]\s*/))
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

const getDefaultMaterials = (code: DiagnosisCode) => {
  const common = ['사건 일시와 장소 정리', '관련 대화, 사진, 영상 등 객관자료', '목격자 또는 관계자 진술'];

  if (code === 'D03') return ['처분 통지서', '심의 관련 자료', '불복 사유 정리서', '증거자료 목록'];
  if (code === 'D06') return ['조치 결정 통지서', '생활기록부 기재 여부 자료', '졸업 전 삭제심의 준비자료'];
  if (code === 'D07') return ['조치 내용 확인자료', '지원 대학 모집요강', '입시 반영 여부 확인자료'];
  if (code === 'D08') return ['원본 증거자료', '증거 확보 경위', '추가 확인이 필요한 자료 목록'];

  return common;
};

const buildAiOpinion = (code: DiagnosisCode, coreValue: string, description?: string) => {
  const core = coreValue || '추가 확인 필요';
  const detail = description ? `현재 자료상 ${description}` : '입력된 사실관계와 선택 항목을 기준으로 1차 검토했습니다.';

  const opinionByCode: Record<DiagnosisCode, string[]> = {
    D01: [
      `학교폭력 해당 가능성은 "${core}"로 정리됩니다.`,
      detail,
      '사건의 반복성, 고의성, 피해 정도와 객관자료가 최종 판단에 중요합니다.',
      '신고 또는 상담 전 사실관계와 증거를 시간순으로 정리하는 것이 좋습니다.',
    ],
    D02: [
      `학교장 자체해결 가능성은 "${core}"로 보입니다.`,
      detail,
      '피해 회복, 지속성 여부, 보복성 여부가 자체해결 판단의 핵심입니다.',
      '자체해결이 어렵다면 학폭위 절차와 보호조치를 함께 검토해야 합니다.',
    ],
    D03: [
      `행정심판 또는 불복 필요성은 "${core}" 수준으로 정리됩니다.`,
      detail,
      '절차 하자, 사실오인, 처분 비례성, 집행정지 필요성을 분리해 검토해야 합니다.',
      '불복 기간이 짧을 수 있으므로 처분 통지일과 자료 확보 현황을 먼저 확인하세요.',
    ],
    D04: [
      `예상 조치수위는 "${core}"로 산정됩니다.`,
      detail,
      '사안의 심각성, 지속성, 고의성, 반성 및 화해 여부가 조치수위에 직접 영향을 줍니다.',
      '감경 사유와 가중 사유를 구분해 심의자료를 준비하는 것이 중요합니다.',
    ],
    D05: [
      `4호 이상 위험도는 "${core}"로 평가됩니다.`,
      detail,
      '위험요소가 생활기록부 기재와 후속 절차에 이어질 수 있는지 함께 살펴야 합니다.',
      '불리한 요소와 방어자료를 나누어 정리하면 대응 방향이 선명해집니다.',
    ],
    D06: [
      `생활기록부 기재 가능성은 "${core}"로 보입니다.`,
      detail,
      '조치 종류, 학교급, 학년, 삭제심의 가능 시점이 함께 검토되어야 합니다.',
      '기재 자체뿐 아니라 졸업 전 삭제심의 준비 여부까지 미리 확인하는 것이 좋습니다.',
    ],
    D07: [
      `대입 영향 가능성은 "${core}"로 정리됩니다.`,
      detail,
      '지원 전형과 대학별 반영 기준에 따라 실제 영향은 달라질 수 있습니다.',
      '모집요강과 학생부 반영 항목을 대학별로 확인하는 절차가 필요합니다.',
    ],
    D08: [
      `증거능력 1차 진단 결과는 "${core}"입니다.`,
      detail,
      '증거의 원본성, 취득 경위, 내용의 구체성, 사실관계와의 연결성이 핵심입니다.',
      '부족한 자료는 추가 확보 가능성과 제출 방식까지 함께 검토해야 합니다.',
    ],
    UNKNOWN: [
      `핵심 결과는 "${core}"로 정리됩니다.`,
      detail,
      '이 결과는 입력 자료를 바탕으로 한 1차 진단입니다.',
      '구체적인 절차 진행 전 자료와 일정 확인이 필요합니다.',
    ],
  };

  return opinionByCode[code];
};

const buildViewModel = (diagnosis: DiagnosisResult): ResultViewModel => {
  const sections = diagnosis.resultSections;
  const code = getDiagnosisCode(diagnosis);
  const fallbackD07 = code === 'D07' && !sections?.d07AdmissionImpactV2 ? getFallbackD07Sections(diagnosis) : null;
  const diagnosisType = sections?.diagnosisType ?? fallbackD07?.diagnosisType ?? diagnosis.type;

  let coreLabel = '핵심 진단결과';
  let coreValue = diagnosis.result;
  let coreDescription: string | undefined;
  let grounds: string[] = [];
  let materials: string[] = [];
  let nextActions: string[] = [];

  if (sections?.schoolViolenceEligibilityV2) {
    coreLabel = '학교폭력 해당 가능성';
    coreValue = sections.diagnosisResult ?? diagnosis.result;
    coreDescription = sections.grounds;
    grounds = uniqueItems([sections.grounds, ...(sections.reasoningPoints ?? [])]);
    materials = uniqueItems([sections.evidenceMaterials, sections.additionalChecks]);
    nextActions = uniqueItems([sections.nextSteps]);
  } else if (sections?.principalResolutionV2) {
    coreLabel = '학교장 자체해결 가능성';
    coreValue = sections.possibility ?? diagnosis.result;
    coreDescription = sections.legalRequirements || sections.relationshipRecovery;
    grounds = uniqueItems([sections.legalRequirements, sections.relationshipRecovery, ...(sections.reasoningPoints ?? [])]);
    materials = uniqueItems([sections.preparationDocuments, sections.additionalChecks]);
    nextActions = uniqueItems([sections.nextSteps]);
  } else if (sections?.adminAppealV2) {
    coreLabel = '행정심판 필요성';
    coreValue = sections.appealLevel ?? sections.appealNeed ?? diagnosis.result;
    coreDescription = sections.stayNeed ? `집행정지 필요성: ${sections.stayNeed}` : sections.stayNeedDescription;
    grounds = uniqueItems([
      ...(sections.appealGrounds ?? []),
      ...(asResultItems(sections.riskFactors)),
      ...(sections.reasoningPoints ?? []),
    ]);
    materials = uniqueItems([...(sections.recommendedMaterials ?? []), sections.preparationDocuments]);
    nextActions = uniqueItems([sections.nextActions, sections.nextSteps]);
  } else if (sections?.measureScoreV2) {
    coreLabel = '예상 조치수위';
    coreValue = sections.expectedMeasure ?? diagnosis.result;
    coreDescription = sections.finalScore ? `최종점수: ${sections.finalScore}` : sections.comprehensiveOpinion;
    grounds = uniqueItems([
      sections.baseScore,
      sections.aggravatingItems,
      sections.mitigatingItems,
      sections.reasons,
      ...(sections.reasoningPoints ?? []),
    ]);
    materials = getDefaultMaterials(code);
    nextActions = uniqueItems([sections.nextSteps, sections.comprehensiveOpinion]);
  } else if (sections?.d05RiskV2) {
    coreLabel = '4호 이상 위험도';
    coreValue = sections.riskLevel ?? sections.diagnosisResult ?? diagnosis.result;
    coreDescription = sections.studentRecordImpact ?? sections.schoolRecordPossibility;
    grounds = uniqueItems([
      ...(asResultItems(sections.riskFactors)),
      ...(asResultItems(sections.mitigatingFactors)),
      ...(sections.reasoningPoints ?? []),
    ]);
    materials = uniqueItems([...(sections.recommendedMaterials ?? []), sections.additionalChecks]);
    nextActions = uniqueItems([sections.nextActions, sections.nextSteps]);
  } else if (sections?.d06StudentRecordV2) {
    coreLabel = '생활기록부 기재 가능성';
    coreValue = sections.recordRiskLevel ?? diagnosis.result;
    coreDescription = sections.recordRiskDescription;
    grounds = uniqueItems([
      ...(sections.recordImpactFactors ?? []),
      sections.deleteReviewEligibility,
      sections.deleteReviewTiming,
      sections.deleteReviewReason,
      ...(sections.reasoningPoints ?? []),
    ]);
    materials = uniqueItems([...(sections.recommendedMaterials ?? []), sections.preparationDocuments]);
    nextActions = uniqueItems([sections.nextActions, sections.nextSteps, sections.deleteReviewDescription]);
  } else if (sections?.d07AdmissionImpactV2 || fallbackD07) {
    const d07 = sections?.d07AdmissionImpactV2 ? sections : fallbackD07;
    coreLabel = '대입 영향 가능성';
    coreValue = d07?.admissionImpactLevel ?? sections?.admissionImpactPossibility ?? diagnosis.result;
    coreDescription = d07?.admissionImpactDescription ?? sections?.admissionImpactDescription;
    grounds = uniqueItems([
      ...(d07?.admissionImpactFactors ?? []),
      ...(d07?.universityCheckPoints ?? []),
      ...(d07?.reasoningPoints ?? []),
    ]);
    materials = uniqueItems([...(d07?.recommendedMaterials ?? [])]);
    nextActions = uniqueItems([d07?.nextActions, d07?.nextSteps]);
  } else if (sections?.evidenceCapabilityV2) {
    coreLabel = '증거능력 1차 진단';
    coreValue = sections.diagnosisResult ?? diagnosis.result;
    coreDescription = sections.expertOpinion;
    grounds = uniqueItems([...(sections.reasoningPoints ?? [])]);
    materials = uniqueItems([
      ...(sections.missingEvidenceMaterials ?? []),
      sections.additionalEvidenceMaterials,
      sections.evidenceMaterials,
    ]);
    nextActions = uniqueItems([sections.nextSteps]);
  } else if (sections) {
    coreLabel = '예상 조치수위';
    coreValue = sections.expectedMeasure ?? sections.diagnosisResult ?? diagnosis.result;
    coreDescription = sections.factorAnalysis;
    grounds = uniqueItems([sections.reasons, sections.mitigatingFactors, sections.aggravatingFactors]);
    materials = getDefaultMaterials(code);
    nextActions = uniqueItems([sections.nextSteps]);
  }

  if (!materials.length) materials = getDefaultMaterials(code);
  if (!grounds.length) grounds = uniqueItems([sections?.inputSummary, diagnosis.result]);
  if (!nextActions.length) nextActions = ['사실관계와 자료를 정리합니다.', '필요한 기한과 절차를 확인합니다.', '전문가 상담으로 대응 방향을 점검합니다.'];

  const conciseNextActions = conciseActions(nextActions);
  const caution =
    '본 결과는 입력 내용을 바탕으로 한 참고자료입니다. 최종 판단은 학교 조사, 심의자료, 증거, 관계자 진술 및 관련 법령에 따라 달라질 수 있습니다.';

  return {
    code,
    diagnosisType,
    coreLabel,
    coreValue,
    coreDescription,
    aiOpinion: buildAiOpinion(code, coreValue, coreDescription),
    grounds: grounds.slice(0, 7),
    materials: materials.slice(0, 8),
    nextActions: conciseNextActions.length ? conciseNextActions : nextActions.slice(0, 5),
    caution,
  };
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm print:border-slate-300 print:shadow-none">
    <h2 className="mb-3 text-lg font-black text-slate-950">{title}</h2>
    {children}
  </section>
);

const ItemList = ({ items, emptyMessage }: { items: string[]; emptyMessage: string }) => (
  <ul className="space-y-2">
    {items.length ? (
      items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 leading-7 text-slate-800">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-navy" />
          <span className="whitespace-pre-wrap">{item}</span>
        </li>
      ))
    ) : (
      <li className="leading-7 text-slate-700">{emptyMessage}</li>
    )}
  </ul>
);

const Checklist = ({ items, emptyMessage }: { items: string[]; emptyMessage: string }) => (
  <ul className="space-y-2">
    {items.length ? (
      items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 rounded-lg bg-slate-50 p-3 leading-7 text-slate-800 print:border print:border-slate-200 print:bg-white">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-400 text-sm font-black text-navy">
            ✓
          </span>
          <span className="whitespace-pre-wrap">{item}</span>
        </li>
      ))
    ) : (
      <li className="rounded-lg bg-slate-50 p-3 leading-7 text-slate-700">{emptyMessage}</li>
    )}
  </ul>
);

const ConsultationCta = () => (
  <section className="overflow-hidden rounded-lg border border-blue-200 bg-blue-50 shadow-sm print:hidden">
    <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-black text-navy">10분 무료상담 가능</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">무료상담이 필요하신가요?</h2>
        </div>
        <div className="space-y-1 leading-7 text-slate-700">
          <p className="font-bold text-slate-900">AI 진단 결과를 바탕으로</p>
          <p className="font-bold text-slate-900">10분 무료상담을 받아보세요.</p>
          <p>
            현재 상황을 정리하고, 조치수위, 생활기록부, 대입 영향, 행정심판 가능성을
            10분 무료상담으로 확인해보세요.
          </p>
        </div>
      </div>
      <Link
        href="/reservation"
        className="btn-primary inline-flex w-full justify-center px-6 py-3 text-center text-base font-black md:w-auto md:shrink-0"
      >
        무료상담 예약
      </Link>
    </div>
  </section>
);

export default function DiagnosisResultPage({ params }: { params: { id: string } }) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const viewModel = useMemo(() => (diagnosis ? buildViewModel(diagnosis) : null), [diagnosis]);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const storageKey = `${DIAGNOSIS_STORAGE_KEY_PREFIX}:${params.id}`;
    const savedResult = sessionStorage.getItem(storageKey);

    if (savedResult) {
      try {
        setDiagnosis(JSON.parse(savedResult) as DiagnosisResult);
      } catch {
        setDiagnosis(null);
      }
    }

    setIsLoaded(true);
  }, [params.id]);

  return (
    <div className="card print:rounded-none print:border-0 print:shadow-none">
      <div className="mb-6 flex flex-col gap-2 border-b border-slate-200 pb-5">
        <p className="text-sm font-bold text-navy">{viewModel?.code && viewModel.code !== 'UNKNOWN' ? viewModel.code : '진단결과'}</p>
        <h1 className="text-2xl font-black text-slate-950">진단결과</h1>
        {viewModel ? <p className="text-sm text-slate-600">{viewModel.diagnosisType}</p> : null}
      </div>

      {!isLoaded ? null : viewModel ? (
        <div className="space-y-4 print:space-y-5">
          <Section title="AI 종합의견">
            <div className="rounded-lg bg-slate-50 p-4 print:border print:border-slate-200 print:bg-white">
              <ItemList items={viewModel.aiOpinion} emptyMessage="AI 종합의견을 표시할 수 없습니다." />
            </div>
          </Section>

          <Section title="핵심 진단결과">
            <div className="rounded-lg border border-navy/20 bg-navy/5 p-5">
              <p className="text-sm font-bold text-navy">{viewModel.coreLabel}</p>
              <p className="mt-2 whitespace-pre-wrap text-2xl font-black text-slate-950">{viewModel.coreValue || '-'}</p>
              {viewModel.coreDescription ? (
                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{viewModel.coreDescription}</p>
              ) : null}
            </div>
          </Section>

          <Section title="판단근거">
            <ItemList items={viewModel.grounds} emptyMessage="저장된 판단근거가 없습니다." />
          </Section>

          <Section title="준비자료">
            <Checklist items={viewModel.materials} emptyMessage="현재 입력 기준으로 별도 준비자료가 표시되지 않았습니다." />
          </Section>

          <Section title="다음 대응방향">
            <ItemList items={viewModel.nextActions} emptyMessage="다음 대응방향이 저장되지 않았습니다." />
          </Section>

          <Section title="주의사항">
            <p className="whitespace-pre-wrap leading-7 text-slate-700">{viewModel.caution}</p>
          </Section>

          <ConsultationCta />
        </div>
      ) : (
        <p className="rounded-lg bg-slate-100 p-4">진단 결과가 없습니다. 다시 진단을 진행해주세요.</p>
      )}

      <div className="mt-5 flex flex-wrap gap-3 print:hidden">
        {isLoaded && diagnosis ? (
          <button type="button" onClick={handlePrint} className="btn-outline">
            PDF 출력
          </button>
        ) : null}
        <Link href="/diagnosis" className="btn-outline">
          다시 진단하기
        </Link>
      </div>
    </div>
  );
}
