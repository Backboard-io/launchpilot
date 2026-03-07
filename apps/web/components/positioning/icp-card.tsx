export function IcpCard({ icp, selected }: { icp: string; selected?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${selected ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"}`}>
      <p className="text-sm font-medium">{icp}</p>
    </div>
  );
}
