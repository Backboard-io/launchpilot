import Link from "next/link";

import { ProjectCard } from "@/components/project/project-card";
import { StatCard } from "@/components/ui/stat-card";

export default function WorkspaceDashboardPage({
  params
}: {
  params: { workspaceSlug: string };
}) {
  const { workspaceSlug } = params;

  const projects = [
    { slug: "growth-launchpad", name: "Growth Launchpad", stage: "active", wedge: "Hackathon to first users", approvals: 1 },
    { slug: "docs-agent", name: "Docs Agent", stage: "idea", approvals: 0 }
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workspace: {workspaceSlug}</h1>
          <p className="text-sm text-slate-600">Projects and activity for this organization.</p>
        </div>
        <Link href={`/app/workspace/${workspaceSlug}/projects/new`} className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
          Create Project
        </Link>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Pending Approvals" value={1} />
        <StatCard label="Recent Actions" value={8} />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} workspaceSlug={workspaceSlug} project={project} />
        ))}
      </section>
    </div>
  );
}
