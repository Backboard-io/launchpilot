import { redirect } from "next/navigation";

export default async function PositioningPage({
  params
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  redirect(`/app/projects/${projectSlug}/positioning`);
}
