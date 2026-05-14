import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOwnedProjects, getSharedProjects } from "@/lib/data/projects";
import { EditorHome } from "@/components/editor/editor-home";

export default async function EditorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(userId),
    email ? getSharedProjects(email) : Promise.resolve([]),
  ]);

  return <EditorHome ownedProjects={ownedProjects} sharedProjects={sharedProjects} />;
}