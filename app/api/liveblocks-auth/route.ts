import { currentUser } from "@clerk/nextjs/server";
import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";

export async function POST(request: Request) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { userId, email } = identity;

  let body: { room?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const projectId = body.room?.trim() ?? "";
  if (!projectId) {
    return new Response("Bad Request", { status: 400 });
  }

  const project = await getProjectAccess(projectId, userId, email);
  if (!project) {
    return new Response("Forbidden", { status: 403 });
  }

  const user = await currentUser();
  const name =
    user?.fullName ??
    user?.emailAddresses[0]?.emailAddress ??
    "Anonymous";
  const avatar = user?.imageUrl ?? "";
  const color = getUserColor(userId);
  const lb = getLiveblocks();

  await lb.getOrCreateRoom(projectId, { defaultAccesses: [] });
  await lb.updateRoom(projectId, {
    usersAccesses: { [userId]: ["room:write"] },
  });

  const { status, body: responseBody } = await lb.identifyUser(
    userId,
    { userInfo: { name, avatar, color } }
  );

  return new Response(responseBody, { status });
}