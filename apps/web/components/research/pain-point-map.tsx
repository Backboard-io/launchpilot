export function PainPointMap({ items }: { items: { label: string; description?: string }[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium">{item.label}</p>
          <p className="text-xs text-slate-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
