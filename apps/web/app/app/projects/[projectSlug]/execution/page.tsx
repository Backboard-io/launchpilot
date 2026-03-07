import Link from "next/link";

import { ActionQueue } from "@/components/execution/action-queue";
import { AssetCard } from "@/components/execution/asset-card";
import { OutreachTable } from "@/components/execution/outreach-table";
import { PlanBoard } from "@/components/execution/plan-board";

export default async function ExecutionPage({
  params
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;

  const tasks = Array.from({ length: 7 }, (_, idx) => ({ day_number: idx + 1, title: `Launch task ${idx + 1}` }));

  return (
    <div className="space-y-6">
      <header className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">Execution</h2>
          <p className="text-sm text-slate-600">Run this section in order. Primary actions are highlighted below.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <button className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white">Generate Assets</button>
          <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">Prepare Outreach Batch</button>
          <Link href={`/app/projects/${projectSlug}/approvals`} className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium">
            Review Approvals
          </Link>
        </div>
      </header>

      <section>
        <h3 className="mb-2 text-sm font-medium">7-Day Plan</h3>
        <PlanBoard tasks={tasks} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">Generated Assets</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <AssetCard asset={{ title: "Landing copy v1", asset_type: "landing_copy", status: "draft" }} />
          <AssetCard asset={{ title: "Email sequence v1", asset_type: "email_copy", status: "draft" }} />
          <AssetCard asset={{ title: "Image ad angle A", asset_type: "image_ad", status: "draft" }} />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">Outreach Drafts</h3>
        <OutreachTable
          rows={[
            { name: "Ari", email: "ari@example.com", segment: "student", status: "draft" },
            { name: "Mina", email: "mina@example.com", segment: "indie", status: "draft" }
          ]}
        />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">Action Queue</h3>
        <ActionQueue
          items={[
            { title: "Send email batch #1", status: "pending", reason: "Requires execution:send scope" },
            { title: "Promote image ad", status: "pending", reason: "Requires review before publish" }
          ]}
        />
      </section>
    </div>
  );
}
