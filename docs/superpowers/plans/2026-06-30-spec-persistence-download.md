# Feature 28: Spec Persistence & Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist generated Markdown specs to Vercel Blob, store metadata in Prisma, and expose a secure per-spec download route.

**Architecture:** The `generate-spec` Trigger.dev task uploads generated Markdown to Vercel Blob after a successful run and writes a `ProjectSpec` record in PostgreSQL (URL only — no content). A `GET /api/projects/[projectId]/specs/[specId]/download` route authenticates the user, verifies project access and spec ownership, then streams the Blob content as a Markdown attachment.

**Tech Stack:** Prisma + PostgreSQL, `@vercel/blob` (`put`/`get`), Next.js route handlers, Clerk auth (`getClerkIdentity`, `getProjectAccess`), Trigger.dev tasks.

## Global Constraints

- No frontend or UI changes.
- Do not store Markdown content in PostgreSQL — only the Blob URL (`filePath`).
- Never expose raw Blob URLs to the client; all downloads go through the access-controlled route.
- Do not modify existing canvas persistence routes or models.
- TypeScript strict mode throughout; no `any`.

---

### Task 1: Add ProjectSpec Prisma model and migrate

**Files:**
- Create: `prisma/models/project-spec.prisma`
- Modify: `prisma/models/project.prisma` (add `specs ProjectSpec[]` back-relation to `Project`)

**Interfaces:**
- Produces: `ProjectSpec` model with `id String @id @default(cuid())`, `projectId String`, `filePath String`, `createdAt DateTime @default(now())`, cascade-delete relation to `Project`. `Project` model gains `specs ProjectSpec[]`.

- [ ] **Step 1: Create `prisma/models/project-spec.prisma`**

```prisma
model ProjectSpec {
  id        String   @id @default(cuid())
  projectId String
  filePath  String
  createdAt DateTime @default(now())
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([projectId, createdAt])
}
```

- [ ] **Step 2: Add `specs` back-relation to `Project` in `prisma/models/project.prisma`**

Replace the existing `Project` model with:

```prisma
model Project {
  id             String               @id @default(cuid())
  ownerId        String
  name           String
  description    String?
  status         ProjectStatus        @default(DRAFT)
  canvasJsonPath String?
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt
  collaborators  ProjectCollaborator[]
  specs          ProjectSpec[]

  @@index([ownerId])
  @@index([createdAt])
}
```

- [ ] **Step 3: Run the migration**

```bash
npx prisma migrate dev --name add_project_spec
```

Expected output: `The following migration(s) have been created and applied from new schema changes:`

- [ ] **Step 4: Verify the generated client includes `ProjectSpec`**

```bash
grep -r "projectSpec" app/generated/prisma/index.d.ts | head -5
```

Expected: lines referencing `projectSpec` Prisma delegate methods.

- [ ] **Step 5: Commit**

```bash
git add prisma/models/project-spec.prisma prisma/models/project.prisma prisma/migrations/
git commit -m "feat: add ProjectSpec Prisma model for spec metadata"
```

---

### Task 2: Persist generated spec in the generate-spec task

**Files:**
- Modify: `trigger/generate-spec.ts`

**Interfaces:**
- Consumes: `ProjectSpec` model from Task 1 — `prisma.projectSpec.create({ data: { projectId, filePath }, select: { id: true } })` returns `{ id: string }`.
- Produces: task return type changes from `{ spec: string }` to `{ spec: string; specId: string }` where `specId` is the new `ProjectSpec` record's `id`.

- [ ] **Step 1: Add imports for `@vercel/blob` and Prisma at the top of `trigger/generate-spec.ts`**

After the existing imports, add:

```typescript
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
```

- [ ] **Step 2: Replace the completion block at the end of `run` with blob upload + DB write**

Find and replace this existing block (lines after Groq generation succeeds through `return { spec }`):

```typescript
    await liveblocks.broadcastEvent(payload.roomId, {
      type: "ai-status",
      status: "complete",
      text: "Technical specification generated.",
    });

    logger.log("Spec generation complete", {
      projectId: payload.projectId,
      specLength: spec.length,
    });

    return { spec };
```

Replace with:

```typescript
    let specId: string;
    try {
      const blob = await put(
        `specs/${payload.projectId}/${Date.now()}.md`,
        spec,
        { access: "private", contentType: "text/markdown", addRandomSuffix: true }
      );
      const record = await prisma.projectSpec.create({
        data: { projectId: payload.projectId, filePath: blob.url },
        select: { id: true },
      });
      specId = record.id;
    } catch (err) {
      logger.error("Failed to persist spec", { err });
      await liveblocks.broadcastEvent(payload.roomId, {
        type: "ai-status",
        status: "error",
        text: "Spec generated but could not be saved. Please try again.",
      });
      throw err;
    }

    await liveblocks.broadcastEvent(payload.roomId, {
      type: "ai-status",
      status: "complete",
      text: "Technical specification generated.",
    });

    logger.log("Spec generation complete", {
      projectId: payload.projectId,
      specLength: spec.length,
      specId,
    });

    return { spec, specId };
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add trigger/generate-spec.ts
git commit -m "feat: upload generated spec to Vercel Blob and persist ProjectSpec record"
```

---

### Task 3: Secure spec download route

**Files:**
- Create: `app/api/projects/[projectId]/specs/[specId]/download/route.ts`

**Interfaces:**
- Consumes: `getClerkIdentity()` → `ClerkIdentity | null` from `@/lib/project-access`
- Consumes: `getProjectAccess(projectId, userId, email)` → `{ id: string; name: string; isOwner: boolean } | null` from `@/lib/project-access`
- Consumes: `prisma.projectSpec.findUnique({ where: { id: specId }, select: { projectId: true, filePath: true } })` → `{ projectId: string; filePath: string } | null`
- Consumes: `get(filePath, { access: 'private' })` from `@vercel/blob` — returns object with `stream: ReadableStream | null`
- Produces: `GET /api/projects/[projectId]/specs/[specId]/download` — streams `text/markdown` attachment, or returns 401/403/404 JSON.

- [ ] **Step 1: Create the route file**

Create `app/api/projects/[projectId]/specs/[specId]/download/route.ts`:

```typescript
import { get } from "@vercel/blob";
import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const identity = await getClerkIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, specId } = await params;

  const access = await getProjectAccess(projectId, identity.userId, identity.email);
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let spec: { projectId: string; filePath: string } | null;
  try {
    spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
      select: { projectId: true, filePath: true },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (!spec) return Response.json({ error: "Not found" }, { status: 404 });
  if (spec.projectId !== projectId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let blob: Awaited<ReturnType<typeof get>>;
  try {
    blob = await get(spec.filePath, { access: "private" });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (!blob?.stream) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build completes without type errors or compilation failures.

- [ ] **Step 4: Commit**

```bash
git add "app/api/projects/[projectId]/specs/[specId]/download/route.ts"
git commit -m "feat: add secure spec download route with project access validation"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| `ProjectSpec` model with `id`, `projectId`, `filePath`, `createdAt` | Task 1 |
| Upload Markdown to Vercel Blob after generation | Task 2 Step 2 |
| Store Blob URL in `ProjectSpec.filePath` | Task 2 Step 2 |
| Link record to correct project | Task 2 Step 2 (`projectId` field) |
| Same metadata+blob pattern as canvas | Both use `put`/`get` with `access: 'private'`, URL stored in DB |
| Download route at correct path | Task 3 |
| Authenticate user | Task 3 (`getClerkIdentity`) |
| Verify project access | Task 3 (`getProjectAccess`) |
| Verify spec belongs to project | Task 3 (`spec.projectId !== projectId` check) |
| Fetch file via `filePath` | Task 3 (`get(spec.filePath, ...)`) |
| Return as Markdown attachment | Task 3 (`Content-Disposition: attachment`) |
| Handle not found and forbidden | Task 3 (404/403 responses) |
| TypeScript and build pass | Task 2 Step 3, Task 3 Steps 2–3 |
| No frontend/UI changes | ✅ scoped to task + API only |
| No spec content in Prisma | ✅ only `filePath` stored |
| No raw Blob URL exposure | ✅ route enforces access before streaming |
| Canvas persistence untouched | ✅ no canvas files modified |
