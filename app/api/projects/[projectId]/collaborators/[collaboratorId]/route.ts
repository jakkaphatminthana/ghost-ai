import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; collaboratorId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, collaboratorId } = await params

  let project: { ownerId: string } | null
  try {
    project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

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