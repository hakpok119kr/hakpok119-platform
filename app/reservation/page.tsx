const products = [
  ['기본상담', '20분 + 무료 10분', '총 30분', '33,000원'],
  ['사건검토 상담', '30분 + 무료 10분', '총 40분', '55,000원'],
  ['자료검토 상담', '60분 + 무료 10분', '총 70분', '99,000원'],
];

export default function ReservationPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-black">상담예약</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {products.map(([name, time, total, price]) => (
          <div key={name} className="card">
            <h2 className="text-xl font-bold">{name}</h2>
            <p className="mt-3">{time}</p>
            <p className="font-bold text-navy">{total}</p>
            <p className="mt-3 text-2xl font-black">{price}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6">
        <p className="mb-4 text-sm text-slate-600">상담예약 신청 후 안내된 계좌로 입금해 주시면, 관리자가 입금 확인 후 예약을 확정합니다.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="rounded-xl border p-3" placeholder="희망일시" />
          <input className="rounded-xl border p-3" placeholder="입금자명" />
          <input className="rounded-xl border p-3" placeholder="연락처" />
          <textarea className="rounded-xl border p-3 md:col-span-2" placeholder="상담내용" />
        </div>
        <a href="/reservation/success" className="btn-primary mt-5">예약신청</a>
      </div>
    </div>
  );
}
