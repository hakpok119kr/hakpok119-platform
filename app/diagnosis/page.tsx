import Link from 'next/link';

const items = [
  { title: '학교폭력 해당성 진단', href: '/diagnosis/D01' },
  { title: '학교장 자체해결 V2 진단', href: '/diagnosis/D02' },
  { title: '증거능력 진단', href: '/diagnosis/D03' },
  { title: '조치수위 예측', href: '/diagnosis/measure' },
  { title: '4호 이상 위험도 진단', href: '/diagnosis/D05' },
  { title: '생활기록부 영향 진단', href: '/diagnosis/D06' },
  { title: '대학입시 영향 진단', href: '/diagnosis/D07' },
  { title: '행정심판 가능성 진단', href: '/diagnosis/D08' },
];

export default function DiagnosisPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-black">무료진단</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="card">
            <h2 className="text-xl font-bold">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">입력내용을 기준으로 1차 검토자료를 생성합니다.</p>
            <Link href={item.href} className="btn-primary mt-4">진단 시작</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
