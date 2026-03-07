import { ReactNode } from "react";

import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightRail } from "@/components/layout/right-rail";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="flex min-h-[calc(100vh-56px)]">
        <LeftSidebar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <RightRail />
      </div>
    </div>
  );
}
