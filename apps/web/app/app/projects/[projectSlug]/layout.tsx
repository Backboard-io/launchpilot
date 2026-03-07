import { ReactNode } from "react";

import Link from "next/link";

import { ProjectFlowNav } from "@/components/project/project-flow-nav";

export default async function ProjectLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Project</p>
          <h1 className="text-2xl font-semibold capitalize">{projectSlug.replace(/-/g, " ")}</h1>
          <p className="text-sm text-slate-600">Follow the flow: research, positioning, execution, and approvals.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/projects" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            Back to Projects
          </Link>
          <Link href={`/app/projects/${projectSlug}/execution`} className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
            Run Next Action
          </Link>
        </div>
      </header>

      <ProjectFlowNav projectSlug={projectSlug} />
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={`/app/projects/${projectSlug}/memory`} className="rounded-md border border-slate-300 px-3 py-1.5">
          Memory
        </Link>
        <Link href={`/app/projects/${projectSlug}/settings`} className="rounded-md border border-slate-300 px-3 py-1.5">
          Settings
        </Link>
      </div>

      {children}
    </div>
  );
}
