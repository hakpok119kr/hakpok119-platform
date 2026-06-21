import Link from 'next/link';

const nav = [
  ['무료진단', '/diagnosis'],
  ['서류작성', '/documents'],
  ['상담예약', '/reservation'],
  ['FAQ', '/faq'],
  ['마이페이지', '/mypage'],
  ['관리자', '/admin'],
];

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-black text-navy">학교폭력119</Link>
        <nav className="hidden gap-4 md:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-semibold text-slate-700 hover:text-navy">{label}</Link>
          ))}
        </nav>
        <Link href="/auth/login" className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white">로그인</Link>
      </div>
    </header>
  );
}
