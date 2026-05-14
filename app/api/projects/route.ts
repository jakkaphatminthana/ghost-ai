import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let projects: { id: string; name: string; description: string | null; status: string; createdAt: Date; updatedAt: Date }[]
  try {
    projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
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

  return Response.json({ projects })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Untitled Project'
  const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined

  let project: { id: string; name: string; description: string | null; status: string; createdAt: Date; updatedAt: Date }
  try {
    project = await prisma.project.create({
      data: { ...(id ? { id } : {}), ownerId: userId, name },
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
    return Response.json({ error: 'Project creation failed' }, { status: 500 })
  }

  return Response.json({ project }, { status: 201 })
}