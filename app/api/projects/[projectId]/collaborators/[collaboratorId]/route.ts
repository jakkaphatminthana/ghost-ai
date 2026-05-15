import { prisma } from '@/lib/prisma'
import { getClerkIdentity, getProjectAccess } from '@/lib/project-access'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; collaboratorId: string }> }
) {
  const identity = await getClerkIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, collaboratorId } = await params

  const access = await getProjectAccess(projectId, identity.userId, identity.email)
  if (!access) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!access.isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await prisma.projectCollaborator.delete({
      where: { id: collaboratorId, projectId },
    })
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2025'
    ) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}