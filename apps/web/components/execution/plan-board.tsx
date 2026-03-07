export function PlanBoard({ tasks }: { tasks: { day_number: number; title: string }[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <div key={`${task.day_number}-${task.title}`} className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Day {task.day_number}</p>
          <p className="text-sm font-medium text-slate-900">{task.title}</p>
        </div>
      ))}
    </div>
  );
}
