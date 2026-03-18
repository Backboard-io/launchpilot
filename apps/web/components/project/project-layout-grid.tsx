"use client";

import { type ReactNode } from "react";

import { useChatCollapse } from "@/components/project/chat-collapse-context";
import { ProjectGroupChat } from "@/components/project/project-group-chat";
import { cn } from "@/lib/utils";

export function ProjectLayoutGrid({ children }: { children: ReactNode }) {
  const { collapsed } = useChatCollapse();

  return (
    <div className="flex h-[calc(100vh-280px)] min-h-[620px] gap-4">
      <div
        className={cn(
          "shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[52px]" : "min-w-0 flex-1"
        )}
      >
        <ProjectGroupChat />
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          collapsed && "animate-fade-in"
        )}
      >
        {children}
      </div>
    </div>
  );
}
