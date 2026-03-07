import { ApprovalCard } from "@/components/execution/approval-card";
import { serverApiFetch } from "@/lib/api";

interface Project {
  id: string;
  slug: string;
}

interface Approval {
  id: string;
  action_type: string;
  status: string;
  resource_type?: string;
  resource_id?: string;
  created_at: string;
}

export default async function ApprovalsPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params;

  // Fetch project to get ID
  const projects = (await serverApiFetch<Project[]>("/projects")) ?? [];
  const project = projects.find((p) => p.slug === projectSlug);

  // Fetch approvals for this project
  const approvals = project ? ((await serverApiFetch<Approval[]>(`/projects/${project.id}/approvals`)) ?? []) : [];

  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-xl font-bold text-fg-primary">Approvals</h2>
        <p className="mt-1 text-sm text-fg-muted">Sensitive actions require explicit approval and step-up auth.</p>
      </header>

      {pendingApprovals.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
              <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-400">Step-up authentication required</p>
              <p className="mt-1 text-sm text-fg-muted">
                {pendingApprovals.length} action{pendingApprovals.length > 1 ? "s" : ""} below require
                {pendingApprovals.length === 1 ? "s" : ""} additional verification before execution.
              </p>
            </div>
          </div>
        </div>
      )}

      {approvals.length === 0 ? (
        <div className="rounded-xl border border-edge-subtle bg-surface-muted p-8 text-center">
          <p className="text-fg-muted">No approvals required yet.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {approvals.map((approval, idx) => (
            <div
              key={approval.id}
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 75}ms` }}
            >
              <ApprovalCard
                approval={{
                  action_type: approval.action_type,
                  status: approval.status,
                  reason: approval.resource_type
                    ? `${approval.action_type} for ${approval.resource_type}`
                    : approval.action_type,
                  required_scope: `${approval.action_type}:execute`
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
