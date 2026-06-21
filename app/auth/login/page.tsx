export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md card">
      <h1 className="mb-6 text-2xl font-black">로그인</h1>
      <input className="mb-3 w-full rounded-xl border p-3" placeholder="이메일" />
      <input className="mb-5 w-full rounded-xl border p-3" placeholder="비밀번호" type="password" />
      <button className="btn-primary w-full">로그인</button>
    </div>
  );
}
