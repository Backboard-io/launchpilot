import Link from "next/link";

export default function WorkspaceSelectorPage() {
  const workspaces = [
    { slug: "personal", name: "Personal Workspace", role: "owner", members: 1, projects: 2 },
    { slug: "launch-team", name: "Launch Team", role: "operator", members: 3, projects: 1 }
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Choose Workspace</h1>
          <p className="text-sm text-slate-600">Select a personal or team workspace.</p>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => (
          <article key={workspace.slug} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-medium">{workspace.name}</h2>
            <p className="mt-1 text-sm text-slate-600">Role: {workspace.role}</p>
            <p className="text-sm text-slate-600">Members: {workspace.members}</p>
            <p className="text-sm text-slate-600">Projects: {workspace.projects}</p>
            <Link href={`/app/workspace/${workspace.slug}`} className="mt-3 inline-block rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white">
              Open
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
