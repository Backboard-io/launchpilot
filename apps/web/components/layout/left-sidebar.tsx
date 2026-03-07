import Link from "next/link";

const links = [
  { label: "Workspace", href: "/app/select-workspace" },
  { label: "Projects", href: "/app" },
  { label: "Security", href: "/app/settings/security" }
];

export function LeftSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-3 md:block">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Navigation</p>
      <div className="space-y-1 text-sm">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-md px-2 py-2 text-slate-700 hover:bg-slate-100">
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
