import { DataTable } from "@/components/ui/data-table";

export function CompetitorTable({ rows }: { rows: { name: string; positioning?: string; pricing?: string }[] }) {
  return (
    <DataTable
      headers={["Name", "Positioning", "Pricing"]}
      rows={rows.map((row) => [row.name, row.positioning ?? "-", row.pricing ?? "-"])}
    />
  );
}
