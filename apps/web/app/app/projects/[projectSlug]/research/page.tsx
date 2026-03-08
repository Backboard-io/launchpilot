"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  InsightCard,
  InsightEmpty,
  InsightListItem,
  InsightPanel,
  InsightSection
} from "@/components/chat/insight-panel";
import { apiFetch } from "@/lib/api";

interface ProjectRow {
  id: string;
  slug: string;
  name: string;
}

interface ResearchState {
  run?: { status?: string; summary?: string };
  competitors: Array<{ name: string; positioning?: string; pricing_summary?: string }>;
  pain_point_clusters: Array<{ label: string; description?: string; rank?: number }>;
  opportunity_wedges: Array<{ id?: string; label: string; description?: string; score?: number }>;
}

interface PipelineStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  details?: Record<string, unknown>;
}

interface PipelineStatus {
  status?: "running" | "completed" | "error";
  current_stage?: string;
  updated_at?: string;
  steps?: PipelineStep[];
  summary?: Record<string, unknown>;
  error?: string;
}

interface MemoryRow {
  key: string;
  value: Record<string, unknown>;
}

const PIPELINE_STEP_LABELS: Record<string, string> = {
  research_analysis: "Analyze market and competitors",
  lead_scout: "Discover target companies",
  lead_enrichment: "Find decision-makers and emails",
  lead_scoring: "Rank leads by expected value",
  contacts_sync: "Add qualified leads to execution contacts"
};

export default function ResearchPage() {
  const params = useParams<{ projectSlug: string }>();
  const projectSlug = params.projectSlug;

  const [projectId, setProjectId] = useState<string | null>(null);
  const [state, setState] = useState<ResearchState>({
    competitors: [],
    pain_point_clusters: [],
    opportunity_wedges: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);

  const loadPipelineStatus = useCallback(async (resolvedProjectId: string) => {
    const memoryRows = await apiFetch<MemoryRow[]>(`/projects/${resolvedProjectId}/memory`);
    if (!memoryRows) return;
    const row = memoryRows.find((item) => item.key === "research_pipeline_status");
    if (!row || !row.value || typeof row.value !== "object") return;
    setPipelineStatus(row.value as unknown as PipelineStatus);
  }, []);

  const loadSnapshot = useCallback(async (resolvedProjectId: string) => {
    const data = await apiFetch<ResearchState>(`/projects/${resolvedProjectId}/research`);
    if (!data) {
      throw new Error("Failed to load research snapshot");
    }
    setState(data);
    await loadPipelineStatus(resolvedProjectId);
  }, [loadPipelineStatus]);

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
      await loadSnapshot(project.id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load research page");
    } finally {
      setLoading(false);
    }
  }, [loadSnapshot, projectSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!projectId) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void loadSnapshot(projectId);
    };
    const interval = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadSnapshot, projectId]);

  const continueHref = useMemo(() => `/app/projects/${projectSlug}/positioning`, [projectSlug]);
  const researchAnalysisStep = useMemo(
    () => (pipelineStatus?.steps ?? []).find((step) => step.id === "research_analysis") ?? null,
    [pipelineStatus?.steps]
  );
  const leadPipelineSteps = useMemo(
    () => (pipelineStatus?.steps ?? []).filter((step) => step.id !== "research_analysis"),
    [pipelineStatus?.steps]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-fg-muted">Loading research...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col animate-fade-in">
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-edge-subtle bg-surface-muted">
          <header className="border-b border-edge-subtle px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">Research Agent</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Run research, prioritize outreach leads, and feed qualified contacts into execution.
                </p>
              </div>
              <Link
                href={continueHref}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Continue to Positioning
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </header>

          {error && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <InsightPanel
            title="Research Insights"
            subtitle={state.run?.status ? `Status: ${state.run.status}` : "Run research to generate insights"}
          >
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <InsightCard title="Competitors" value={state.competitors.length} />
              <InsightCard title="Pain Points" value={state.pain_point_clusters.length} />
              <InsightCard title="Growth Angles" value={state.opportunity_wedges.length} />
            </div>

            {/* Competitors */}
            <InsightSection
              title="Competitors"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              count={state.competitors.length}
              accentColor="blue"
            >
              {state.competitors.length === 0 ? (
                <InsightEmpty message="No competitors found yet" />
              ) : (
                <div className="space-y-2">
                  {state.competitors.map((comp, i) => (
                    <InsightListItem
                      key={`${comp.name}-${i}`}
                      title={comp.name}
                      description={comp.positioning}
                      badge={comp.pricing_summary}
                      badgeColor="blue"
                    />
                  ))}
                </div>
              )}
            </InsightSection>

            {/* Pain Points */}
            <InsightSection
              title="Pain Points"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              count={state.pain_point_clusters.length}
              accentColor="amber"
            >
              {state.pain_point_clusters.length === 0 ? (
                <InsightEmpty message="No pain points identified yet" />
              ) : (
                <div className="space-y-2">
                  {state.pain_point_clusters.map((pain, i) => (
                    <InsightListItem
                      key={`${pain.label}-${i}`}
                      title={pain.label}
                      description={pain.description}
                      badge={pain.rank ? `#${pain.rank}` : undefined}
                      badgeColor={pain.rank && pain.rank <= 2 ? "red" : "amber"}
                    />
                  ))}
                </div>
              )}
            </InsightSection>

            {/* Best Growth Angles */}
            <InsightSection
              title="Best Growth Angles"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              count={state.opportunity_wedges.length}
              accentColor="emerald"
            >
              {state.opportunity_wedges.length === 0 ? (
                <InsightEmpty message="No growth angles discovered yet" />
              ) : (
                <div className="space-y-2">
                  {state.opportunity_wedges.map((wedge, i) => (
                    <InsightListItem
                      key={`${wedge.id ?? wedge.label}-${i}`}
                      title={wedge.label}
                      description={wedge.description}
                      badge={`#${i + 1}`}
                      badgeColor="emerald"
                    />
                  ))}
                </div>
              )}
            </InsightSection>

            <InsightSection
              title="Research Analysis"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4V9m5 8H4a1 1 0 01-1-1V4a1 1 0 011-1h16a1 1 0 011 1v12a1 1 0 01-1 1z" />
                </svg>
              }
              count={researchAnalysisStep ? 1 : 0}
              accentColor="blue"
            >
              {!researchAnalysisStep ? (
                <InsightEmpty message="Run research to analyze competitors and pain points" />
              ) : (
                <InsightListItem
                  title={PIPELINE_STEP_LABELS[researchAnalysisStep.id] || researchAnalysisStep.label}
                  description={
                    researchAnalysisStep.details
                      ? Object.entries(researchAnalysisStep.details)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" | ")
                      : undefined
                  }
                  badge={
                    researchAnalysisStep.status === "completed"
                      ? "done"
                      : researchAnalysisStep.status === "in_progress"
                        ? "running"
                        : researchAnalysisStep.status
                  }
                  badgeColor={
                    researchAnalysisStep.status === "failed"
                      ? "red"
                      : researchAnalysisStep.status === "completed"
                        ? "emerald"
                        : "amber"
                  }
                />
              )}
            </InsightSection>

            <InsightSection
              title="Lead Generation Pipeline"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v3m6.364 1.636l-2.121 2.121M21 12h-3m-1.636 6.364l-2.121-2.121M12 21v-3m-6.364-1.636l2.121-2.121M3 12h3m1.636-6.364l2.121 2.121" />
                </svg>
              }
              count={leadPipelineSteps.length}
              accentColor="purple"
            >
              {!leadPipelineSteps.length ? (
                <InsightEmpty message="Run research to view live pipeline steps" />
              ) : (
                <div className="space-y-2">
                  {leadPipelineSteps.map((step) => {
                    const indicator =
                      step.status === "completed" ? "done" : step.status === "in_progress" ? "running" : step.status;
                    const detailsText = step.details
                      ? Object.entries(step.details)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" | ")
                      : undefined;
                    return (
                      <InsightListItem
                        key={step.id}
                        title={PIPELINE_STEP_LABELS[step.id] || step.label}
                        description={detailsText}
                        badge={indicator}
                        badgeColor={step.status === "failed" ? "red" : step.status === "completed" ? "emerald" : "amber"}
                      />
                    );
                  })}
                  <p className="text-xs text-fg-faint">
                    {pipelineStatus?.status === "running" ? "Pipeline is running..." : `Pipeline status: ${pipelineStatus?.status ?? "unknown"}`}
                  </p>
                </div>
              )}
            </InsightSection>
          </InsightPanel>
        </div>
    </div>
  );
}
