"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PlanView, TaskDrawer, Plan, Task } from "@/components/execution/plans";
import { WorkItemsBoard, type AssigneeFilter } from "@/components/execution/work-items";
import { AssetsList, AssetDetail, Asset } from "@/components/execution/assets";
import {
  OutreachSubTabs,
  OutreachSubTab,
  ContactsList,
  ContactDrawer,
  BatchesList,
  BatchDetail,
  EmailPreviewModal,
  Contact,
  OutboundBatch,
  OutboundMessage
} from "@/components/execution/outreach";
import { apiFetch, apiFetchWithError } from "@/lib/api";
import { triggerConfetti } from "@/lib/confetti";

import type { ExecutionTab } from "@/components/execution/execution-tabs";

const VALID_TABS: ExecutionTab[] = ["plan", "work-items", "assets", "outreach"];

interface ProjectRow {
  id: string;
  slug: string;
}

interface ExecutionState {
  plans: Plan[];
  tasks: Task[];
  assets: Asset[];
  contacts: Contact[];
  batches: OutboundBatch[];
  messages: OutboundMessage[];
}

export default function ExecutionTabPage() {
  const params = useParams<{ projectSlug: string; tab: string }>();
  const router = useRouter();
  const projectSlug = params.projectSlug;
  const tabParam = params.tab;
  const activeTab: ExecutionTab = VALID_TABS.includes(tabParam as ExecutionTab)
    ? (tabParam as ExecutionTab)
    : "plan";

  const [projectId, setProjectId] = useState<string | null>(null);
  const [state, setState] = useState<ExecutionState>({
    plans: [],
    tasks: [],
    assets: [],
    contacts: [],
    batches: [],
    messages: []
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [outreachSubTab, setOutreachSubTab] = useState<OutreachSubTab>("batches");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("all");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [previewingEmail, setPreviewingEmail] = useState<OutboundMessage | null>(null);

  const loadState = useCallback(async (resolvedProjectId: string): Promise<ExecutionState> => {
    const data = await apiFetch<ExecutionState>(`/projects/${resolvedProjectId}/execution/state`);
    if (!data) throw new Error("Failed to load execution state");
    setState(data);
    return data;
  }, []);

  const load = useCallback(async () => {
    if (!projectSlug) return;
    setLoading(true);
    setError(null);
    try {
      const projects = await apiFetch<ProjectRow[]>("/projects");
      if (!projects) throw new Error("Failed to load projects");
      const project = projects.find((item) => item.slug === projectSlug);
      if (!project) throw new Error("Project not found for this slug");
      setProjectId(project.id);
      await loadState(project.id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load execution page");
    } finally {
      setLoading(false);
    }
  }, [loadState, projectSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!VALID_TABS.includes(tabParam as ExecutionTab)) {
      router.replace(`/app/projects/${projectSlug}/execution/plan`);
      return;
    }
  }, [tabParam, projectSlug, router]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ id?: string }>("/me").then((me) => {
      if (!cancelled && me?.id) setCurrentUserId(me.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void loadState(projectId);
    };
    const interval = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadState, projectId]);

  useEffect(() => {
    const onFocusTab = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: ExecutionTab; outreachSubTab?: OutreachSubTab }>;
      const tab = customEvent.detail?.tab;
      if (!tab || !VALID_TABS.includes(tab)) return;
      const nextOutreachSubTab =
        tab === "outreach" && (customEvent.detail?.outreachSubTab === "contacts" || customEvent.detail?.outreachSubTab === "batches")
          ? customEvent.detail.outreachSubTab
          : undefined;
      if (nextOutreachSubTab) setOutreachSubTab(nextOutreachSubTab);
      setSelectedItemId(null);
      router.push(`/app/projects/${projectSlug}/execution/${tab}`);
    };
    window.addEventListener("execution:focus-tab", onFocusTab as EventListener);
    return () => window.removeEventListener("execution:focus-tab", onFocusTab as EventListener);
  }, [projectSlug, router]);

  const handleSaveTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      if (!projectId) return;
      const data = await apiFetch<{ evidence_verified?: boolean }>(
        `/projects/${projectId}/execution/tasks/${taskId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updates)
        }
      );
      const newState = await loadState(projectId);
      setEditingTask((prev) => {
        if (!prev || !newState?.tasks) return prev;
        const updated = newState.tasks.find((t) => t.id === prev.id);
        return updated ?? prev;
      });
      if (data?.evidence_verified) triggerConfetti();
    },
    [projectId, loadState]
  );

  const handleToggleTask = useCallback(
    async (taskId: string) => {
      if (!projectId) return;
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const newStatus = task.status === "completed" || task.status === "succeeded" ? "pending" : "completed";
      await apiFetch(`/projects/${projectId}/execution/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      const newState = await loadState(projectId);
      setEditingTask((prev) => {
        if (!prev || !newState?.tasks) return prev;
        const updated = newState.tasks.find((t) => t.id === prev.id);
        return updated ?? prev;
      });
    },
    [projectId, state.tasks, loadState]
  );

  const handleTaskStatusChange = useCallback(
    async (taskId: string, status: string) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const handleTaskAssign = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ assignee_id: assigneeId })
      });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const handleSaveAsset = useCallback(
    async (assetId: string, updates: Partial<Asset>) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/assets/${assetId}`, {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const handleAssetStatusChange = useCallback(
    async (assetId: string, status: string) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/assets/${assetId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/assets/${assetId}`, {
        method: "DELETE"
      });
      await loadState(projectId);
      setSelectedItemId(null);
    },
    [projectId, loadState]
  );

  const buildDrivePayloadFromAsset = useCallback((asset: Asset) => {
    const readableTitle = asset.title || asset.asset_type.replace(/_/g, " ");
    const baseName = readableTitle.trim().replace(/[\\/:*?"<>|]+/g, "_");
    const safeTitle = baseName.length > 0 ? baseName : "generated-asset";
    const sections: string[] = [
      `# ${readableTitle}`,
      `Type: ${asset.asset_type}`,
      `Status: ${asset.status}`
    ];
    const content = asset.content ?? {};
    if (Object.keys(content).length === 0) {
      sections.push("\nNo generated content.");
    } else {
      for (const [key, value] of Object.entries(content)) {
        const label = key.replace(/_/g, " ");
        sections.push(`\n## ${label}\n${serializeAssetValue(value)}`);
      }
    }
    return {
      title: `${safeTitle}.md`,
      content: sections.join("\n"),
      mime_type: "text/markdown"
    };
  }, []);

  const handleSaveAssetToDrive = useCallback(
    async (asset: Asset) => {
      if (!projectId) return;
      setError(null);
      const payload = buildDrivePayloadFromAsset(asset);
      const response = await apiFetchWithError<{ written: boolean; file: { id?: string | null; name?: string | null } }>(
        `/projects/${projectId}/execution/drive/write`,
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );
      if (response?.data?.written) await loadState(projectId);
      if (response?.error) setError(response.error.message ?? "Failed to save to Drive");
    },
    [projectId, buildDrivePayloadFromAsset, loadState]
  );

  const handleAddContact = useCallback(
    async (name: string, email: string) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/contacts`, {
        method: "POST",
        body: JSON.stringify({ name: name || undefined, email })
      });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const handleSaveContact = useCallback(
    async (contactId: string, updates: Partial<Contact>) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/contacts/${contactId}`, {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const handleDeleteContact = useCallback(
    async (contactId: string) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/contacts/${contactId}`, { method: "DELETE" });
      await loadState(projectId);
      setSelectedItemId(null);
      setEditingContact(null);
    },
    [projectId, loadState]
  );

  const handleApproveBatch = useCallback(
    async (batchId: string) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/batches/${batchId}/approve`, { method: "POST" });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const handleRejectBatch = useCallback(
    async (batchId: string) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/batches/${batchId}/reject`, { method: "POST" });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const handleSendBatch = useCallback(
    async (batchId: string) => {
      if (!projectId) return;
      await apiFetch(`/projects/${projectId}/execution/batches/${batchId}/send`, { method: "POST" });
      await loadState(projectId);
    },
    [projectId, loadState]
  );

  const pendingBatches = useMemo(
    () => state.batches.filter((b) => b.status === "pending_approval" || b.status === "draft"),
    [state.batches]
  );

  const completedTasks = useMemo(
    () => state.tasks.filter((t) => t.status === "completed" || t.status === "succeeded").length,
    [state.tasks]
  );

  const currentPlan = useMemo(
    () => (state.plans.length > 0 ? state.plans[0] : null),
    [state.plans]
  );

  const selectedAsset = useMemo(
    () =>
      activeTab === "assets" && selectedItemId
        ? state.assets.find((a) => a.id === selectedItemId) ?? null
        : null,
    [activeTab, selectedItemId, state.assets]
  );

  const selectedBatch = useMemo(
    () =>
      activeTab === "outreach" && outreachSubTab === "batches" && selectedItemId
        ? state.batches.find((b) => b.id === selectedItemId) ?? null
        : null,
    [activeTab, outreachSubTab, selectedItemId, state.batches]
  );

  const previewContact = useMemo(
    () =>
      previewingEmail?.contact_id
        ? state.contacts.find((c) => c.id === previewingEmail.contact_id) ?? null
        : null,
    [previewingEmail, state.contacts]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-fg-muted">Loading execution...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col animate-fade-in">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-edge-subtle bg-surface-muted">
          <header className="border-b border-edge-subtle px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">Execution</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Execute your launch with AI assistance
                </p>
              </div>
              <div className="flex items-center gap-3">
                {pendingBatches.length > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-medium text-amber-400">
                      {pendingBatches.length} pending approval
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-fg-muted">
                  <span>{state.tasks.length > 0 && `${completedTasks}/${state.tasks.length} tasks`}</span>
                  <span>{state.assets.length} assets</span>
                  <span>{state.contacts.length} contacts</span>
                </div>
              </div>
            </div>
          </header>

          {error && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {activeTab === "plan" && (
              <PlanView
                plan={currentPlan}
                tasks={state.tasks}
                onTaskClick={(task) => setEditingTask(task)}
                onTaskToggle={handleToggleTask}
              />
            )}

            {activeTab === "work-items" && (
              <WorkItemsBoard
                tasks={state.tasks}
                currentUserId={currentUserId}
                assigneeFilter={assigneeFilter}
                onAssigneeFilterChange={setAssigneeFilter}
                onTaskClick={(task) => setEditingTask(task)}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskAssign={handleTaskAssign}
              />
            )}

            {activeTab !== "plan" && activeTab !== "work-items" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-edge-subtle bg-surface-subtle/40 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-fg-primary">
                        {activeTab === "assets" ? "Asset Workspace" : "Outreach Workspace"}
                      </h3>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {activeTab === "assets"
                          ? "Review generated assets, edit content, and publish to Drive."
                          : outreachSubTab === "contacts"
                            ? "Manage contact records for outbound campaigns."
                            : "Review and send personalized email batches."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {activeTab === "assets" ? (
                        <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-fg-secondary">
                          {state.assets.length} assets
                        </span>
                      ) : (
                        <>
                          <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-fg-secondary">
                            {state.contacts.length} contacts
                          </span>
                          <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-fg-secondary">
                            {state.batches.length} batches
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
                  <div className="min-h-0 overflow-hidden border-b border-edge-subtle bg-surface-subtle/20 lg:border-b-0 lg:border-r">
                    {activeTab === "outreach" && (
                      <div className="flex h-full min-h-0 flex-col">
                        <OutreachSubTabs
                          activeTab={outreachSubTab}
                          onTabChange={(tab) => {
                            setOutreachSubTab(tab);
                            setSelectedItemId(null);
                          }}
                          contactCount={state.contacts.length}
                          batchCount={state.batches.length}
                          pendingCount={pendingBatches.length}
                        />
                        <div className="min-h-0 flex-1 overflow-hidden">
                          {outreachSubTab === "contacts" ? (
                            <ContactsList
                              contacts={state.contacts}
                              selectedContactId={selectedItemId}
                              onSelectContact={(id) => setSelectedItemId(id)}
                              onAddContact={handleAddContact}
                              onDeleteContact={handleDeleteContact}
                            />
                          ) : (
                            <BatchesList
                              batches={state.batches}
                              messages={state.messages}
                              selectedBatchId={selectedItemId}
                              onSelectBatch={(id) => setSelectedItemId(id)}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {activeTab === "assets" && (
                      <AssetsList
                        assets={state.assets}
                        selectedAssetId={selectedItemId}
                        onSelectAsset={(id) => setSelectedItemId(id)}
                      />
                    )}
                  </div>

                  <div className="min-h-0 min-w-0 overflow-hidden bg-surface-muted/20">
                    {activeTab === "outreach" && (
                      outreachSubTab === "batches" ? (
                        selectedBatch ? (
                          <BatchDetail
                            batch={selectedBatch}
                            messages={state.messages}
                            contacts={state.contacts}
                            onApprove={handleApproveBatch}
                            onReject={handleRejectBatch}
                            onSend={handleSendBatch}
                            onPreviewEmail={(message) => setPreviewingEmail(message)}
                          />
                        ) : (
                          <div className="p-6">
                            <div className="rounded-xl border border-edge-subtle bg-surface-elevated p-5">
                              <h3 className="text-sm font-semibold text-fg-primary">
                                {state.batches.length === 0 ? "No email batches yet" : "Select a batch"}
                              </h3>
                              <p className="mt-1 text-sm text-fg-muted">
                                {state.batches.length === 0
                                  ? "Use group chat to prepare outreach emails."
                                  : "Choose a batch to review and approve."}
                              </p>
                            </div>
                          </div>
                        )
                      ) : selectedItemId ? (
                        <ContactDetailView
                          contact={state.contacts.find((c) => c.id === selectedItemId) ?? null}
                          onEdit={() => {
                            const contact = state.contacts.find((c) => c.id === selectedItemId);
                            if (contact) setEditingContact(contact);
                          }}
                          onDelete={handleDeleteContact}
                        />
                      ) : (
                        <EmptyDetailPanel
                          icon={
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          }
                          title="Select a contact"
                          description="Choose a contact to view details"
                        />
                      )
                    )}
                    {activeTab === "assets" && (
                      selectedAsset ? (
                        <AssetDetail
                          asset={selectedAsset}
                          onSave={handleSaveAsset}
                          onStatusChange={handleAssetStatusChange}
                          onDelete={handleDeleteAsset}
                          onSaveToDrive={handleSaveAssetToDrive}
                        />
                      ) : (
                        <EmptyDetailPanel
                          icon={
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          }
                          title={state.assets.length === 0 ? "No assets yet" : "Select an asset"}
                          description={
                            state.assets.length === 0
                              ? "Ask the agent to generate marketing content"
                              : "Choose an asset to view and edit"
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskDrawer
        task={editingTask}
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        onToggleComplete={handleToggleTask}
      />

      <ContactDrawer
        contact={editingContact}
        isOpen={editingContact !== null}
        onClose={() => setEditingContact(null)}
        onSave={handleSaveContact}
        onDelete={handleDeleteContact}
      />

      <EmailPreviewModal
        message={previewingEmail}
        contact={previewContact}
        isOpen={previewingEmail !== null}
        onClose={() => setPreviewingEmail(null)}
      />
    </div>
  );
}

function serializeAssetValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return JSON.stringify(value, null, 2);
}

function EmptyDetailPanel({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-fg-faint">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-fg-primary">{title}</h3>
      <p className="mt-1 text-xs text-fg-muted">{description}</p>
    </div>
  );
}

function ContactDetailView({
  contact,
  onEdit,
  onDelete
}: {
  contact: Contact | null;
  onEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [contact?.id]);

  if (!contact) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-edge-subtle px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-lg font-semibold text-white">
            {(contact.name || contact.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-fg-primary">
              {contact.name || contact.email}
            </h2>
            {contact.name && (
              <p className="truncate text-sm text-fg-muted">{contact.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          {!showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-500/30 p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {showDeleteConfirm && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-sm font-medium text-red-400">
                Delete &quot;{contact.name || contact.email}&quot;?
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                This action cannot be undone. The contact and its outreach references will be removed.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onDelete(contact.id)}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  Yes, delete contact
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-edge-subtle bg-surface-muted px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-surface-elevated"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border border-edge-subtle bg-surface-elevated p-4">
            <span className="text-sm text-fg-muted">Email</span>
            <span className="max-w-[70%] break-all text-right font-mono text-sm text-fg-primary">{contact.email}</span>
          </div>
          {contact.company && (
            <div className="flex items-center justify-between rounded-lg border border-edge-subtle bg-surface-elevated p-4">
              <span className="text-sm text-fg-muted">Company</span>
              <span className="max-w-[70%] truncate text-sm text-fg-primary">{contact.company}</span>
            </div>
          )}
          {contact.segment && (
            <div className="flex items-center justify-between rounded-lg border border-edge-subtle bg-surface-elevated p-4">
              <span className="text-sm text-fg-muted">Segment</span>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {contact.segment}
              </span>
            </div>
          )}
          {contact.source && (
            <div className="flex items-center justify-between rounded-lg border border-edge-subtle bg-surface-elevated p-4">
              <span className="text-sm text-fg-muted">Source</span>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-fg-secondary">
                {contact.source}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
