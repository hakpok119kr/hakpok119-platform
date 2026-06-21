import Link from 'next/link';

const cards = [
  ['학교폭력 해당성 진단', '/diagnosis'],
  ['조치수위 예측', '/diagnosis'],
  ['생기부 영향 진단', '/diagnosis'],
  ['반성문 작성', '/documents'],
  ['행정심판 가능성', '/diagnosis'],
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-navy px-6 py-14 text-white">
        <p className="mb-3 text-point font-bold">hakpok119.kr</p>
        <h1 className="text-3xl font-black leading-tight md:text-5xl">학교폭력 사건,<br />감정보다 정리가 먼저입니다.</h1>
        <p className="mt-5 max-w-2xl text-slate-200">AI 무료진단과 전문 행정사 상담으로 학폭위 전 꼭 필요한 자료를 정리하세요.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/diagnosis" className="btn-primary bg-point text-navy">무료진단 시작하기</Link>
          <Link href="/reservation" className="btn-outline border-white text-white hover:bg-white hover:text-navy">상담예약하기</Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-5">
        {cards.map(([title, href]) => (
          <Link href={href} key={title} className="card font-bold hover:border-navy">{title}</Link>
        ))}
      </section>
    </div>
  );
}
