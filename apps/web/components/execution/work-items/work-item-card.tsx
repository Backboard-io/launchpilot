"use client";

import { useDraggable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

import type { Task } from "../plans/plan-view";

export interface WorkItemCardProps {
  task: Task;
  currentUserId: string | null;
  isDragging?: boolean;
  onTaskClick: (task: Task) => void;
  onTaskAssign: (taskId: string, assigneeId: string | null) => void;
}

function CardContent({
  task,
  currentUserId,
  isDone,
  isAssignedToMe,
  onTaskClick,
  onTaskAssign,
  isOverlay = false
}: {
  task: Task;
  currentUserId: string | null;
  isDone: boolean;
  isAssignedToMe: boolean;
  onTaskClick: (task: Task) => void;
  onTaskAssign: (taskId: string, assigneeId: string | null) => void;
  isOverlay?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium leading-snug text-fg-primary",
              isDone && "line-through text-fg-muted"
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-fg-muted">
              {task.description}
            </p>
          )}
        </div>
        {task.day_number != null && (
          <span className="flex-shrink-0 rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-fg-muted">
            Day {task.day_number}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {isAssignedToMe && !isOverlay && (
          <>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              Me
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTaskAssign(task.id, null);
              }}
              className="rounded-full border border-edge-subtle px-2 py-0.5 text-xs text-fg-muted hover:border-edge-muted hover:text-fg-secondary"
            >
              Unassign
            </button>
          </>
        )}
        {isAssignedToMe && isOverlay && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
            Me
          </span>
        )}
        {!task.assignee_id && !isOverlay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTaskAssign(task.id, currentUserId);
            }}
            className="rounded-full border border-dashed border-edge-subtle px-2 py-0.5 text-xs text-fg-muted hover:border-accent hover:text-accent"
          >
            Assign to me
          </button>
        )}
      </div>
    </>
  );
}

export function WorkItemCard({
  task,
  currentUserId,
  isDragging = false,
  onTaskClick,
  onTaskAssign
}: WorkItemCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task }
  });

  const isDone = task.status === "completed" || task.status === "succeeded";
  const isAssignedToMe = !!currentUserId && task.assignee_id === currentUserId;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onTaskClick(task)}
      className={cn(
        "cursor-grab rounded-xl border bg-surface-elevated p-3 transition-all active:cursor-grabbing",
        "hover:border-edge-muted hover:shadow-md",
        isDone && "border-emerald-500/20 bg-emerald-500/5",
        isDragging && "cursor-grabbing opacity-90 shadow-lg"
      )}
    >
      <CardContent
        task={task}
        currentUserId={currentUserId}
        isDone={isDone}
        isAssignedToMe={isAssignedToMe}
        onTaskClick={onTaskClick}
        onTaskAssign={onTaskAssign}
        isOverlay={false}
      />
    </div>
  );
}

export function WorkItemCardOverlay({ task }: { task: Task }) {
  const isDone = task.status === "completed" || task.status === "succeeded";
  const isAssignedToMe = !!task.assignee_id;
  return (
    <div className="w-full rounded-xl border-2 border-accent/50 bg-surface-elevated p-3 shadow-xl">
      <CardContent
        task={task}
        currentUserId={null}
        isDone={isDone}
        isAssignedToMe={isAssignedToMe}
        onTaskClick={() => {}}
        onTaskAssign={() => {}}
        isOverlay
      />
    </div>
  );
}
