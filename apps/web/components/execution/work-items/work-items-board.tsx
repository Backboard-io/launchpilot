"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import type { Task } from "../plans/plan-view";
import { WorkItemCard, WorkItemCardOverlay } from "./work-item-card";
import { WorkItemLane } from "./work-item-lane";

export type AssigneeFilter = "all" | "unassigned" | "me";

const LANE_IDS = ["todo", "in_progress", "done"] as const;
type LaneId = (typeof LANE_IDS)[number];

function statusToLane(status: string | undefined): LaneId {
  const s = (status || "todo").toLowerCase();
  if (s === "in_progress") return "in_progress";
  if (s === "completed" || s === "succeeded") return "done";
  return "todo";
}

function laneToStatus(laneId: LaneId): string {
  if (laneId === "in_progress") return "in_progress";
  if (laneId === "done") return "completed";
  return "todo";
}

const LANE_META: Record<LaneId, { label: string; description: string }> = {
  todo: { label: "To do", description: "Not started" },
  in_progress: { label: "In progress", description: "In progress" },
  done: { label: "Done", description: "Completed" }
};

export interface WorkItemsBoardProps {
  tasks: Task[];
  currentUserId: string | null;
  assigneeFilter: AssigneeFilter;
  onAssigneeFilterChange: (filter: AssigneeFilter) => void;
  onTaskClick: (task: Task) => void;
  onTaskStatusChange: (taskId: string, status: string) => Promise<void>;
  onTaskAssign: (taskId: string, assigneeId: string | null) => Promise<void>;
}

export function WorkItemsBoard({
  tasks,
  currentUserId,
  assigneeFilter,
  onAssigneeFilterChange,
  onTaskClick,
  onTaskStatusChange,
  onTaskAssign
}: WorkItemsBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    if (assigneeFilter === "all") return tasks;
    if (assigneeFilter === "unassigned") return tasks.filter((t) => !t.assignee_id);
    if (assigneeFilter === "me" && currentUserId) return tasks.filter((t) => t.assignee_id === currentUserId);
    return tasks;
  }, [tasks, assigneeFilter, currentUserId]);

  const tasksByLane = useMemo(() => {
    const map: Record<LaneId, Task[]> = { todo: [], in_progress: [], done: [] };
    filteredTasks.forEach((task) => {
      const lane = statusToLane(task.status);
      map[lane].push(task);
    });
    return map;
  }, [filteredTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const taskId = event.active.id as string;
      const overId = event.over?.id;
      if (!overId || typeof overId !== "string") return;
      const laneId = LANE_IDS.find((l) => l === overId);
      if (!laneId) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const newStatus = laneToStatus(laneId);
      if (newStatus === (task.status || "todo")) return;
      await onTaskStatusChange(taskId, newStatus);
    },
    [tasks, onTaskStatusChange]
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar: title + assignee filter */}
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-edge-subtle bg-surface-subtle/30 px-4 py-3">
        <h2 className="text-lg font-semibold text-fg-primary">Work items</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Assignee</span>
          <select
            value={assigneeFilter}
            onChange={(e) => onAssigneeFilterChange(e.target.value as AssigneeFilter)}
            className="rounded-lg border border-edge-subtle bg-surface-elevated px-3 py-1.5 text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="all">All</option>
            <option value="unassigned">Unassigned</option>
            <option value="me">Me</option>
          </select>
        </div>
      </div>

      {/* Board */}
      <div className="min-h-0 flex-1 overflow-x-auto p-4">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex h-full gap-4" style={{ minWidth: "max-content" }}>
            {LANE_IDS.map((laneId, idx) => (
              <WorkItemLane
                key={laneId}
                id={laneId}
                label={LANE_META[laneId].label}
                description={LANE_META[laneId].description}
                tasks={tasksByLane[laneId]}
                onTaskClick={onTaskClick}
                onTaskAssign={onTaskAssign}
                currentUserId={currentUserId}
                style={{ animationDelay: `${idx * 50}ms` }}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="w-72 rounded-xl ring-4 ring-accent/10">
                <WorkItemCardOverlay task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
