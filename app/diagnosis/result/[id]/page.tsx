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
    d05RiskV2?: boolean;
    measureScoreV2?: boolean;
    inputContent?: string;
    diagnosisResult?: string;
    riskLevel?: string;
    grounds?: string;
    additionalChecks?: string;
    evidenceMaterials?: string;
    inputSummary?: string;
    possibility?: string;
    legalRequirements?: string;
    relationshipRecovery?: string;
    riskFactors?: string;
    schoolRecordPossibility?: string;
    admissionImpactPossibility?: string;
    factorAnalysis?: string;
    baseScore?: string;
    aggravatingItems?: string;
    mitigatingItems?: string;
    finalScore?: string;
    expectedMeasure?: string;
    reasons?: string;
    comprehensiveOpinion?: string;
    mitigatingFactors?: string;
    aggravatingFactors?: string;
    currentPosition?: string;
    reviewStatus?: string;
    decisionSummary?: string;
    filingPeriodReview?: string;
    appealNeed?: string;
    objectionReasons?: string;
    procedureIssues?: string;
    evidenceIssues?: string;
    proportionalityIssues?: string;
    preparationDocuments?: string;
    caution: string;
    nextSteps: string;
  };
};

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
                <h2 className="mb-2 font-bold">예상조치</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-lg font-black print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.expectedMeasure}
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
          ) : diagnosis.resultSections?.d05RiskV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용 요약</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.inputSummary ?? diagnosis.content}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">진단결과</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.diagnosisResult}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">4호 이상 위험도</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-lg font-black print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.riskLevel}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">위험요소</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.riskFactors}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">감경요소</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.mitigatingFactors}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">생활기록부 기재 가능성</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.schoolRecordPossibility}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">대학입시 영향 가능성</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.admissionImpactPossibility}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">추가 확인사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.additionalChecks}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.nextSteps}
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
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.inputContent ?? diagnosis.content}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">진단결과</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-lg font-black print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.diagnosisResult}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">판단근거</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.grounds}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">추가로 확인할 사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.additionalChecks}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">준비할 증거자료</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.evidenceMaterials}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">다음 대응방향</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.nextSteps}
                </p>
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
                <h2 className="mb-2 font-bold">입력내용 요약</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.inputSummary}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">학교장 자체해결 가능성</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.possibility}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">법정요건 충족 여부</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.legalRequirements}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">관계회복 가능성</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.relationshipRecovery}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">심의 전 위험요소</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.riskFactors}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">추가 확인사항</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.additionalChecks}
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

              <section>
                <h2 className="mb-2 font-bold">준비자료</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.preparationDocuments}
                </p>
              </section>
            </>
          ) : diagnosis.resultSections?.adminAppealV2 ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">현재 입장</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.currentPosition}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">심의 진행 상태</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.reviewStatus}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">조치결정 요약</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.decisionSummary}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">행정심판 청구기간 검토</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.filingPeriodReview}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">행정심판 검토 필요성</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.appealNeed}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">주요 불복 사유</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.objectionReasons}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">절차상 쟁점</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.procedureIssues}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">사실관계·증거 쟁점</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.evidenceIssues}
                </p>
              </section>

              <section>
                <h2 className="mb-2 font-bold">비례원칙 쟁점</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.proportionalityIssues}
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

              <section>
                <h2 className="mb-2 font-bold">준비서류</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.preparationDocuments}
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
