export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Project Memory</h1>
        <p className="text-sm text-slate-600">Persisted decisions, preferences, hooks, and rejected directions.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium">Decisions</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>Selected wedge: Hackathon to first users</li>
            <li>Primary channel: Email outreach</li>
          </ul>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium">Objections</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>"Why not just use generic chat tools?"</li>
            <li>"Will this work for tiny audiences?"</li>
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium">Timeline</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          <li>Research run completed</li>
          <li>Positioning selected</li>
          <li>Email batch approved</li>
        </ul>
      </section>
    </div>
  );
}
