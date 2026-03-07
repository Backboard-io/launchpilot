import Link from "next/link";

import { MemoryHighlightsCard } from "@/components/project/memory-highlights-card";
import { SourceDocsCard } from "@/components/project/source-docs-card";

export default function ProjectOverviewPage({
  params
}: {
  params: { workspaceSlug: string; projectSlug: string };
}) {
  const { workspaceSlug, projectSlug } = params;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{projectSlug}</h1>
          <p className="text-sm text-slate-600">Project home with stage, assets, and timeline.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/workspace/${workspaceSlug}/projects/${projectSlug}/research`} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            Run Research
          </Link>
          <Link href={`/app/workspace/${workspaceSlug}/projects/${projectSlug}/execution`} className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
            Run Next Step
          </Link>
        </div>
      </header>

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
        <h2 className="text-sm font-medium">Timeline</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          <li>Project bootstrapped</li>
          <li>Research run completed</li>
          <li>Positioning version selected</li>
        </ul>
      </section>
    </div>
  );
}
