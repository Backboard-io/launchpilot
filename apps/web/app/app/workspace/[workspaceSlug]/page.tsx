import { redirect } from "next/navigation";

export default async function WorkspaceDashboardPage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  await params;
  redirect("/app/projects");
}
