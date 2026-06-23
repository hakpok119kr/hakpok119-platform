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
    inputSummary: string;
    expectedMeasure: string;
    reasons: string;
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

          {diagnosis.resultSections ? (
            <>
              <section>
                <h2 className="mb-2 font-bold">입력내용 요약</h2>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 print:border print:border-slate-300 print:bg-white">
                  {diagnosis.resultSections.inputSummary}
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
