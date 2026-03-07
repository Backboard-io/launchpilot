import Link from "next/link";

import { MemoryHighlightsCard } from "@/components/project/memory-highlights-card";
import { SourceDocsCard } from "@/components/project/source-docs-card";

export default async function ProjectOverviewPage({
  params
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Start Here</h2>
          <p className="mt-2 text-sm text-slate-600">Use these primary actions to move the project forward in order.</p>
          <div className="mt-4 grid gap-2">
            <Link href={`/app/projects/${projectSlug}/research`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">
              1. Run Research
            </Link>
            <Link href={`/app/projects/${projectSlug}/positioning`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">
              2. Choose Positioning
            </Link>
            <Link href={`/app/projects/${projectSlug}/execution`} className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white">
              3. Generate Launch Actions
            </Link>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Current Status</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Stage: Positioning selected</li>
            <li>Pending approvals: 1</li>
            <li>Recent activity: Email batch prepared</li>
          </ul>
        </article>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <MemoryHighlightsCard
          items={[
            { key: "Selected ICP", value: "CS students launching portfolio tools" },
            { key: "Preferred channel", value: "Email outreach" }
          ]}
        />
        <SourceDocsCard docs={[{ title: "Initial brief", type: "manual_note" }, { title: "Landing page", type: "website" }]} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium">Recent Timeline</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          <li>Project bootstrapped</li>
          <li>Research run completed</li>
          <li>Positioning version selected</li>
        </ul>
      </section>
    </div>
  );
}
