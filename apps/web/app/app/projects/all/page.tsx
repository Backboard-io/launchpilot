import Link from "next/link";

import { ProjectCard } from "@/components/project/project-card";
import { serverApiFetch } from "@/lib/api";

interface Project {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  summary: string | null;
  stage: string;
  goal: string | null;
  status: string;
}

export default async function AllProjectsPage() {
  const projects = (await serverApiFetch<Project[]>("/projects")) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/app/projects"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge-subtle bg-surface-muted text-fg-muted transition-colors hover:border-edge-muted hover:text-fg-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-fg-primary">All Projects</h1>
            <p className="mt-1 text-sm text-fg-muted">{projects.length} projects total</p>
          </div>
        </div>
        <Link
          href="/app/projects/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Project
        </Link>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-edge-subtle bg-surface-muted p-8 text-center">
          <p className="text-fg-muted">No projects yet. Create your first project to get started.</p>
          <Link
            href="/app/projects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger">
          {projects.map((project, index) => (
            <div key={project.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <ProjectCard
                project={{
                  slug: project.slug,
                  name: project.name,
                  stage: project.stage,
                  wedge: project.summary ?? project.goal ?? "No description",
                  approvals: 0
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
