import { redirect } from "next/navigation";

export default async function ExecutionPage({
  params
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  redirect(`/app/projects/${projectSlug}/execution/plan`);
}
