import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'malformed JSON' }, { status: 400 })
  }
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : undefined
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  let result: { count: number }
  try {
    result = await prisma.project.updateMany({
      where: { id: projectId, ownerId: userId },
      data: { name },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  if (result.count === 0) {
    let exists: { id: string } | null
    try {
      exists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
    } catch (err) {
      console.error(err)
      return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return exists
      ? Response.json({ error: 'Forbidden' }, { status: 403 })
      : Response.json({ error: 'Not found' }, { status: 404 })
  }

  let updated: { id: string; name: string; description: string | null; status: string; createdAt: Date; updatedAt: Date } | null
  try {
    updated = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
  if (!updated) return Response.json({ error: 'Internal Server Error' }, { status: 500 })

  return Response.json({ project: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  let result: { count: number }
  try {
    result = await prisma.project.deleteMany({
      where: { id: projectId, ownerId: userId },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  if (result.count === 0) {
    let exists: { id: string } | null
    try {
      exists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
    } catch (err) {
      console.error(err)
      return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return exists
      ? Response.json({ error: 'Forbidden' }, { status: 403 })
      : Response.json({ error: 'Not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}