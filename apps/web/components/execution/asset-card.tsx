import { StatusBadge } from "@/components/ui/status-badge";

export function AssetCard({ asset }: { asset: { title?: string; asset_type: string; status: string } }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{asset.title ?? asset.asset_type}</p>
        <StatusBadge status={asset.status} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{asset.asset_type}</p>
    </div>
  );
}
