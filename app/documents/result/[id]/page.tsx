export default function DocumentResultPage() {
  return (
    <div className="card">
      <h1 className="mb-4 text-2xl font-black">문서결과</h1>
      <textarea className="h-96 w-full rounded-xl border p-3" defaultValue="AI 문서 초안이 이 영역에 표시됩니다." />
      <div className="mt-5 flex gap-3"><button className="btn-outline">PDF 저장</button><a href="/reservation" className="btn-primary">상담신청</a></div>
    </div>
  );
}
