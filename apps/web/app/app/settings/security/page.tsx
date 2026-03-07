import { StatCard } from "@/components/ui/stat-card";

export default function SecurityCenterPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Security Center</h1>
        <p className="text-sm text-slate-600">Auth0 session state, linked accounts, and sensitive action history.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Current Role" value="owner" />
        <StatCard label="MFA Status" value="enabled" />
        <StatCard label="Last Step-up" value="Today" />
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium">Linked Accounts</h2>
          <ul className="mt-2 text-sm text-slate-700">
            <li>GitHub: linked</li>
            <li>Google: linked</li>
            <li>Passkey: enrolled</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium">Recent Sensitive Actions</h2>
          <ul className="mt-2 text-sm text-slate-700">
            <li>Approved send batch #42</li>
            <li>Requested connector link</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
