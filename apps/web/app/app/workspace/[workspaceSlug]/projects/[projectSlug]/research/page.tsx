import Link from "next/link";

import { CompetitorTable } from "@/components/research/competitor-table";
import { PainPointMap } from "@/components/research/pain-point-map";
import { WedgeCard } from "@/components/research/wedge-card";

export default function ResearchPage({
  params
}: {
  params: { workspaceSlug: string; projectSlug: string };
}) {
  const { workspaceSlug, projectSlug } = params;

  const wedges = [
    { label: "Hackathon to first users", description: "Focus student founders", score: 0.84 },
    { label: "Approval-gated outbound", description: "Execution with trust", score: 0.77 }
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Research</h1>
          <p className="text-sm text-slate-600">Competitors, pain points, and opportunity wedges.</p>
        </div>
        <Link href={`/app/workspace/${workspaceSlug}/projects/${projectSlug}/positioning`} className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
          Continue to Positioning
        </Link>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium">Competitor Board</h2>
        <CompetitorTable
          rows={[
            { name: "Notion", positioning: "All in one workspace", pricing: "Freemium" },
            { name: "Linear", positioning: "Fast issue tracking", pricing: "Per-seat" }
          ]}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-medium">Pain Point Map</h2>
          <PainPointMap
            items={[
              { label: "No clear first audience", description: "Messaging too broad" },
              { label: "Execution uncertainty", description: "No structured launch workflow" }
            ]}
          />
        </section>
        <section>
          <h2 className="mb-2 text-sm font-medium">Opportunity Wedges</h2>
          <div className="space-y-2">
            {wedges.map((wedge) => (
              <WedgeCard key={wedge.label} wedge={wedge} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
