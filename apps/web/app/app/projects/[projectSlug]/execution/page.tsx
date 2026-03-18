import { redirect } from "next/navigation";

export default async function ExecutionIndexPage({
  params
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  redirect(`/app/projects/${projectSlug}/execution/plan`);
}
