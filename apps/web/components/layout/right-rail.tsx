export function RightRail() {
  return (
    <aside className="hidden w-72 shrink-0 border-l border-slate-200 bg-white p-3 xl:block">
      <div className="space-y-3">
        <section className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-medium">Pending Approvals</h3>
          <p className="mt-1 text-xs text-slate-600">Review sensitive actions before execution.</p>
        </section>
        <section className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-medium">Agent Status</h3>
          <p className="mt-1 text-xs text-slate-600">Research, positioning, and execution workers.</p>
        </section>
        <section className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-medium">Memory Summary</h3>
          <p className="mt-1 text-xs text-slate-600">Persisted decisions and preferences.</p>
        </section>
      </div>
    </aside>
  );
}
