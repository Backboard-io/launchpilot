export function MemoryHighlightsCard({ items }: { items: { key: string; value: string }[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium">Memory Highlights</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item.key} className="rounded-md border border-slate-100 p-2">
            <p className="font-medium">{item.key}</p>
            <p className="text-xs text-slate-600">{item.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
