'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const DIAGNOSIS_STORAGE_KEY_PREFIX = 'diagnosis-result';

type DiagnosisResult = {
  type: string;
  content: string;
  result: string;
  resultSections?: {
    diagnosisType: string;
    adminAppealV2?: boolean;
    principalResolutionV2?: boolean;
    schoolViolenceEligibilityV2?: boolean;
    evidenceCapabilityV2?: boolean;
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
      selectedItems?: string;
      expectedMeasure?: string;
      schoolLevel?: string;
      grade?: string;
    };
    reasoningPoints?: string[];
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
    recordRiskLevel?: string;
    recordRiskDescription?: string;
    recordImpactFactors?: string[];
    deleteReviewNeed?: string;
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

const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

const splitResultLines = (value?: string) =>
  value
    ?.split('\n')
    .map((line) => line.trim())
    .filter(Boolean) ?? [];

const asResultItems = (value?: string | string[]) =>
  Array.isArray(value) ? value : splitResultLines(value);

const renderNumberedItems = (items: string[], emptyMessage: string) => (
  <ol className="space-y-2 rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
    {items.length ? (
      items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2 leading-7">
          <span className="shrink-0 font-bold text-slate-700">{circledNumbers[index] ?? `${index + 1}.`}</span>
          <span>{item}</span>
        </li>
      ))
    ) : (
      <li className="leading-7">{emptyMessage}</li>
    )}
  </ol>
);

const renderChecklistItems = (items: string[], emptyMessage: string) => (
  <ul className="space-y-2 rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
    {items.length ? (
      items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2 leading-7">
          <span className="shrink-0 font-bold text-slate-700">□</span>
          <span>{item}</span>
        </li>
      ))
    ) : (
      <li className="leading-7">{emptyMessage}</li>
    )}
  </ul>
);

const d01ProfessionalNextSteps = [
  '현재 입력내용을 기준으로는 학교폭력 해당 가능성이 있는 사안으로 보입니다.',
  '신고 전후로 사실관계와 증거자료를 시간순으로 정리하는 것이 중요합니다.',
  '피해 내용, 발생 일시, 장소, 관련학생, 목격자, 증거자료를 구체적으로 정리해 주세요.',
  '필요한 경우 학교 상담, 보호조치 요청, 전문가 상담을 함께 검토하시기 바랍니다.',
];

const d01ExpertOpinion = [
  '현재 입력내용을 종합하면 학교폭력에 해당할 가능성이 있는 사안입니다.',
  '다만 최종 판단은 학교 조사, 학생 진술, 목격학생 진술, 증거자료, 피해 정도, 반복성, 고의성 등을 종합하여 결정됩니다.',
  '따라서 신고 또는 심의 전에는 사실관계와 증거자료를 정리하고, 필요한 경우 전문가 상담을 통해 대응 방향을 점검하는 것이 좋습니다.',
];

export default function DiagnosisResultPage({ params }: { params: { id: string } }) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handlePrint = () => {
    console.log('PDF print clicked');
    alert('PDF 저장을 위해 인쇄창을 엽니다.');
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
      <h1 className="mb-4 text-2xl font-black">진단결과</h1>

      {!isLoaded ? null : diagnosis ? (
        <div className="space-y-4 print:space-y-5">
          <section>
            <h2 className="mb-2 font-bold">진단유형</h2>
            <p className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
              {diagnosis.resultSections?.diagnosisType ?? diagnosis.type}
            </p>
          </section>

          {diagnosis.resultSections?.measureScoreV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <dl className="grid gap-2 sm:grid-cols-[7rem_1fr]">
                    <dt className="font-bold">심각성</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.severity ?? '-'}</dd>
                    <dt className="font-bold">지속성</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.persistence ?? '-'}</dd>
                    <dt className="font-bold">고의성</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.intentionality ?? '-'}</dd>
                    <dt className="font-bold">반성정도</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.remorse ?? '-'}</dd>
                    <dt className="font-bold">화해여부</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.reconciliation ?? '-'}</dd>
                  </dl>
                  <div className="mt-4">
                    <h3 className="mb-2 font-bold">사실관계 요약</h3>
                    <p className="whitespace-pre-wrap">
                      {diagnosis.resultSections.inputDetails?.caseSummary || diagnosis.resultSections.inputDetails?.incidentContent || '입력된 사실관계 요약이 없습니다.'}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단근거</h2>
                <ol className="list-decimal space-y-2 rounded-xl bg-slate-100 p-4 pl-8 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.reasoningPoints?.length ? (
                    diagnosis.resultSections.reasoningPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))
                  ) : (
                    <li>저장된 판단근거가 없습니다.</li>
                  )}
                </ol>
              </section>

              <section>
                <h2 className="mb-2 font-bold">진단결과</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-lg font-black print:border print:border-slate-300 print:bg-white">
                  예상 조치수위 : {diagnosis.resultSections.expectedMeasure}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">선택한 항목 요약</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.inputSummary}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">기본점수</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.baseScore}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">가중요소</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.aggravatingItems}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">감경요소</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.mitigatingItems}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">최종점수</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-lg font-black print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.finalScore}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주요 판단근거</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.reasons}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">종합의견</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.comprehensiveOpinion}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">유의사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.caution}
                </p>
              </section>
            </>
          ) : diagnosis.resultSections?.d06StudentRecordV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <dl className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                    <dt className="font-bold">사용자가 선택하거나 입력한 D06 항목</dt>
                    <dd className="whitespace-pre-wrap">
                      {diagnosis.resultSections.inputDetails?.selectedItems ||
                        diagnosis.resultSections.inputContent ||
                        diagnosis.content}
                    </dd>
                    <dt className="font-bold">받은 조치 또는 예상 조치</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.expectedMeasure ?? '-'}</dd>
                    <dt className="font-bold">학교급</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.schoolLevel ?? '-'}</dd>
                    <dt className="font-bold">학년</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.grade ?? '-'}</dd>
                    <dt className="font-bold">사실관계 요약</dt>
                    <dd className="whitespace-pre-wrap">
                      {diagnosis.resultSections.factSummary ||
                        diagnosis.resultSections.inputDetails?.factSummary ||
                        '입력된 사실관계 요약이 없습니다.'}
                    </dd>
                  </dl>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단근거</h2>
                {renderNumberedItems(
                  diagnosis.resultSections.reasoningPoints ?? [],
                  '저장된 판단근거가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">생활기록부 기재 가능성</h2>
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm print:shadow-none">
                  <p className="text-2xl font-black text-slate-950">
                    {diagnosis.resultSections.recordRiskLevel ?? '-'}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap leading-7">
                    {diagnosis.resultSections.recordRiskDescription}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">기재 영향 요소</h2>
                {renderNumberedItems(
                  diagnosis.resultSections.recordImpactFactors ?? [],
                  '저장된 기재 영향 요소가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">삭제심의 검토 필요성</h2>
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm print:shadow-none">
                  <p className="text-2xl font-black text-slate-950">
                    {diagnosis.resultSections.deleteReviewNeed ?? '-'}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap leading-7">
                    {diagnosis.resultSections.deleteReviewDescription}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">보완자료</h2>
                {renderChecklistItems(
                  diagnosis.resultSections.recommendedMaterials ?? [],
                  '저장된 보완자료가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.nextActions ?? diagnosis.resultSections.nextSteps}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">전문가 의견</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.expertOpinion}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주의사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.caution}
                </p>
              </section>
            </>
          ) : diagnosis.resultSections?.d05RiskV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <dl className="grid gap-3 sm:grid-cols-[11rem_1fr]">
                    <dt className="font-bold">선택/입력한 D05 항목</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputSummary ?? diagnosis.content}</dd>
                    <dt className="font-bold">사실관계 요약</dt>
                    <dd className="whitespace-pre-wrap">
                      {diagnosis.resultSections.factSummary ||
                        diagnosis.resultSections.inputDetails?.factSummary ||
                        '입력된 사실관계 요약이 없습니다.'}
                    </dd>
                  </dl>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">위험요인</h2>
                {renderNumberedItems(
                  asResultItems(diagnosis.resultSections.riskFactors),
                  '저장된 위험요인이 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">감경요인</h2>
                {renderNumberedItems(
                  asResultItems(diagnosis.resultSections.mitigatingFactors),
                  '저장된 감경요인이 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단근거</h2>
                {renderNumberedItems(
                  diagnosis.resultSections.reasoningPoints ?? [],
                  '저장된 판단근거가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 text-lg font-black">4호 이상 위험도</h2>
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm print:shadow-none">
                  <p className="mb-2 text-sm font-bold text-slate-600">4호 이상 위험도 1차 진단</p>
                  <p className="whitespace-pre-wrap text-xl font-black text-slate-950">
                    {diagnosis.resultSections.riskLevel}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap leading-7">
                    {diagnosis.resultSections.diagnosisResult}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">예상 조치수위</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.expectedMeasures}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">생활기록부 영향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.studentRecordImpact ?? diagnosis.resultSections.schoolRecordPossibility}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">권장 준비자료</h2>
                {renderChecklistItems(
                  diagnosis.resultSections.recommendedMaterials ?? splitResultLines(diagnosis.resultSections.evidenceMaterials),
                  '저장된 준비자료 목록이 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.nextActions ?? diagnosis.resultSections.nextSteps}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">전문가 의견</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.expertOpinion}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주의사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.caution}
                </p>
              </section>
            </>
          ) : diagnosis.resultSections?.schoolViolenceEligibilityV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <dl className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                    <dt className="font-bold">학교폭력 유형/입력 항목</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputContent ?? diagnosis.content}</dd>
                    <dt className="font-bold">사실관계 요약</dt>
                    <dd className="whitespace-pre-wrap">
                      {diagnosis.resultSections.factSummary || '입력된 사실관계 요약이 없습니다.'}
                    </dd>
                  </dl>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단근거</h2>
                {renderNumberedItems(
                  splitResultLines(diagnosis.resultSections.grounds).length
                    ? splitResultLines(diagnosis.resultSections.grounds)
                    : diagnosis.resultSections.reasoningPoints ?? [],
                  '저장된 판단근거가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 text-lg font-black">진단결과</h2>
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm print:shadow-none">
                  <p className="mb-2 text-sm font-bold text-slate-600">학교폭력 해당성 1차 진단</p>
                  <p className="whitespace-pre-wrap text-xl font-black text-slate-950">
                    {diagnosis.resultSections.diagnosisResult}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">추가로 확인할 사항</h2>
                {renderNumberedItems(
                  splitResultLines(diagnosis.resultSections.additionalChecks),
                  '저장된 추가 확인사항이 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">준비할 증거자료</h2>
                {renderChecklistItems(
                  splitResultLines(diagnosis.resultSections.evidenceMaterials),
                  '저장된 증거자료 목록이 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <div className="space-y-2 rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {d01ProfessionalNextSteps.map((step) => (
                    <p key={step} className="leading-7">
                      {step}
                    </p>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">전문가 의견</h2>
                <div className="space-y-2 rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {d01ExpertOpinion.map((opinion) => (
                    <p key={opinion} className="leading-7">
                      {opinion}
                    </p>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주의사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.caution}
                </p>
              </section>
            </>
          ) : diagnosis.resultSections?.principalResolutionV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <dl className="grid gap-3 sm:grid-cols-[14rem_1fr]">
                    <dt className="font-bold">2주 이상 진단서 여부</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.diagnosisStatus ?? '-'}</dd>
                    <dt className="font-bold">재산피해 여부</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.propertyDamageStatus ?? '-'}</dd>
                    <dt className="font-bold">지속성 여부</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.continuityStatus ?? '-'}</dd>
                    <dt className="font-bold">보복행위 여부</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.retaliationStatus ?? '-'}</dd>
                    <dt className="font-bold">피해학생 측 심의위원회 개최 희망 여부</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.committeeIntent ?? '-'}</dd>
                    <dt className="font-bold">사실관계 요약</dt>
                    <dd className="whitespace-pre-wrap">
                      {diagnosis.resultSections.inputDetails?.factSummary || '입력된 사실관계 요약이 없습니다.'}
                    </dd>
                  </dl>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단근거</h2>
                {renderNumberedItems(
                  diagnosis.resultSections.reasoningPoints ?? [],
                  '저장된 판단근거가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 text-lg font-black">진단결과</h2>
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm print:shadow-none">
                  <p className="mb-2 text-sm font-bold text-slate-600">학교장 자체해결 가능성 1차 진단</p>
                  <p className="whitespace-pre-wrap text-xl font-black text-slate-950">
                    {diagnosis.resultSections.possibility}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">추가로 확인할 사항</h2>
                {renderNumberedItems(
                  splitResultLines(diagnosis.resultSections.additionalChecks),
                  '저장된 추가 확인사항이 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">준비할 자료</h2>
                {renderChecklistItems(
                  splitResultLines(diagnosis.resultSections.preparationDocuments),
                  '저장된 준비자료 목록이 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.nextSteps}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">전문가 의견</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.expertOpinion}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주의사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.caution}
                </p>
              </section>
            </>
          ) : diagnosis.resultSections?.evidenceCapabilityV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <dl className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                    <dt className="font-bold">선택/입력한 증거자료 종류</dt>
                    <dd className="whitespace-pre-wrap">
                      {diagnosis.resultSections.inputDetails?.evidenceTypes ||
                        diagnosis.resultSections.inputContent ||
                        diagnosis.content}
                    </dd>
                    <dt className="font-bold">사실관계 요약</dt>
                    <dd className="whitespace-pre-wrap">
                      {diagnosis.resultSections.inputDetails?.factSummary ||
                        diagnosis.resultSections.factSummary ||
                        '입력된 사실관계 요약이 없습니다.'}
                    </dd>
                  </dl>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단근거</h2>
                {renderNumberedItems(
                  diagnosis.resultSections.reasoningPoints ?? [],
                  '저장된 판단근거가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 text-lg font-black">진단결과</h2>
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm print:shadow-none">
                  <p className="mb-2 text-sm font-bold text-slate-600">증거능력 1차 진단</p>
                  <p className="whitespace-pre-wrap text-xl font-black text-slate-950">
                    {diagnosis.resultSections.diagnosisResult ?? diagnosis.result}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">부족한 증거자료</h2>
                {renderChecklistItems(
                  diagnosis.resultSections.missingEvidenceMaterials ?? [],
                  '현재 입력내용 기준으로 별도 표시할 부족한 증거자료가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">추가로 확보하면 좋은 자료</h2>
                {renderChecklistItems(
                  splitResultLines(
                    diagnosis.resultSections.additionalEvidenceMaterials ??
                      diagnosis.resultSections.evidenceMaterials
                  ),
                  '저장된 추가 확보자료 목록이 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.nextSteps}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">전문가 의견</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.expertOpinion}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주의사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.caution}
                </p>
              </section>
            </>
          ) : diagnosis.resultSections?.adminAppealV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <dl className="grid gap-3 sm:grid-cols-[11rem_1fr]">
                    <dt className="font-bold">현재 입장</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.currentPosition ?? diagnosis.resultSections.currentPosition ?? '-'}</dd>
                    <dt className="font-bold">심의 진행 상태</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.reviewStatus ?? diagnosis.resultSections.reviewStatus ?? '-'}</dd>
                    <dt className="font-bold">조치결정 통지일</dt>
                    <dd>{diagnosis.resultSections.inputDetails?.noticeDate ?? '-'}</dd>
                    <dt className="font-bold">가해학생 조치</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputDetails?.offenderMeasures ?? '-'}</dd>
                    <dt className="font-bold">피해학생 보호조치</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputDetails?.victimMeasures ?? '-'}</dd>
                    <dt className="font-bold">불복 방향</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputDetails?.objectionReasons ?? diagnosis.resultSections.objectionReasons ?? '-'}</dd>
                    <dt className="font-bold">절차상 문제</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputDetails?.procedureIssues ?? diagnosis.resultSections.procedureIssues ?? '-'}</dd>
                    <dt className="font-bold">사실관계·증거 문제</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputDetails?.evidenceIssues ?? diagnosis.resultSections.evidenceIssues ?? '-'}</dd>
                    <dt className="font-bold">비례원칙 관련</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputDetails?.proportionalityIssues ?? diagnosis.resultSections.proportionalityIssues ?? '-'}</dd>
                    <dt className="font-bold">긴급성</dt>
                    <dd className="whitespace-pre-wrap">{diagnosis.resultSections.inputDetails?.urgency ?? '-'}</dd>
                    <dt className="font-bold">사실관계 요약</dt>
                    <dd className="whitespace-pre-wrap">
                      {diagnosis.resultSections.factSummary ||
                        diagnosis.resultSections.inputDetails?.factSummary ||
                        '입력된 사실관계 요약이 없습니다.'}
                    </dd>
                  </dl>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">불복 가능 사유</h2>
                {renderNumberedItems(
                  diagnosis.resultSections.appealGrounds ?? asResultItems(diagnosis.resultSections.objectionReasons),
                  '저장된 불복 가능 사유가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">불리한 요소</h2>
                {renderNumberedItems(
                  asResultItems(diagnosis.resultSections.riskFactors),
                  '저장된 불리한 요소가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단근거</h2>
                {renderNumberedItems(
                  diagnosis.resultSections.reasoningPoints ?? [],
                  '저장된 판단근거가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">행정심판 가능성</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <p className="text-2xl font-black">{diagnosis.resultSections.appealLevel ?? diagnosis.resultSections.appealNeed ?? '-'}</p>
                  <h3 className="mt-4 mb-2 font-bold">주요 사유</h3>
                  {renderNumberedItems(
                    diagnosis.resultSections.reasoningPoints ?? [],
                    '저장된 주요 사유가 없습니다.'
                  )}
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">집행정지 필요성</h2>
                <div className="rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  <p className="text-2xl font-black">{diagnosis.resultSections.stayNeed ?? '-'}</p>
                  <p className="mt-3 whitespace-pre-wrap leading-7">{diagnosis.resultSections.stayNeedDescription}</p>
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold">보완자료</h2>
                {renderChecklistItems(
                  diagnosis.resultSections.recommendedMaterials ?? splitResultLines(diagnosis.resultSections.preparationDocuments),
                  '저장된 보완자료가 없습니다.'
                )}
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.nextActions ?? diagnosis.resultSections.nextSteps}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">전문가 의견</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.expertOpinion}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주의사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.caution}
                </p>
              </section>
            </>
          ) : diagnosis.resultSections ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용 요약</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.inputSummary}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">심의 판단요소 분석</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.factorAnalysis ?? '심의 판단요소 분석이 저장되지 않았습니다.'}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">예상 조치수위</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.expectedMeasure}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단 이유</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.reasons}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">감경 가능 요소</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.mitigatingFactors ?? '감경 가능 요소가 저장되지 않았습니다.'}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">가중 위험 요소</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.aggravatingFactors ?? '가중 위험 요소가 저장되지 않았습니다.'}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주의사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.caution}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.nextSteps}
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력한 내용</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.content}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">진단결과</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.result}
                </p>
              </section>
            </>
          )}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-100 p-4">
          진단 결과가 없습니다. 다시 진단을 진행해주세요.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3 print:hidden">
        {isLoaded && diagnosis ? (
          <button type="button" onClick={handlePrint} className="btn-outline">
            PDF 저장
          </button>
        ) : null}
        <Link href="/diagnosis" className="btn-outline">
          다시 진단하기
        </Link>
        <Link href="/reservation" className="btn-primary">
          상담예약
        </Link>
      </div>
    </div>
  );
}
