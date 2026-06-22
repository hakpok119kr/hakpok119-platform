'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DIAGNOSIS_STORAGE_KEY_PREFIX = 'diagnosis-result';

const diagnosisResults: Record<string, string> = {
  D01: '입력 내용을 기준으로 볼 때 학교폭력 해당 가능성을 우선 검토할 필요가 있습니다. 행위의 반복성, 고의성, 피해 학생의 심리적 영향, 목격자 진술을 함께 정리해 두는 것이 좋습니다.',
  D02: '입력 내용상 학생 간 자체 해결 가능성을 검토할 수 있습니다. 다만 피해 회복 의사, 재발 방지 약속, 보호자 간 합의 가능성, 학교의 확인 절차가 함께 충족되는지 확인해야 합니다.',
  D03: '입력 내용만으로는 증거가 부족할 수 있으므로 증거 보강이 필요합니다. 대화 기록, 사진, 영상, 진단서, 목격자 진술, 담임 또는 학교 상담 기록을 시간순으로 정리하는 것이 중요합니다.',
  D04: '학교 또는 관련 기관의 조치 필요성이 있는 사안으로 보입니다. 피해 학생 보호, 가해 학생과의 분리, 긴급 보호 요청, 담임 및 학교폭력 담당자에게 전달할 핵심 사실을 정리해 주세요.',
  D05: '4주 이상 치료 또는 장기 피해 가능성을 확인해야 합니다. 병원 진단서, 치료 기간, 출석 영향, 심리 상담 기록 등 피해 정도를 입증할 자료를 확보하는 것이 필요합니다.',
  D06: '생활기록부 기재 또는 학생 기록에 영향을 줄 수 있는 요소가 포함될 수 있습니다. 사안의 중대성, 조치 수준, 이의제기 가능성, 향후 진학 영향까지 함께 검토하는 것이 좋습니다.',
  D07: '전학 또는 분리 조치 가능성을 검토해야 하는 사안입니다. 피해 학생의 안전, 통학 동선, 같은 학급 여부, 반복 접촉 가능성, 보호자 요청 사항을 구체적으로 정리해 주세요.',
  D08: '행정심판 또는 불복 절차 가능성을 검토할 수 있습니다. 처분 통지서, 회의록, 사실관계 오류, 절차상 문제, 제출 기한을 확인하고 관련 자료를 빠르게 정리하는 것이 중요합니다.',
};

const fallbackResult =
  '입력 내용을 기준으로 1차 진단 결과를 생성했습니다. 실제 판단은 학교폭력 조사 및 관련 위원회 심의 결과에 따라 달라질 수 있습니다.';

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
    const result = diagnosisResults[params.type] ?? fallbackResult;

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
