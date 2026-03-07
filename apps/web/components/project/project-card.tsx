import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";

export function ProjectCard({
  workspaceSlug,
  project
}: {
  workspaceSlug: string;
  project: { slug: string; name: string; stage: string; wedge?: string; approvals?: number };
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-medium text-slate-900">{project.name}</h3>
        <StatusBadge status={project.stage} />
      </div>
      <p className="mt-2 text-sm text-slate-600">Latest wedge: {project.wedge ?? "Not selected"}</p>
      <p className="text-sm text-slate-600">Pending approvals: {project.approvals ?? 0}</p>
      <Link
        href={`/app/workspace/${workspaceSlug}/projects/${project.slug}`}
        className="mt-4 inline-block rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white"
      >
        Open Project
      </Link>
    </div>
  );
}
