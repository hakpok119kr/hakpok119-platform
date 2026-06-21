export default function DiagnosisInputPage({ params }: { params: { type: string } }) {
  return (
    <div className="card">
      <h1 className="mb-6 text-2xl font-black">무료진단 입력 - {params.type}</h1>
      <textarea className="h-60 w-full rounded-xl border p-3" placeholder="사건 발생일, 장소, 관련 학생, 구체적 내용, 증거자료를 입력하세요." />
      <button className="btn-primary mt-5">AI 진단하기</button>
    </div>
  );
}
