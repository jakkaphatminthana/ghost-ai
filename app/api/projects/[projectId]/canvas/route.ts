import { put, get } from '@vercel/blob'
import { getClerkIdentity, getProjectAccess } from '@/lib/project-access'
import { prisma } from '@/lib/prisma'
import type { CanvasNode, CanvasEdge } from '@/types/canvas'

interface CanvasBody {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getClerkIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const access = await getProjectAccess(projectId, identity.userId, identity.email)
  if (!access) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let body: CanvasBody
  try {
    body = (await request.json()) as CanvasBody
  } catch {
    return Response.json({ error: 'malformed JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return Response.json({ error: 'nodes and edges are required' }, { status: 400 })
  }

  let blobUrl: string
  try {
    const blob = await put(
      `canvas/${projectId}.json`,
      JSON.stringify({ nodes: body.nodes, edges: body.edges }),
      { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true }
    )
    blobUrl = blob.url
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to upload canvas' }, { status: 500 })
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blobUrl },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return Response.json({ url: blobUrl })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getClerkIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
 
  const access = await getProjectAccess(projectId, identity.userId, identity.email)
  if (!access) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let project: { canvasJsonPath: string | null } | null
  try {
    project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { canvasJsonPath: true },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  if (!project?.canvasJsonPath) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  let canvas: unknown
  try {
    const blob = await get(project.canvasJsonPath, { access: 'private' })
    if (!blob || !blob.stream) return Response.json({ error: 'Failed to fetch canvas' }, { status: 502 })
    canvas = await new Response(blob.stream).json()
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return Response.json(canvas)
}
