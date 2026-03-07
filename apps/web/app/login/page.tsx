import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Sign in to Growth Launchpad</h1>
        <p className="mb-6 text-sm text-slate-600">Use Auth0 Universal Login with your preferred provider.</p>
        <div className="space-y-3">
          <Link href="/auth/login?connection=github" className="block rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium">
            Continue with GitHub
          </Link>
          <Link href="/auth/login?connection=google-oauth2" className="block rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium">
            Continue with Google
          </Link>
          <Link href="/auth/login" className="block rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white">
            Continue with Passkey / MFA
          </Link>
        </div>
      </div>
    </main>
  );
}
