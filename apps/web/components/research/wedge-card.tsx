import { cn } from "@/lib/utils";

interface WedgeCardProps {
  wedge: {
    label: string;
    description?: string;
    score?: number;
  };
  rank: number;
  onUse?: () => void;
  selected?: boolean;
}

export function WedgeCard({ wedge, rank, onUse, selected }: WedgeCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border p-4 transition-all duration-200",
        selected
          ? "border-accent bg-accent-subtle shadow-lg shadow-accent/10"
          : "border-edge-subtle bg-surface-muted hover:border-edge-muted"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-fg-primary">{wedge.label}</p>
          {wedge.description && (
            <p className="mt-1 text-sm text-fg-muted">{wedge.description}</p>
          )}
        </div>

        {/* Rank badge */}
        <div className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
          <span className="font-mono text-sm font-bold text-accent">#{rank}</span>
        </div>
      </div>

      {onUse && (
        <button
          onClick={onUse}
          className="mt-4 w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white opacity-0 transition-all hover:bg-accent-hover group-hover:opacity-100"
        >
          Use for Positioning
        </button>
      )}
    </div>
  );
}
