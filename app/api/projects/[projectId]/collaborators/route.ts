import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getClerkIdentity, getProjectAccess } from '@/lib/project-access'

interface CollaboratorProfile {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function enrichEmails(
  collaborators: { id: string; email: string }[]
): Promise<CollaboratorProfile[]> {
  if (collaborators.length === 0) return []

  const emails = collaborators.map((c) => c.email)
  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({
    emailAddress: emails,
    limit: emails.length,
  })

  const profileMap = new Map<string, { name: string | null; avatarUrl: string | null }>()
  for (const user of users) {
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )
    if (!primary) continue
    const nameParts = [user.firstName, user.lastName].filter(Boolean)
    profileMap.set(primary.emailAddress, {
      name: nameParts.length > 0 ? nameParts.join(' ') : (user.username ?? null),
      avatarUrl: user.imageUrl ?? null,
    })
  }

  return collaborators.map((c) => ({
    id: c.id,
    email: c.email,
    name: profileMap.get(c.email)?.name ?? null,
    avatarUrl: profileMap.get(c.email)?.avatarUrl ?? null,
  }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getClerkIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const access = await getProjectAccess(projectId, identity.userId, identity.email)
  if (!access) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const rows = await prisma.projectCollaborator.findMany({
      where: { projectId },
      select: { id: true, email: true },
      orderBy: { createdAt: 'asc' },
    })
    const collaborators = await enrichEmails(rows)
    return Response.json({ collaborators })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getClerkIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON' }, { status: 400 })
  }

  const email =
    typeof body.email === 'string' && body.email.trim()
      ? body.email.trim().toLowerCase()
      : undefined
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const access = await getProjectAccess(projectId, identity.userId, identity.email)
  if (!access) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!access.isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let collaborator: { id: string; email: string }
  try {
    collaborator = await prisma.projectCollaborator.create({
      data: { projectId, email },
      select: { id: true, email: true },
    })
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return Response.json({ error: 'Already a collaborator' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  try {
    const [enriched] = await enrichEmails([collaborator])
    return Response.json({ collaborator: enriched }, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json(
      { collaborator: { ...collaborator, name: null, avatarUrl: null } },
      { status: 201 }
    )
  }
}