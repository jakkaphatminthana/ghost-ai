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

  const raw: unknown = await request.json().catch(() => ({}))
  const body = typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Untitled Project'
  const SAFE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,99}$/
  const rawId = typeof body.id === 'string' ? body.id.trim() : ''
  const id = SAFE_ID_RE.test(rawId) ? rawId : undefined

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