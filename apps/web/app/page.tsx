import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <header className="mb-16 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Growth Launchpad</h1>
        <nav className="flex items-center gap-4 text-sm text-slate-700">
          <Link href="/login">Log in</Link>
          <Link href="/auth/login" className="rounded-md bg-brand-600 px-3 py-2 text-white">Sign in</Link>
        </nav>
      </header>

      <section className="grid flex-1 items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            Product-first GTM workspace
          </p>
          <h2 className="text-5xl font-semibold tracking-tight text-slate-900">
            Turn a rough build into a real launch system.
          </h2>
          <p className="max-w-xl text-base text-slate-700">
            Research competitors, choose a positioning wedge, generate assets, and execute supervised outbound with approvals and memory.
          </p>
          <div className="flex gap-3">
            <Link href="/auth/login" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
              Start with Auth0
            </Link>
            <Link href="/app" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium">
              Open Workspace
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium">How it works</h3>
          <ol className="space-y-3 text-sm text-slate-700">
            <li>1. Create project and brief</li>
            <li>2. Run research and positioning agents</li>
            <li>3. Generate launch plan and assets</li>
            <li>4. Approve and send outbound with step-up auth</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
