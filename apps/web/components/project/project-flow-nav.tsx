"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const steps = [
  { key: "overview", label: "Overview", href: (projectSlug: string) => `/app/projects/${projectSlug}` },
  { key: "research", label: "Research", href: (projectSlug: string) => `/app/projects/${projectSlug}/research` },
  { key: "positioning", label: "Positioning", href: (projectSlug: string) => `/app/projects/${projectSlug}/positioning` },
  { key: "execution", label: "Execution", href: (projectSlug: string) => `/app/projects/${projectSlug}/execution` },
  { key: "approvals", label: "Approvals", href: (projectSlug: string) => `/app/projects/${projectSlug}/approvals` }
];

export function ProjectFlowNav({ projectSlug }: { projectSlug: string }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:grid-cols-5">
      {steps.map((step) => (
        <Link
          key={step.key}
          href={step.href(projectSlug)}
          className={cn(
            "rounded-lg px-3 py-3 text-center text-sm font-medium transition",
            pathname === step.href(projectSlug)
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
          )}
        >
          {step.label}
        </Link>
      ))}
    </nav>
  );
}
