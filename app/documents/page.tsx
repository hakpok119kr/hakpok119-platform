import Link from 'next/link';

const docs = ['반성문','사과문','재발방지계획서','피해학생 의견서','가해학생 의견서','탄원서','화해·합의서','학교폭력 신고서'];

export default function DocumentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-black">서류작성</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {docs.map((doc) => (
          <div key={doc} className="card">
            <h2 className="text-xl font-bold">{doc}</h2>
            <Link href={`/documents/${encodeURIComponent(doc)}`} className="btn-primary mt-4">작성 시작</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
