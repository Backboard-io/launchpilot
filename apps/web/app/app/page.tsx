import Link from "next/link";

import { StatCard } from "@/components/ui/stat-card";

export default function AppHomePage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workspace Hub</h1>
          <p className="text-sm text-slate-600">Select a workspace to continue.</p>
        </div>
        <Link href="/app/select-workspace" className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
          Select Workspace
        </Link>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Active Projects" value={3} />
        <StatCard label="Pending Approvals" value={2} />
        <StatCard label="Assets Generated" value={12} />
      </div>
    </div>
  );
}
