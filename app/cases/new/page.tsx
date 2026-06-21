export default function NewCasePage() {
  return (
    <div className="card">
      <h1 className="mb-6 text-2xl font-black">사건등록</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-xl border p-3" placeholder="사건명" />
        <select className="rounded-xl border p-3"><option>피해학생</option><option>가해학생</option><option>쌍방</option></select>
        <input className="rounded-xl border p-3" placeholder="학교명" />
        <input className="rounded-xl border p-3" placeholder="학년/반" />
      </div>
      <textarea className="mt-3 h-40 w-full rounded-xl border p-3" placeholder="사건내용" />
      <button className="btn-primary mt-5">저장</button>
    </div>
  );
}
