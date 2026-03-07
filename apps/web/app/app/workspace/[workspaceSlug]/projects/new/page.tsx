import { redirect } from "next/navigation";

export default async function NewProjectPage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  await params;
  redirect("/app/projects/new");
}
