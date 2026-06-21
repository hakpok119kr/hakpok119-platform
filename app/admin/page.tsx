export default function AdminPage() {
  const cards = ['회원관리','사건관리','진단결과','문서관리','상담예약','FAQ관리','콘텐츠관리','관리자 로그'];
  return (
    <div>
      <h1 className="mb-6 text-3xl font-black">관리자 대시보드</h1>
      <div className="grid gap-4 md:grid-cols-4">{cards.map(c => <div className="card font-bold" key={c}>{c}</div>)}</div>
    </div>
  );
}
