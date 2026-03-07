import Link from "next/link";

import { ActionQueue } from "@/components/execution/action-queue";
import { AssetCard } from "@/components/execution/asset-card";
import { OutreachTable } from "@/components/execution/outreach-table";
import { PlanBoard } from "@/components/execution/plan-board";

export default function ExecutionPage({
  params
}: {
  params: { workspaceSlug: string; projectSlug: string };
}) {
  const { workspaceSlug, projectSlug } = params;

  const tasks = Array.from({ length: 7 }, (_, idx) => ({ day_number: idx + 1, title: `Launch task ${idx + 1}` }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Execution Workspace</h1>
          <p className="text-sm text-slate-600">Launch plan, assets, outreach drafts, and approval queue.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/workspace/${workspaceSlug}/projects/${projectSlug}/approvals`} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            Open Approvals
          </Link>
          <button className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">Generate Assets</button>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-medium">Plan</h2>
        <PlanBoard tasks={tasks} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Assets</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <AssetCard asset={{ title: "Landing copy v1", asset_type: "landing_copy", status: "draft" }} />
          <AssetCard asset={{ title: "Email sequence v1", asset_type: "email_copy", status: "draft" }} />
          <AssetCard asset={{ title: "Image ad angle A", asset_type: "image_ad", status: "draft" }} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Outreach</h2>
        <OutreachTable
          rows={[
            { name: "Ari", email: "ari@example.com", segment: "student", status: "draft" },
            { name: "Mina", email: "mina@example.com", segment: "indie", status: "draft" }
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Action Queue</h2>
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
