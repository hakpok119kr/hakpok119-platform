export default function FaqPage() {
  const items = ['학교폭력이란 무엇인가요?', '학교장 자체해결은 언제 가능한가요?', '학폭위 전에 무엇을 준비해야 하나요?'];
  return (
    <div>
      <h1 className="mb-6 text-3xl font-black">FAQ</h1>
      <div className="space-y-3">{items.map(q => <details className="card" key={q}><summary className="font-bold">{q}</summary><p className="mt-3 text-slate-600">관리자페이지에서 답변을 등록할 예정입니다.</p></details>)}</div>
    </div>
  );
}
