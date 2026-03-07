export function PositioningPreview({
  headline,
  subheadline,
  statement,
  benefits
}: {
  headline?: string;
  subheadline?: string;
  statement?: string;
  benefits?: string[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Positioning Preview</p>
      <h3 className="mt-2 text-xl font-semibold">{headline ?? "No headline yet"}</h3>
      <p className="mt-1 text-sm text-slate-600">{subheadline}</p>
      <p className="mt-3 text-sm text-slate-700">{statement}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {(benefits ?? []).map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>
    </div>
  );
}
