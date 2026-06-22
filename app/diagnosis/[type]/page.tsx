'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DiagnosisInputPage({ params }: { params: { type: string } }) {
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleDiagnosis = () => {
    if (!content.trim()) {
      alert('사건 내용을 입력해 주세요.');
      return;
    }

    const resultId = Date.now().toString();

    sessionStorage.setItem(
      `diagnosis-${resultId}`,
      JSON.stringify({
        type: params.type,
        content,
        result: '입력 내용을 기준으로 볼 때 학교폭력 해당 가능성이 있습니다. 다만 실제 판단은 학교 조사와 학교폭력대책심의위원회의 심의 결과에 따라 달라질 수 있습니다.',
      })
    );

    router.push(`/diagnosis/result/${resultId}`);
  };

  return (
    <div className="card">
      <h1 className="mb-6 text-2xl font-black">무료진단 입력 - {params.type}</h1>

      <textarea
        className="h-60 w-full rounded-xl border p-3"
        placeholder="사건 발생일, 장소, 관련 학생, 구체적 내용, 증거자료를 입력하세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={handleDiagnosis} className="btn-primary mt-5">
        AI 진단하기
      </button>
    </div>
  );
}
