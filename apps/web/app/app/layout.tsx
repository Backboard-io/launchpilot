import { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { auth, isAuthEnabled } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  if (!isAuthEnabled()) {
    return <AppShell>{children}</AppShell>;
  }

  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
