export function PricingDirectionCard({ value }: { value?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-medium">Pricing Direction</h3>
      <p className="mt-2 text-sm text-slate-700">{value ?? "Not selected"}</p>
    </div>
  );
}
