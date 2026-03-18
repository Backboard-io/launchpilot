"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  verified_task_count: number;
  category_breakdown: Record<string, number>;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
}

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  text_social: { emoji: "📝", label: "Text post" },
  video_social: { emoji: "🎥", label: "Video post" },
  coding: { emoji: "💻", label: "Coding" },
  infra: { emoji: "🔧", label: "Infra" }
};

function CategoryChips({ breakdown }: { breakdown: Record<string, number> }) {
  const items = Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .map(([cat, count]) => ({ cat, count, ...CATEGORY_LABELS[cat] }))
    .filter((x) => x.emoji);

  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ cat, count, emoji, label }) => (
        <span
          key={cat}
          className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-medium text-fg-secondary"
        >
          <span>{emoji}</span>
          <span>×{count}</span>
        </span>
      ))}
    </div>
  );
}

function AnimatedPoints({ points, delay = 0 }: { points: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (points === 0) {
      setDisplay(0);
      return;
    }
    const t = setTimeout(() => {
      const duration = 400;
      const steps = 12;
      const step = points / steps;
      let current = 0;
      const id = setInterval(() => {
        current += step;
        if (current >= points) {
          setDisplay(points);
          clearInterval(id);
          return;
        }
        setDisplay(Math.floor(current));
      }, duration / steps);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [points, delay]);
  return <span>{display}</span>;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leaderboardRes, meRes] = await Promise.all([
        apiFetch<LeaderboardData>("/leaderboard"),
        apiFetch<{ id?: string }>("/me")
      ]);
      if (leaderboardRes) setData(leaderboardRes);
      if (meRes?.id) setCurrentUserId(meRes.id);
      if (!leaderboardRes) setError("Failed to load leaderboard");
    } catch {
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const entries = data?.entries ?? [];
  const maxPoints = entries.length > 0 ? Math.max(...entries.map((e) => e.total_points), 1) : 1;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myRank = currentUserId ? entries.findIndex((e) => e.user_id === currentUserId) + 1 : 0;
  const myEntry = currentUserId ? entries.find((e) => e.user_id === currentUserId) : null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-fg-muted">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-fg-primary">Leaderboard</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Points from verified launch tasks. Text posts = 1 pt, video posts = 3 pts.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-edge-subtle bg-surface-muted/50 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-3xl">
            🏆
          </div>
          <h2 className="text-lg font-semibold text-fg-primary">No verified tasks yet</h2>
          <p className="mt-2 max-w-sm text-sm text-fg-muted">
            Assign tasks, add evidence URLs, and complete them to appear here. Text and video posts
            earn points.
          </p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {top3.length >= 2 && (
                <div
                  className="flex flex-col items-center animate-slide-up"
                  style={{ animationDelay: "0.1s", animationFillMode: "both" }}
                >
                  <span className="mb-2 text-2xl" aria-hidden>🥈</span>
                  <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-200 bg-surface-elevated dark:border-amber-600">
                    {top3[1].avatar_url ? (
                      <img
                        src={top3[1].avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-fg-muted">
                        {top3[1].display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate text-center text-sm font-medium text-fg-primary max-w-full px-1">
                    {top3[1].display_name}
                  </p>
                  <p className="mt-0.5 font-mono text-lg font-bold text-amber-500">
                    <AnimatedPoints points={top3[1].total_points} delay={150} /> pts
                  </p>
                  <div className="mt-1 flex justify-center">
                    <CategoryChips breakdown={top3[1].category_breakdown} />
                  </div>
                </div>
              )}
              {top3.length >= 1 && (
                <div
                  className="flex flex-col items-center animate-slide-up"
                  style={{ animationDelay: "0s", animationFillMode: "both" }}
                >
                  <span className="mb-2 text-3xl" aria-hidden>🥇</span>
                  <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400 bg-surface-elevated shadow-lg dark:border-amber-500">
                    {top3[0].avatar_url ? (
                      <img
                        src={top3[0].avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-fg-muted">
                        {top3[0].display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate text-center text-sm font-semibold text-fg-primary max-w-full px-1">
                    {top3[0].display_name}
                  </p>
                  <p className="mt-0.5 font-mono text-xl font-bold text-amber-400">
                    <AnimatedPoints points={top3[0].total_points} /> pts
                  </p>
                  <div className="mt-1 flex justify-center">
                    <CategoryChips breakdown={top3[0].category_breakdown} />
                  </div>
                </div>
              )}
              {top3.length >= 3 && (
                <div
                  className="flex flex-col items-center animate-slide-up"
                  style={{ animationDelay: "0.2s", animationFillMode: "both" }}
                >
                  <span className="mb-2 text-2xl" aria-hidden>🥉</span>
                  <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-700 bg-surface-elevated dark:border-amber-800">
                    {top3[2].avatar_url ? (
                      <img
                        src={top3[2].avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-fg-muted">
                        {top3[2].display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate text-center text-sm font-medium text-fg-primary max-w-full px-1">
                    {top3[2].display_name}
                  </p>
                  <p className="mt-0.5 font-mono text-lg font-bold text-amber-700 dark:text-amber-600">
                    <AnimatedPoints points={top3[2].total_points} delay={300} /> pts
                  </p>
                  <div className="mt-1 flex justify-center">
                    <CategoryChips breakdown={top3[2].category_breakdown} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table — rank 4+ */}
          {rest.length > 0 && (
            <div className="rounded-xl border border-edge-subtle bg-surface-muted overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-edge-subtle bg-surface-subtle/80">
                    <th className="px-4 py-3 font-medium text-fg-muted">Rank</th>
                    <th className="px-4 py-3 font-medium text-fg-muted">Member</th>
                    <th className="px-4 py-3 font-medium text-fg-muted">Points</th>
                    <th className="px-4 py-3 font-medium text-fg-muted">Tasks</th>
                    <th className="px-4 py-3 font-medium text-fg-muted">Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((entry, i) => {
                    const rank = 4 + i;
                    const isCurrentUser = entry.user_id === currentUserId;
                    return (
                      <tr
                        key={entry.user_id}
                        className={cn(
                          "border-b border-edge-subtle transition-colors hover:bg-surface-subtle/50",
                          isCurrentUser && "bg-accent-subtle/50"
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-fg-muted">{rank}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated text-fg-muted">
                              {entry.avatar_url ? (
                                <img
                                  src={entry.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                entry.display_name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-medium text-fg-primary">
                              {entry.display_name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs font-normal text-accent">(you)</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-fg-primary">
                            <AnimatedPoints points={entry.total_points} delay={100 * (i + 3)} />
                          </span>
                          <span className="text-fg-muted"> pts</span>
                        </td>
                        <td className="px-4 py-3 text-fg-secondary">
                          {entry.verified_task_count} verified
                        </td>
                        <td className="px-4 py-3">
                          <CategoryChips breakdown={entry.category_breakdown} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Your rank card — when not in top 3 */}
          {currentUserId && myRank > 3 && myEntry && (
            <div className="rounded-xl border-2 border-accent/30 bg-accent-subtle/30 px-4 py-4">
              <p className="text-sm font-medium text-fg-primary">
                You are <span className="font-mono font-bold text-accent">#{myRank}</span> with{" "}
                <AnimatedPoints points={myEntry.total_points} /> pts
                {myEntry.verified_task_count > 0 && (
                  <span className="text-fg-muted"> ({myEntry.verified_task_count} verified tasks)</span>
                )}
              </p>
              <div className="mt-2">
                <CategoryChips breakdown={myEntry.category_breakdown} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
