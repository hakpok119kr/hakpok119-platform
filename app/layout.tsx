import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: '학교폭력119',
  description: '학교폭력119 AI 기반 업무지원 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
