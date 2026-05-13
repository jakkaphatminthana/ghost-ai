<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Application Building Context

Read the following files in order before implementing or making any architectural decision:
 
1. `context/project-overview.md` — product definition, goals, features, and scope
2. `context/architecture-context.md` — system structure, boundaries, storage model, and invariants
3. `context/ui-context.md` — theme, colors, typography, canvas design, and component conventions
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase, completed work, open questions, and next steps

Update `context/progress-tracker.md` after each meaningful implementation change.

### Working on `context/feature-specs/*`

Whenever a task involves a file under `context/feature-specs/` (reading the spec to implement it, editing the spec, or building the feature it describes), update `context/progress-tracker.md` **twice**:

**At the start of the work:**
- Set `## Current Phase` to the feature (e.g. `Feature 04: Editor canvas`).
- Set `## Current Goal` to the concrete goal for this session.
- Add the feature under `## In Progress`.

**At the end of the work (before reporting done):**
- Move the feature from `## In Progress` to `## Completed` with a one-line summary of what shipped.
- Update `## Next Up`.
- Add any new entries to `## Open Questions`, `## Architecture Decisions`, or `## Session Notes` if applicable.

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.