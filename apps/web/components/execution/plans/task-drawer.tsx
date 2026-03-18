"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DetailDrawer,
  DrawerButton,
  DrawerField,
  DrawerInput,
  DrawerSelect,
  DrawerTextarea
} from "@/components/ui/detail-drawer";
import { Task, TaskCategory, TASK_CATEGORY_OPTIONS } from "./plan-view";

type TaskUpdates = Partial<Task> & { evidence_verified?: boolean };

interface TaskDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: TaskUpdates) => Promise<void>;
  onToggleComplete: (taskId: string) => Promise<void>;
}

export function TaskDrawer({ task, isOpen, onClose, onSave, onToggleComplete }: TaskDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<number>(3);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const togglingRef = useRef(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || 3);
      setDayNumber(task.day_number || 1);
      setEvidenceUrl(task.evidence_url ?? "");
      setCategory((task.category as TaskCategory) ?? "");
    }
  }, [task]);

  const handleSave = useCallback(async () => {
    if (!task) return;

    const trimmedUrl = evidenceUrl.trim();
    setSaving(true);
    try {
      await onSave(task.id, {
        title,
        description: description || undefined,
        priority,
        day_number: dayNumber,
        evidence_url: trimmedUrl || undefined,
        evidence_verified: trimmedUrl.length > 0 ? true : undefined,
        category: category || undefined
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [task, title, description, priority, dayNumber, evidenceUrl, category, onSave, onClose]);

  const handleToggle = useCallback(async () => {
    if (!task || togglingRef.current) return;
    togglingRef.current = true;
    setSaving(true);
    try {
      await onToggleComplete(task.id);
    } finally {
      togglingRef.current = false;
      setSaving(false);
    }
  }, [task, onToggleComplete]);

  const handleVerifyUrl = useCallback(async () => {
    if (!task || !evidenceUrl.trim()) return;
    setVerifying(true);
    try {
      await onSave(task.id, { evidence_url: evidenceUrl.trim(), evidence_verified: true });
    } finally {
      setVerifying(false);
    }
  }, [task, evidenceUrl, onSave]);

  const isCompleted = task?.status === "completed" || task?.status === "succeeded";
  const isVerified = Boolean(task?.evidence_verified_at);
  const canVerify = evidenceUrl.trim().length > 0 && !isVerified;

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      subtitle={task ? `Day ${task.day_number || 1}` : undefined}
      footer={
        <div className="flex items-center justify-between">
          <DrawerButton
            variant={isCompleted ? "secondary" : "primary"}
            onClick={handleToggle}
            loading={saving}
          >
            {isCompleted ? "Mark Incomplete" : "Mark Complete"}
          </DrawerButton>
          <div className="flex items-center gap-2">
            <DrawerButton variant="secondary" onClick={onClose}>
              Cancel
            </DrawerButton>
            <DrawerButton variant="primary" onClick={handleSave} loading={saving}>
              Save Changes
            </DrawerButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status indicator */}
        <div
          className={`flex items-center gap-3 rounded-lg p-3 ${
            isCompleted
              ? "bg-emerald-500/10 border border-emerald-500/30"
              : "bg-surface-muted border border-edge-subtle"
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isCompleted ? "bg-emerald-500/20" : "bg-surface-elevated"
            }`}
          >
            {isCompleted ? (
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="h-3 w-3 rounded-full border-2 border-edge-muted" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-fg-primary">
              {isCompleted ? "Task Completed" : "Task Pending"}
            </p>
            <p className="text-xs text-fg-muted">
              {isCompleted
                ? "This task has been marked as done"
                : "Click the button below to complete this task"}
            </p>
          </div>
        </div>

        {/* Title */}
        <DrawerField label="Task Title">
          <DrawerInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
          />
        </DrawerField>

        {/* Description */}
        <DrawerField label="Description">
          <DrawerTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this task..."
            rows={4}
          />
        </DrawerField>

        {/* Day & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <DrawerField label="Day">
            <DrawerSelect
              value={dayNumber}
              onChange={(e) => setDayNumber(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </DrawerSelect>
          </DrawerField>

          <DrawerField label="Priority">
            <DrawerSelect
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              <option value={1}>High</option>
              <option value={2}>Medium</option>
              <option value={3}>Normal</option>
              <option value={4}>Low</option>
            </DrawerSelect>
          </DrawerField>
        </div>

        {/* Evidence link (quick verify on save, or explicit Verify URL) */}
        <DrawerField label="Evidence link">
          <div className="space-y-2">
            <div className="flex gap-2">
              <DrawerInput
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
                type="url"
                className="min-w-0 flex-1"
              />
              <DrawerButton
                variant="secondary"
                onClick={handleVerifyUrl}
                disabled={!canVerify}
                loading={verifying}
              >
                Verify URL
              </DrawerButton>
            </div>
            {isVerified && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </p>
            )}
          </div>
        </DrawerField>

        {/* Category (gamification points) */}
        <DrawerField label="Category">
          <DrawerSelect
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory | "")}
          >
            <option value="">—</option>
            {TASK_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </DrawerSelect>
        </DrawerField>
      </div>
    </DetailDrawer>
  );
}
