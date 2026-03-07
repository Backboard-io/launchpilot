import Link from "next/link";

import { MemoryHighlightsCard } from "@/components/project/memory-highlights-card";
import { SourceDocsCard } from "@/components/project/source-docs-card";
import { serverApiFetch } from "@/lib/api";

interface Project {
  id: string;
  slug: string;
  name: string;
  stage: string;
  summary: string | null;
  goal: string | null;
  status: string;
}

interface MemoryEntry {
  id: string;
  memory_key: string;
  memory_value: Record<string, unknown>;
  memory_type: string;
}

interface ActivityEvent {
  id: string;
  verb: string;
  object_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ProjectSource {
  id: string;
  source_type: string;
  title: string | null;
  url: string | null;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params;

  // Fetch project data
  const projects = (await serverApiFetch<Project[]>("/projects")) ?? [];
  const project = projects.find((p) => p.slug === projectSlug);

  // Fetch related data if project exists
  const [memory, activity] = project
    ? await Promise.all([
        serverApiFetch<MemoryEntry[]>(`/projects/${project.id}/memory`),
        serverApiFetch<ActivityEvent[]>(`/projects/${project.id}/activity`)
      ])
    : [null, null];

  // Sources endpoint doesn't have a GET yet, so we'll show empty for now
  const sources: ProjectSource[] = [];

  // Determine step completion based on stage
  const stageOrder = ["idea", "research", "positioning", "execution", "completed"];
  const currentStageIndex = stageOrder.indexOf(project?.stage ?? "idea");

  const steps = [
    {
      number: "1",
      label: "Run Research",
      href: `/app/projects/${projectSlug}/research`,
      completed: currentStageIndex > 0,
      primary: currentStageIndex === 0
    },
    {
      number: "2",
      label: "Choose Positioning",
      href: `/app/projects/${projectSlug}/positioning`,
      completed: currentStageIndex > 1,
      primary: currentStageIndex === 1
    },
    {
      number: "3",
      label: "Generate Launch Actions",
      href: `/app/projects/${projectSlug}/execution`,
      completed: currentStageIndex > 2,
      primary: currentStageIndex === 2 || currentStageIndex === 3
    }
  ];

  // Format memory highlights
  const memoryHighlights =
    memory
      ?.slice(0, 4)
      .map((m) => ({
        key: m.memory_key,
        value: typeof m.memory_value === "string" ? m.memory_value : JSON.stringify(m.memory_value)
      })) ?? [];

  // Format source docs (sources endpoint not yet implemented)
  const sourceDocs = sources.map((s) => ({
    title: s.title ?? s.url ?? "Untitled",
    type: s.source_type
  }));

  // Format timeline from activity
  const timeline =
    activity?.slice(0, 5).map((a) => ({
      text: `${a.verb}${a.object_type ? ` ${a.object_type}` : ""}`,
      time: formatTimeAgo(a.created_at)
    })) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-edge-subtle bg-surface-muted p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-fg-primary">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Here
          </h2>
          <p className="mt-2 text-sm text-fg-muted">Use these primary actions to move the project forward in order.</p>
          <div className="mt-4 space-y-2">
            {steps.map((step, index) => (
              <Link
                key={step.number}
                href={step.href}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 animate-slide-up ${
                  step.primary
                    ? "border-accent bg-accent text-white shadow-lg shadow-accent/25 hover:bg-accent-hover"
                    : step.completed
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                      : "border-edge-subtle bg-surface-elevated text-fg-secondary hover:border-edge-muted hover:text-fg-primary"
                }`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs ${
                    step.completed ? "bg-emerald-500/20" : step.primary ? "bg-white/20" : "bg-surface-elevated"
                  }`}
                >
                  {step.completed ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </span>
                {step.label}
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-edge-subtle bg-surface-muted p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-fg-primary">
            <svg className="h-4 w-4 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Current Status
          </h2>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between rounded-lg border border-edge-subtle bg-surface-elevated px-3 py-2">
              <span className="text-sm text-fg-muted">Stage</span>
              <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium capitalize text-accent">
                {project?.stage ?? "Unknown"}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-edge-subtle bg-surface-elevated px-3 py-2">
              <span className="text-sm text-fg-muted">Status</span>
              <span className="text-sm capitalize text-fg-secondary">{project?.status ?? "Unknown"}</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-edge-subtle bg-surface-elevated px-3 py-2">
              <span className="text-sm text-fg-muted">Memory items</span>
              <span className="font-mono text-sm font-semibold text-fg-secondary">{memory?.length ?? 0}</span>
            </li>
          </ul>
        </article>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <MemoryHighlightsCard items={memoryHighlights} />
        <SourceDocsCard docs={sourceDocs} />
      </div>

      <section className="rounded-xl border border-edge-subtle bg-surface-muted p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg-primary">
          <svg className="h-4 w-4 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Recent Timeline
        </h2>
        <div className="relative mt-4">
          {timeline.length === 0 ? (
            <p className="text-sm text-fg-muted">No activity yet.</p>
          ) : (
            <>
              <div className="absolute bottom-4 left-[11px] top-0 w-0.5 bg-edge-subtle" />
              <ul className="space-y-4">
                {timeline.map((item, index) => (
                  <li
                    key={`${item.text}-${index}`}
                    className="relative flex gap-4 animate-slide-up"
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-surface-muted">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm capitalize text-fg-secondary">{item.text}</p>
                      <p className="mt-0.5 text-xs text-fg-faint">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
