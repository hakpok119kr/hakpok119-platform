export default function DiagnosisResultPage() {
  return (
    <div className="card">
      <h1 className="mb-4 text-2xl font-black">진단결과</h1>
      <p className="rounded-xl bg-slate-100 p-4">AI 진단결과가 이 영역에 표시됩니다.</p>
      <div className="mt-5 flex gap-3"><button className="btn-outline">PDF 저장</button><a href="/reservation" className="btn-primary">상담예약</a></div>
    </div>
  );
}
