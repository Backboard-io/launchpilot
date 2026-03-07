import Link from "next/link";

import { ProjectCard } from "@/components/project/project-card";
import { StatCard } from "@/components/ui/stat-card";

const projects = [
  {
    slug: "growth-launchpad",
    name: "Growth Launchpad",
    stage: "active",
    wedge: "Hackathon to first users",
    approvals: 1
  },
  {
    slug: "docs-agent",
    name: "Docs Agent",
    stage: "idea",
    wedge: "Ship answers from your docs faster",
    approvals: 0
  }
];

const actions = [
  {
    title: "Create a new project",
    description: "Start from brief to launch flow in under 2 minutes.",
    href: "/app/projects/new",
    cta: "Create Project"
  },
  {
    title: "Resume execution",
    description: "Jump into assets, outreach, and approvals instantly.",
    href: "/app/projects/growth-launchpad/execution",
    cta: "Open Execution"
  },
  {
    title: "Review approvals",
    description: "Approve sensitive actions before they are executed.",
    href: "/app/projects/growth-launchpad/approvals",
    cta: "Open Approvals"
  }
];

export default function ProjectsDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projects Dashboard</h1>
          <p className="text-sm text-slate-600">Everything is organized by project and stage. No workspace switching.</p>
        </div>
        <Link href="/app/projects/new" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          New Project
        </Link>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Active Projects" value={projects.length} />
        <StatCard label="Pending Approvals" value={1} />
        <StatCard label="Actions This Week" value={8} />
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <article key={action.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">{action.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{action.description}</p>
            <Link
              href={action.href}
              className="mt-4 inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700"
            >
              {action.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </section>
    </div>
  );
}
