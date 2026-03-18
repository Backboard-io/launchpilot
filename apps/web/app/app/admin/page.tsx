"use client";

import { useCallback, useEffect, useState } from "react";

import { triggerConfetti } from "@/lib/confetti";
import { apiFetch, apiFetchWithError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  auth0_user_id: string;
}

interface AdminProjectBrief {
  id: string;
  name: string;
  slug: string;
  stage: string;
  status: string;
  workspace_id?: string;
}

interface AdminWorkspaceMember {
  user_id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
}

interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string | null;
  project_count: number;
  member_count: number;
}

interface AdminWorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string | null;
  projects: AdminProjectBrief[];
  members: AdminWorkspaceMember[];
}

type Toast = { id: number; type: "success" | "error"; message: string };

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}
function WorkspacesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return { toasts, addToast: add };
}

export default function AdminPage() {
  const [me, setMe] = useState<{ is_admin?: boolean } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProjectBrief[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string | null>(null);
  const [workspaceDetail, setWorkspaceDetail] = useState<AdminWorkspaceDetail | null>(null);
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [addProjectToWorkspaceId, setAddProjectToWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedProject, setSelectedProject] = useState<AdminProjectBrief | null>(null);
  const [projectRemoveFromWorkspace, setProjectRemoveFromWorkspace] = useState<{
    project: AdminProjectBrief;
    workspaceId: string;
  } | null>(null);
  type AdminView = "users" | "projects" | "workspaces";
  const [view, setView] = useState<AdminView>("users");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState<
    { type: "users"; items: { id: string; label: string }[] } |
    { type: "projects"; items: { id: string; label: string }[] } |
    { type: "workspaces"; items: { id: string; label: string }[] } |
    null
  >(null);
  const { toasts, addToast } = useToast();

  const clearSelection = useCallback(() => {
    setSelectedUserIds(new Set());
    setSelectedProjectIds(new Set());
    setSelectedWorkspaceIds(new Set());
  }, []);

  const toggleUserSelection = useCallback((id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleProjectSelection = useCallback((id: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleWorkspaceSelection = useCallback((id: string) => {
    setSelectedWorkspaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const loadMe = useCallback(async () => {
    const data = await apiFetch<{ is_admin?: boolean }>("/me");
    setMe(data ?? null);
    return data?.is_admin ?? false;
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await apiFetch<AdminUser[]>("/admin/users");
    setUsers(data ?? []);
  }, []);

  const loadWorkspaces = useCallback(async () => {
    const data = await apiFetch<AdminWorkspace[]>("/admin/workspaces");
    setWorkspaces(data ?? []);
  }, []);

  const loadProjects = useCallback(async () => {
    const data = await apiFetch<AdminProjectBrief[]>("/admin/projects");
    setProjects(data ?? []);
  }, []);

  const loadWorkspaceDetail = useCallback(async (workspaceId: string) => {
    const data = await apiFetch<AdminWorkspaceDetail>(`/admin/workspaces/${workspaceId}`);
    setWorkspaceDetail(data ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const isAdmin = await loadMe();
      if (cancelled) return;
      if (!isAdmin) {
        window.location.href = "/app/projects";
        return;
      }
      await Promise.all([loadUsers(), loadWorkspaces(), loadProjects()]);
      if (!cancelled) setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [loadMe, loadUsers, loadWorkspaces, loadProjects]);

  useEffect(() => {
    if (!expandedWorkspaceId) {
      setWorkspaceDetail(null);
      return;
    }
    loadWorkspaceDetail(expandedWorkspaceId);
  }, [expandedWorkspaceId, loadWorkspaceDetail]);

  const handleAddMember = useCallback(
    async (workspaceId: string) => {
      if (!addMemberUserId.trim()) return;
      setActionLoading(`add-${workspaceId}`);
      const res = await apiFetchWithError(`/admin/workspaces/${workspaceId}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: addMemberUserId.trim(), role: "member" }),
      });
      setActionLoading(null);
      if (res.error) {
        addToast("error", res.error.message ?? "Failed to add member");
        return;
      }
      addToast("success", "Member added. They now have access to all projects in this workspace.");
      setAddMemberUserId("");
      if (expandedWorkspaceId === workspaceId) loadWorkspaceDetail(workspaceId);
      loadWorkspaces();
    },
    [addMemberUserId, expandedWorkspaceId, loadWorkspaceDetail, loadWorkspaces, addToast]
  );

  const handleRemoveMember = useCallback(
    async (workspaceId: string, userId: string) => {
      setActionLoading(`remove-${workspaceId}-${userId}`);
      const res = await apiFetchWithError(
        `/admin/workspaces/${workspaceId}/members/${userId}`,
        { method: "DELETE" }
      );
      setActionLoading(null);
      if (res.error) {
        addToast("error", res.error.message ?? "Failed to remove member");
        return;
      }
      addToast("success", "Access removed.");
      if (expandedWorkspaceId === workspaceId) loadWorkspaceDetail(workspaceId);
      loadWorkspaces();
    },
    [expandedWorkspaceId, loadWorkspaceDetail, loadWorkspaces, addToast]
  );

  const handleUserSave = useCallback(
    async (u: AdminUser, name: string, email: string) => {
      setActionLoading("user-save");
      const res = await apiFetchWithError(`/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name || null, email }),
      });
      setActionLoading(null);
      if (res.error) {
        addToast("error", res.error.message ?? "Failed to update user");
        return;
      }
      addToast("success", "User updated.");
      setSelectedUser(null);
      loadUsers();
    },
    [loadUsers, addToast]
  );

  const handleUserDelete = useCallback(
    async (u: AdminUser) => {
      if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
      setActionLoading("user-delete");
      const res = await apiFetchWithError(`/admin/users/${u.id}`, { method: "DELETE" });
      setActionLoading(null);
      if (res.error) {
        addToast("error", res.error.message ?? "Failed to delete user");
        return;
      }
      addToast("success", "User deleted.");
      setSelectedUser(null);
      loadUsers();
    },
    [loadUsers, addToast]
  );

  const handleProjectSave = useCallback(
    async (p: AdminProjectBrief, updates: { name?: string; slug?: string; status?: string }) => {
      setActionLoading("project-save");
      const res = await apiFetchWithError(`/admin/projects/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setActionLoading(null);
      if (res.error) {
        addToast("error", res.error.message ?? "Failed to update project");
        return;
      }
      addToast("success", "Project updated.");
      setSelectedProject(null);
      loadProjects();
      if (expandedWorkspaceId) loadWorkspaceDetail(expandedWorkspaceId);
      loadWorkspaces();
    },
    [loadProjects, loadWorkspaceDetail, loadWorkspaces, expandedWorkspaceId, addToast]
  );

  const handleProjectDelete = useCallback(
    async (p: AdminProjectBrief) => {
      if (!confirm(`Delete project "${p.name}"? This cannot be undone.`)) return;
      setActionLoading("project-delete");
      const res = await apiFetchWithError(`/admin/projects/${p.id}`, { method: "DELETE" });
      setActionLoading(null);
      if (res.error) {
        addToast("error", res.error.message ?? "Failed to delete project");
        return;
      }
      addToast("success", "Project deleted.");
      setSelectedProject(null);
      setProjectRemoveFromWorkspace(null);
      loadProjects();
      if (expandedWorkspaceId) loadWorkspaceDetail(expandedWorkspaceId);
      loadWorkspaces();
    },
    [loadProjects, loadWorkspaceDetail, loadWorkspaces, expandedWorkspaceId, addToast]
  );

  const handleProjectRemoveFromWorkspace = useCallback(
    async (projectId: string, targetWorkspaceId: string) => {
      setActionLoading("project-move");
      const res = await apiFetchWithError(`/admin/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ workspace_id: targetWorkspaceId }),
      });
      setActionLoading(null);
      if (res.error) {
        addToast("error", res.error.message ?? "Failed to move project");
        return;
      }
      addToast("success", "Project moved to another workspace.");
      setProjectRemoveFromWorkspace(null);
      loadProjects();
      if (expandedWorkspaceId) loadWorkspaceDetail(expandedWorkspaceId);
      loadWorkspaces();
    },
    [loadProjects, loadWorkspaceDetail, loadWorkspaces, expandedWorkspaceId, addToast]
  );

  const handleAddProjectToWorkspace = useCallback(
    async (workspaceId: string, projectId: string) => {
      if (!projectId) return;
      setActionLoading("project-add-to-ws");
      const res = await apiFetchWithError(`/admin/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      setActionLoading(null);
      if (res.error) {
        addToast("error", res.error.message ?? "Failed to add project to workspace");
        return;
      }
      addToast("success", "Project added to workspace.");
      setAddProjectToWorkspaceId("");
      if (expandedWorkspaceId === workspaceId) loadWorkspaceDetail(workspaceId);
      loadProjects();
      loadWorkspaces();
    },
    [expandedWorkspaceId, loadWorkspaceDetail, loadProjects, loadWorkspaces, addToast]
  );

  const handleBulkDelete = useCallback(
    async (
      type: "users" | "projects" | "workspaces",
      items: { id: string; label: string }[]
    ) => {
      setBulkDeleteModal(null);
      if (items.length === 0) return;
      setActionLoading("bulk-delete");
      const base = type === "users" ? "/admin/users" : type === "projects" ? "/admin/projects" : "/admin/workspaces";
      const results = await Promise.allSettled(
        items.map((item) =>
          apiFetchWithError(`${base}/${item.id}`, { method: "DELETE" })
        )
      );
      setActionLoading(null);
      const failed = results.filter(
        (r) => r.status === "fulfilled" && r.value && typeof r.value === "object" && "error" in r && (r.value as { error?: unknown }).error
      );
      const succeeded = results.length - failed.length;
      if (succeeded > 0) {
        addToast("success", `Deleted ${succeeded} ${type}.`);
        triggerConfetti();
        clearSelection();
        if (type === "users") loadUsers();
        else if (type === "projects") {
          loadProjects();
          if (expandedWorkspaceId) loadWorkspaceDetail(expandedWorkspaceId);
          loadWorkspaces();
        } else {
          loadWorkspaces();
          loadProjects();
          setExpandedWorkspaceId(null);
        }
      }
      if (failed.length > 0) {
        addToast("error", `Failed to delete ${failed.length} ${type}.`);
      }
    },
    [
      clearSelection,
      loadUsers,
      loadProjects,
      loadWorkspaces,
      loadWorkspaceDetail,
      expandedWorkspaceId,
      addToast,
    ]
  );

  const openBulkDeleteModal = useCallback(() => {
    if (view === "users" && selectedUserIds.size > 0) {
      setBulkDeleteModal({
        type: "users",
        items: users.filter((u) => selectedUserIds.has(u.id)).map((u) => ({ id: u.id, label: u.name || u.email })),
      });
    } else if (view === "projects" && selectedProjectIds.size > 0) {
      setBulkDeleteModal({
        type: "projects",
        items: projects
          .filter((p) => selectedProjectIds.has(p.id))
          .map((p) => ({ id: p.id, label: p.name })),
      });
    } else if (view === "workspaces" && selectedWorkspaceIds.size > 0) {
      setBulkDeleteModal({
        type: "workspaces",
        items: workspaces
          .filter((w) => selectedWorkspaceIds.has(w.id))
          .map((w) => ({ id: w.id, label: w.name })),
      });
    }
  }, [view, selectedUserIds, selectedProjectIds, selectedWorkspaceIds, users, projects, workspaces]);

  if (me && !me.is_admin) return null;
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-fg-muted">Loading admin…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toasts */}
      <div className="fixed right-6 top-20 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-slide-up rounded-lg border px-4 py-3 text-sm font-medium shadow-lg",
              t.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-fg-primary">Admin</h1>
        <p className="mt-1 text-fg-muted">
          Manage users and project access. Grant or revoke workspace membership to control who sees which projects.
        </p>
      </header>

      <div className="rounded-xl border border-edge-subtle bg-surface-muted overflow-hidden">
        {/* Selector */}
        <div className="flex border-b border-edge-subtle bg-surface-base">
          {(
            [
              { id: "users" as const, label: "Users", icon: UsersIcon },
              { id: "projects" as const, label: "Projects", icon: FolderIcon },
              { id: "workspaces" as const, label: "Workspaces", icon: WorkspacesIcon },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setView(id);
                clearSelection();
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                view === id
                  ? "border-accent text-accent bg-accent/5"
                  : "border-transparent text-fg-muted hover:bg-surface-muted hover:text-fg-primary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-[320px] p-4">
          {/* Bulk actions toolbar */}
          {view === "users" && selectedUserIds.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
              <span className="text-sm font-medium text-fg-primary">
                {selectedUserIds.size} user{selectedUserIds.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserIds(new Set())}
                  className="rounded-lg border border-edge-subtle px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-muted hover:text-fg-primary transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={openBulkDeleteModal}
                  disabled={actionLoading === "bulk-delete"}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 active:scale-[0.97] transition-transform"
                >
                  {actionLoading === "bulk-delete" ? "Deleting…" : "Delete selected"}
                </button>
              </div>
            </div>
          )}
          {view === "projects" && selectedProjectIds.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
              <span className="text-sm font-medium text-fg-primary">
                {selectedProjectIds.size} project{selectedProjectIds.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectIds(new Set())}
                  className="rounded-lg border border-edge-subtle px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-muted hover:text-fg-primary transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={openBulkDeleteModal}
                  disabled={actionLoading === "bulk-delete"}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 active:scale-[0.97] transition-transform"
                >
                  {actionLoading === "bulk-delete" ? "Deleting…" : "Delete selected"}
                </button>
              </div>
            </div>
          )}
          {view === "workspaces" && selectedWorkspaceIds.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
              <span className="text-sm font-medium text-fg-primary">
                {selectedWorkspaceIds.size} workspace{selectedWorkspaceIds.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWorkspaceIds(new Set())}
                  className="rounded-lg border border-edge-subtle px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-muted hover:text-fg-primary transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={openBulkDeleteModal}
                  disabled={actionLoading === "bulk-delete"}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 active:scale-[0.97] transition-transform"
                >
                  {actionLoading === "bulk-delete" ? "Deleting…" : "Delete selected"}
                </button>
              </div>
            </div>
          )}

          {view === "users" && (
            users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated text-2xl opacity-80">👤</div>
                <h3 className="font-semibold text-fg-primary">No users yet</h3>
                <p className="mt-1 max-w-sm text-center text-sm text-fg-muted">Users appear here after they sign in.</p>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedUserIds((prev) =>
                        prev.size === users.length ? new Set() : new Set(users.map((u) => u.id))
                      )
                    }
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {selectedUserIds.size === users.length ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((u, i) => (
                    <div
                      key={u.id}
                      className={cn(
                        "stagger-item flex w-full rounded-lg border border-edge-subtle bg-surface-base p-3 transition-all duration-200",
                        selectedUserIds.has(u.id) && "ring-2 ring-accent/50 border-accent/30"
                      )}
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserSelection(u.id);
                          }}
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 check-morph",
                            selectedUserIds.has(u.id)
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-edge-muted bg-surface-muted"
                          )}
                          aria-label={selectedUserIds.has(u.id) ? "Deselect" : "Select"}
                        >
                          {selectedUserIds.has(u.id) && (
                            <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="row-hover flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent text-sm">
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-fg-primary text-sm">{u.name || u.email}</p>
                            <p className="truncate text-xs text-fg-muted">{u.email}</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {view === "projects" && (
            projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-fg-muted">No projects yet.</p>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProjectIds((prev) =>
                        prev.size === projects.length ? new Set() : new Set(projects.map((p) => p.id))
                      )
                    }
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {selectedProjectIds.size === projects.length ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {projects.map((p) => {
                    const ws = workspaces.find((w) => w.id === p.workspace_id);
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "card-hover flex w-full items-center gap-3 rounded-lg border border-edge-subtle bg-surface-base px-3 py-2.5",
                          selectedProjectIds.has(p.id) && "ring-2 ring-accent/50 border-accent/30"
                        )}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectSelection(p.id);
                          }}
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 check-morph",
                            selectedProjectIds.has(p.id)
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-edge-muted bg-surface-muted"
                          )}
                          aria-label={selectedProjectIds.has(p.id) ? "Deselect" : "Select"}
                        >
                          {selectedProjectIds.has(p.id) && (
                            <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProject(p)}
                          className="row-hover flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-fg-primary text-sm truncate">{p.name}</span>
                            <span className="text-xs text-fg-muted shrink-0">{p.slug}</span>
                            {ws && (
                              <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-fg-muted shrink-0">
                                {ws.name}
                              </span>
                            )}
                          </div>
                          <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent shrink-0">
                            {p.status}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          )}

          {view === "workspaces" && (
            workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated text-2xl opacity-80">📁</div>
                <h3 className="font-semibold text-fg-primary">No workspaces yet</h3>
                <p className="mt-1 max-w-sm text-center text-sm text-fg-muted">Workspaces are created when users create projects.</p>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedWorkspaceIds((prev) =>
                        prev.size === workspaces.length ? new Set() : new Set(workspaces.map((w) => w.id))
                      )
                    }
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {selectedWorkspaceIds.size === workspaces.length ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="space-y-2">
                  {workspaces.map((ws, i) => (
                    <div
                      key={ws.id}
                      className={cn(
                        "stagger-item rounded-lg border border-edge-subtle bg-surface-base transition-all duration-200",
                        selectedWorkspaceIds.has(ws.id) && "ring-2 ring-accent/50 border-accent/30"
                      )}
                      style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" } as React.CSSProperties}
                    >
                      <div className="flex w-full items-center gap-3 rounded-lg p-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkspaceSelection(ws.id);
                          }}
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 check-morph",
                            selectedWorkspaceIds.has(ws.id)
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-edge-muted bg-surface-muted"
                          )}
                          aria-label={selectedWorkspaceIds.has(ws.id) ? "Deselect" : "Select"}
                        >
                          {selectedWorkspaceIds.has(ws.id) && (
                            <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedWorkspaceId(expandedWorkspaceId === ws.id ? null : ws.id)
                          }
                          className="card-hover flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-fg-muted">
                              <FolderIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-fg-primary text-sm">{ws.name}</p>
                              <p className="text-xs text-fg-muted">
                                {ws.member_count} member{ws.member_count !== 1 ? "s" : ""} · {ws.project_count} project
                                {ws.project_count !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-fg-muted transition-transform shrink-0",
                              expandedWorkspaceId === ws.id && "rotate-180"
                            )}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </button>
                      </div>

                    {expandedWorkspaceId === ws.id && (
                      <div className="animate-fade-in border-t border-edge-subtle p-3">
                        {workspaceDetail?.id === ws.id ? (
                          <div className="space-y-4">
                            <div>
                              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">
                                Members
                              </h4>
                              <ul className="space-y-1.5">
                                {workspaceDetail.members.map((m) => (
                                  <li
                                    key={m.user_id}
                                    className="row-hover flex items-center justify-between gap-3 rounded-lg border border-edge-subtle bg-surface-muted px-2.5 py-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-medium text-fg-primary text-sm truncate">{m.email}</span>
                                      <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent shrink-0">
                                        {m.role}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={actionLoading === `remove-${ws.id}-${m.user_id}`}
                                      onClick={() => handleRemoveMember(ws.id, m.user_id)}
                                      className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50 shrink-0"
                                    >
                                      {actionLoading === `remove-${ws.id}-${m.user_id}` ? "…" : "Remove"}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <select
                                  value={addMemberUserId}
                                  onChange={(e) => setAddMemberUserId(e.target.value)}
                                  className="rounded-lg border border-edge-subtle bg-surface-muted px-2.5 py-1.5 text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                >
                                  <option value="">Add user…</option>
                                  {users
                                    .filter((u) => !workspaceDetail.members.some((m) => m.user_id === u.id))
                                    .map((u) => (
                                      <option key={u.id} value={u.id}>
                                        {u.name || u.email} ({u.email})
                                      </option>
                                    ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={!addMemberUserId || actionLoading === `add-${ws.id}`}
                                  onClick={() => handleAddMember(ws.id)}
                                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                                >
                                  {actionLoading === `add-${ws.id}` ? "Adding…" : "Add"}
                                </button>
                              </div>
                            </div>
                            <div>
                              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">
                                Projects
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {workspaceDetail.projects.length === 0 ? (
                                  <p className="text-sm text-fg-muted">No projects yet.</p>
                                ) : (
                                  workspaceDetail.projects.map((p) => (
                                    <span
                                      key={p.id}
                                      className="group relative inline-flex items-center gap-1 rounded-lg border border-edge-subtle bg-surface-muted pl-2.5 pr-7 py-1.5 text-sm font-medium text-fg-primary"
                                    >
                                      <a href={`/app/projects/${p.slug}`} className="hover:underline focus:outline-none">
                                        {p.name}
                                      </a>
                                      <button
                                        type="button"
                                        aria-label={`Remove ${p.name} from workspace`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setProjectRemoveFromWorkspace({
                                            project: { ...p, workspace_id: ws.id },
                                            workspaceId: ws.id,
                                          });
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-fg-muted hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                                      >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </span>
                                  ))
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <select
                                  value={addProjectToWorkspaceId}
                                  onChange={(e) => setAddProjectToWorkspaceId(e.target.value)}
                                  className="rounded-lg border border-edge-subtle bg-surface-muted px-2.5 py-1.5 text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                >
                                  <option value="">Add project…</option>
                                  {projects
                                    .filter((p) => !workspaceDetail.projects.some((wp) => wp.id === p.id))
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.slug})
                                      </option>
                                    ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={!addProjectToWorkspaceId || actionLoading === "project-add-to-ws"}
                                  onClick={() => handleAddProjectToWorkspace(ws.id, addProjectToWorkspaceId)}
                                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                                >
                                  {actionLoading === "project-add-to-ws" ? "Adding…" : "Add"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center py-4">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
            )
          )}
        </div>
      </div>

      {/* User edit/delete modal */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleUserSave}
          onDelete={handleUserDelete}
          loading={actionLoading === "user-save" || actionLoading === "user-delete"}
        />
      )}

      {/* Project edit/delete modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          workspaces={workspaces}
          onClose={() => setSelectedProject(null)}
          onSave={handleProjectSave}
          onDelete={handleProjectDelete}
          loading={actionLoading === "project-save" || actionLoading === "project-delete"}
        />
      )}

      {/* Remove project from workspace modal */}
      {projectRemoveFromWorkspace && (
        <RemoveProjectFromWorkspaceModal
          project={projectRemoveFromWorkspace.project}
          currentWorkspaceId={projectRemoveFromWorkspace.workspaceId}
          workspaces={workspaces}
          onClose={() => setProjectRemoveFromWorkspace(null)}
          onMove={handleProjectRemoveFromWorkspace}
          loading={actionLoading === "project-move"}
        />
      )}

      {/* Bulk delete confirmation */}
      {bulkDeleteModal && (
        <BulkDeleteConfirmModal
          type={bulkDeleteModal.type}
          items={bulkDeleteModal.items}
          onClose={() => setBulkDeleteModal(null)}
          onConfirm={() => handleBulkDelete(bulkDeleteModal.type, bulkDeleteModal.items)}
          loading={actionLoading === "bulk-delete"}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave,
  onDelete,
  loading,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (u: AdminUser, name: string, email: string) => void;
  onDelete: (u: AdminUser) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  useEffect(() => {
    setName(user.name ?? "");
    setEmail(user.email);
  }, [user.id, user.name, user.email]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-edge-subtle bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-edge-subtle p-4">
          <h3 className="text-lg font-semibold text-fg-primary">Edit user</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-fg-muted hover:bg-surface-muted hover:text-fg-primary"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form
          className="p-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(user, name.trim() || "", email.trim());
          }}
        >
          <div>
            <label className="block text-sm font-medium text-fg-primary mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-edge-subtle bg-surface-muted px-3 py-2 text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-primary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-edge-subtle bg-surface-muted px-3 py-2 text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-edge-subtle px-4 py-2 text-sm font-medium text-fg-primary hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onDelete(user)}
              disabled={loading}
              className="ml-auto rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              {loading ? "…" : "Delete user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectModal({
  project,
  workspaces,
  onClose,
  onSave,
  onDelete,
  loading,
}: {
  project: AdminProjectBrief;
  workspaces: AdminWorkspace[];
  onClose: () => void;
  onSave: (p: AdminProjectBrief, updates: { name?: string; slug?: string; status?: string }) => void;
  onDelete: (p: AdminProjectBrief) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [status, setStatus] = useState(project.status);
  useEffect(() => {
    setName(project.name);
    setSlug(project.slug);
    setStatus(project.status);
  }, [project.id, project.name, project.slug, project.status]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-edge-subtle bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-edge-subtle p-4">
          <h3 className="text-lg font-semibold text-fg-primary">Edit project</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-fg-muted hover:bg-surface-muted hover:text-fg-primary"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form
          className="p-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(project, { name: name.trim(), slug: slug.trim(), status });
          }}
        >
          <div>
            <label className="block text-sm font-medium text-fg-primary mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-edge-subtle bg-surface-muted px-3 py-2 text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-primary mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-edge-subtle bg-surface-muted px-3 py-2 text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-primary mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-edge-subtle bg-surface-muted px-3 py-2 text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-edge-subtle px-4 py-2 text-sm font-medium text-fg-primary hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onDelete(project)}
              disabled={loading}
              className="ml-auto rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              {loading ? "…" : "Delete project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RemoveProjectFromWorkspaceModal({
  project,
  currentWorkspaceId,
  workspaces,
  onClose,
  onMove,
  loading,
}: {
  project: AdminProjectBrief;
  currentWorkspaceId: string;
  workspaces: AdminWorkspace[];
  onClose: () => void;
  onMove: (projectId: string, targetWorkspaceId: string) => void;
  loading: boolean;
}) {
  const otherWorkspaces = workspaces.filter((w) => w.id !== currentWorkspaceId);
  const [targetId, setTargetId] = useState(otherWorkspaces[0]?.id ?? "");
  useEffect(() => {
    const other = workspaces.filter((w) => w.id !== currentWorkspaceId);
    setTargetId(other[0]?.id ?? "");
  }, [currentWorkspaceId, workspaces.length]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-edge-subtle bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-edge-subtle p-4">
          <h3 className="text-lg font-semibold text-fg-primary">Remove from workspace</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-fg-muted hover:bg-surface-muted hover:text-fg-primary"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-fg-muted">
            Move <strong className="text-fg-primary">{project.name}</strong> to another workspace. Pick the target
            workspace below.
          </p>
          {otherWorkspaces.length === 0 ? (
            <p className="text-sm text-fg-muted">No other workspace available. Create one first.</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-fg-primary mb-1">Target workspace</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full rounded-lg border border-edge-subtle bg-surface-muted px-3 py-2 text-fg-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {otherWorkspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={loading || !targetId}
                  onClick={() => onMove(project.id, targetId)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {loading ? "Moving…" : "Move"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-edge-subtle px-4 py-2 text-sm font-medium text-fg-primary hover:bg-surface-muted"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BulkDeleteConfirmModal({
  type,
  items,
  onClose,
  onConfirm,
  loading,
}: {
  type: "users" | "projects" | "workspaces";
  items: { id: string; label: string }[];
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const label = type === "users" ? "user" : type === "projects" ? "project" : "workspace";
  const count = items.length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-edge-subtle bg-surface-base shadow-xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-edge-subtle p-4">
          <h3 className="text-lg font-semibold text-fg-primary">
            Delete {count} {label}{count !== 1 ? "s" : ""}?
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-fg-muted hover:bg-surface-muted hover:text-fg-primary transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-fg-muted">
            This cannot be undone. The following will be permanently removed:
          </p>
          <ul className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-edge-subtle bg-surface-muted p-2">
            {items.map((item) => (
              <li key={item.id} className="truncate text-sm font-medium text-fg-primary px-1 py-0.5">
                {item.label}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-edge-subtle px-4 py-2 text-sm font-medium text-fg-primary hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 active:scale-[0.97] transition-transform"
            >
              {loading ? "Deleting…" : `Delete ${count} ${label}${count !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
