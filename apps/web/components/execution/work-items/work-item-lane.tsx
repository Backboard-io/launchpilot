"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

import type { Task } from "../plans/plan-view";
import { WorkItemCard } from "./work-item-card";

export type LaneId = "todo" | "in_progress" | "done";

export interface WorkItemLaneProps {
  id: LaneId;
  label: string;
  description: string;
  tasks: Task[];
  currentUserId: string | null;
  onTaskClick: (task: Task) => void;
  onTaskAssign: (taskId: string, assigneeId: string | null) => Promise<void>;
  style?: React.CSSProperties;
}

export function WorkItemLane({
  id,
  label,
  description,
  tasks,
  currentUserId,
  onTaskClick,
  onTaskAssign,
  style
}: WorkItemLaneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex w-72 flex-shrink-0 flex-col rounded-xl border-2 bg-surface-muted/50 transition-colors animate-slide-up",
        isOver ? "border-accent/60 bg-accent/5" : "border-edge-subtle"
      )}
    >
      <div className="flex items-center justify-between border-b border-edge-subtle px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-fg-primary">{label}</h3>
          <p className="text-xs text-fg-muted">{description}</p>
        </div>
        <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-surface-elevated px-2 text-xs font-medium text-fg-secondary">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-edge-subtle bg-surface-subtle/30 py-8 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated">
              <svg
                className="h-5 w-5 text-fg-faint"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <p className="text-xs font-medium text-fg-muted">Drop here</p>
            <p className="mt-0.5 text-xs text-fg-faint">or add from plan</p>
          </div>
        ) : (
          tasks.map((task) => (
            <WorkItemCard
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              onTaskClick={onTaskClick}
              onTaskAssign={onTaskAssign}
            />
          ))
        )}
      </div>
    </div>
  );
}
