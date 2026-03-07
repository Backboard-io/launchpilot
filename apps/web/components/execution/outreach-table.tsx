import { DataTable } from "@/components/ui/data-table";

export function OutreachTable({ rows }: { rows: { name?: string; email?: string; segment?: string; status?: string }[] }) {
  return (
    <DataTable
      headers={["Name", "Email", "Segment", "Status"]}
      rows={rows.map((row) => [row.name ?? "-", row.email ?? "-", row.segment ?? "-", row.status ?? "draft"])}
    />
  );
}
