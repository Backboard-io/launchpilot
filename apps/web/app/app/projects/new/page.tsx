"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { env } from "@/lib/env";

type WorkspaceRef = { id: string; slug: string };

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [goal, setGoal] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`${env.apiBaseUrl}/workspaces`, { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const workspaces = (payload.data ?? []) as WorkspaceRef[];
        if (workspaces.length > 0) {
          setWorkspaceId(workspaces[0].id);
        }
      } catch {
        // no-op
      }
    };

    void run();
  }, []);

  return (
    <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Create Project</h1>
        <p className="mb-4 text-sm text-slate-600">Start by naming the project and writing a clear launch goal.</p>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);

            if (!workspaceId) {
              setError("Account setup is incomplete. Run account sync, then try again.");
              return;
            }

            setSubmitting(true);
            try {
              const response = await fetch(`${env.apiBaseUrl}/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  workspace_id: workspaceId,
                  name,
                  summary,
                  goal
                })
              });

              if (!response.ok) {
                setError("Project creation failed.");
                return;
              }

              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
              router.push(`/app/projects/${slug}`);
            } catch {
              setError("Project creation failed.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <label className="block text-sm">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" required />
          </label>
          <label className="block text-sm">
            Summary
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 h-20 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            Goal
            <input value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button disabled={submitting} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {submitting ? "Creating..." : "Create and Start"}
          </button>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </form>
      </section>

      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium">What happens next</h2>
        <ol className="mt-2 space-y-2 text-sm text-slate-700">
          <li>1. Research is run against your project context.</li>
          <li>2. You choose positioning direction.</li>
          <li>3. Execution plan and assets are generated.</li>
          <li>4. Sensitive actions are gated behind approvals.</li>
        </ol>
      </aside>
    </div>
  );
}
