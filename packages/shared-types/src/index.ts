export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export interface ApprovalItem {
  id: string;
  action_type: string;
  status: "pending" | "approved" | "rejected";
  required_scope?: string;
}
