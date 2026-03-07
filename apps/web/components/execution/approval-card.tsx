import { StatusBadge } from "@/components/ui/status-badge";

export function ApprovalCard({ approval }: { approval: { action_type: string; status: string; reason?: string; required_scope?: string } }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{approval.action_type}</p>
        <StatusBadge status={approval.status} />
      </div>
      <p className="mt-1 text-xs text-slate-600">{approval.reason}</p>
      <p className="mt-1 text-xs text-slate-500">Required scope: {approval.required_scope ?? "-"}</p>
    </div>
  );
}
