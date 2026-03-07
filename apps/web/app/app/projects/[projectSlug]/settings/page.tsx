export default function ProjectSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Project Settings</h2>
        <p className="text-sm text-slate-600">Metadata, source docs, connected accounts, and project controls.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-medium">General</h3>
        <p className="mt-2 text-sm text-slate-700">Update project summary, goal, and URLs.</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-medium">Connected Accounts</h3>
        <p className="mt-2 text-sm text-slate-700">GitHub: linked. Google: linked. Token Vault: optional.</p>
      </section>
    </div>
  );
}
