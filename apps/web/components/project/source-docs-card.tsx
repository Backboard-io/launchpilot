export function SourceDocsCard({ docs }: { docs: { title: string; type: string; url?: string }[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium">Source Documents</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {docs.map((doc) => (
          <li key={`${doc.title}-${doc.type}`} className="rounded-md border border-slate-100 p-2">
            <p className="font-medium">{doc.title}</p>
            <p className="text-xs text-slate-500">{doc.type}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
