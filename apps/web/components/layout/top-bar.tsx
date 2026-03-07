import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
      <div>
        <p className="text-sm font-semibold">Growth Launchpad</p>
      </div>
      <nav className="flex items-center gap-3 text-xs">
        <Link href="/app/select-workspace" className="rounded-md border border-slate-300 px-2 py-1">
          Workspace
        </Link>
        <Link href="/app/settings/security" className="rounded-md border border-slate-300 px-2 py-1">
          Security
        </Link>
        <Link href="/auth/logout" className="rounded-md bg-slate-900 px-2 py-1 text-white">
          Logout
        </Link>
      </nav>
    </header>
  );
}
