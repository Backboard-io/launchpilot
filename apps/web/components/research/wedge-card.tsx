export function WedgeCard({
  wedge,
  onUse
}: {
  wedge: { label: string; description?: string; score?: number };
  onUse?: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-sm font-medium">{wedge.label}</p>
      <p className="mt-1 text-xs text-slate-600">{wedge.description}</p>
      <p className="mt-1 text-xs text-slate-500">Score: {wedge.score ?? 0}</p>
      <button onClick={onUse} className="mt-2 rounded-md bg-brand-600 px-2 py-1 text-xs text-white">
        Use for Positioning
      </button>
    </div>
  );
}
