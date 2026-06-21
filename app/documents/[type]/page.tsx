export default function DocumentInputPage({ params }: { params: { type: string } }) {
  return (
    <div className="card">
      <h1 className="mb-6 text-2xl font-black">서류작성 입력</h1>
      <textarea className="h-60 w-full rounded-xl border p-3" placeholder="사건내용, 인정하는 사실, 반성내용, 요청사항 등을 입력하세요." />
      <button className="btn-primary mt-5">AI 문서 생성</button>
    </div>
  );
}
