import { ApprovalCard } from "@/components/execution/approval-card";

export default function ApprovalsPage() {
  const approvals = [
    {
      action_type: "send_email_batch",
      status: "pending",
      reason: "Send first 10 contacts",
      required_scope: "execution:send"
    },
    {
      action_type: "publish_asset",
      status: "approved",
      reason: "Select image ad for launch",
      required_scope: "creative:publish"
    }
  ];

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Approvals</h2>
        <p className="text-sm text-slate-600">Sensitive actions require explicit approval and step-up auth.</p>
      </header>
      {approvals.map((approval, idx) => (
        <ApprovalCard key={`${approval.action_type}-${idx}`} approval={approval} />
      ))}
    </div>
  );
}
