import { serverApiFetch } from "@/lib/api";

interface MemoryEntry {
  id: string;
  memory_key: string;
  memory_value: Record<string, unknown>;
  memory_type: string;
  source: string;
}

interface Project {
  id: string;
  slug: string;
}

export default async function MemoryPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params;

  // First get project to get its ID
  const projects = (await serverApiFetch<Project[]>("/projects")) ?? [];
  const project = projects.find((p) => p.slug === projectSlug);

  const memory = project ? ((await serverApiFetch<MemoryEntry[]>(`/projects/${project.id}/memory`)) ?? []) : [];

  // Group memory by type
  const decisions = memory.filter((m) => m.memory_type === "decision");
  const preferences = memory.filter((m) => m.memory_type === "preference");
  const objections = memory.filter((m) => m.memory_type === "objection");
  const other = memory.filter((m) => !["decision", "preference", "objection"].includes(m.memory_type));

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-fg-primary">Project Memory</h2>
        <p className="text-sm text-fg-secondary">Persisted decisions, preferences, hooks, and rejected directions.</p>
      </header>

      {memory.length === 0 ? (
        <div className="rounded-xl border border-edge-subtle bg-surface-muted p-8 text-center">
          <p className="text-fg-muted">No memory entries yet. Memory will be saved as you work on the project.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {decisions.length > 0 && (
            <section className="rounded-lg border border-edge-subtle bg-surface-elevated p-4">
              <h3 className="text-sm font-medium text-fg-primary">Decisions</h3>
              <ul className="mt-2 space-y-1 text-sm text-fg-secondary">
                {decisions.map((entry) => (
                  <li key={entry.id}>
                    {entry.memory_key}: {JSON.stringify(entry.memory_value)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {preferences.length > 0 && (
            <section className="rounded-lg border border-edge-subtle bg-surface-elevated p-4">
              <h3 className="text-sm font-medium text-fg-primary">Preferences</h3>
              <ul className="mt-2 space-y-1 text-sm text-fg-secondary">
                {preferences.map((entry) => (
                  <li key={entry.id}>
                    {entry.memory_key}: {JSON.stringify(entry.memory_value)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {objections.length > 0 && (
            <section className="rounded-lg border border-edge-subtle bg-surface-elevated p-4">
              <h3 className="text-sm font-medium text-fg-primary">Objections</h3>
              <ul className="mt-2 space-y-1 text-sm text-fg-secondary">
                {objections.map((entry) => (
                  <li key={entry.id}>
                    {entry.memory_key}: {JSON.stringify(entry.memory_value)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {other.length > 0 && (
            <section className="rounded-lg border border-edge-subtle bg-surface-elevated p-4">
              <h3 className="text-sm font-medium text-fg-primary">Other</h3>
              <ul className="mt-2 space-y-1 text-sm text-fg-secondary">
                {other.map((entry) => (
                  <li key={entry.id}>
                    <span className="text-fg-muted">[{entry.memory_type}]</span> {entry.memory_key}:{" "}
                    {JSON.stringify(entry.memory_value)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
