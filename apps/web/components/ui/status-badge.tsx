import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  running: "bg-sky-100 text-sky-900",
  succeeded: "bg-emerald-100 text-emerald-900",
  failed: "bg-rose-100 text-rose-900",
  active: "bg-indigo-100 text-indigo-900",
  selected: "bg-emerald-100 text-emerald-900",
  default: "bg-slate-100 text-slate-800"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", styles[status] ?? styles.default)}>
      {status}
    </span>
  );
}
