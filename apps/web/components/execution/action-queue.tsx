import { StatusBadge } from "@/components/ui/status-badge";

export function ActionQueue({ items }: { items: { title: string; status: string; reason?: string }[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{item.title}</p>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-xs text-slate-600">{item.reason}</p>
        </div>
      ))}
    </div>
  );
}
