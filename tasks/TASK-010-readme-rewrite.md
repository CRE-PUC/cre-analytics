---
id: TASK-010
title: Rewrite README for CRE Analytics
status: pending
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
doc-impact: []
---

## Description

The current `README.md` describes the repo as a "Claude → Windsurf Pipeline" reference template. This is wrong — the repo is the CRE Analytics product. Rewrite `README.md` from scratch to accurately describe what this system is.

## Acceptance Criteria

- [ ] README describes CRE Analytics as a session analytics platform for Unity applications
- [ ] README has a concise overview section: Unity SDK collects session data → sends to Firebase → backoffice lets the team read and manage it
- [ ] README has a tech stack table (Unity SDK, Firebase Functions, Firestore, Next.js backoffice, @cre/web-ui)
- [ ] README has a "Local development" section: prerequisites (Node 20, pnpm, Firebase CLI), then `pnpm install` + `pnpm dev`, with what opens (emulator UI at localhost:4000, backoffice at localhost:3000)
- [ ] README has a "Creating a project" section explaining: open the backoffice, create a project, copy the Project ID and Project Key, configure them in the Unity SDK
- [ ] README has a brief "Contributing" section explaining the Claude/Windsurf pipeline: tasks live in `tasks/`, Claude creates them, Windsurf executes them
- [ ] No trace of the old template content remains — nothing about "clone this as a base", "reference repo", or instructions aimed at people using this as a starting template

## Relevant Data

**Current README.md content to discard** — the whole file is about the Claude/Windsurf pipeline pattern and treats this as a generic template repo. Ignore it entirely and write fresh.

**Local dev commands (from TASK-006):**
- `pnpm install` — install all workspace deps from root
- `pnpm dev` — starts Firebase Emulators (localhost:4000) + Next.js dev server (localhost:3000)

**Tech stack:**
| Layer | Technology |
|-------|-----------|
| Unity SDK | UPM package (`packages/com.cre.analytics`) |
| Backend | Firebase Functions (TypeScript) |
| Database | Firestore |
| Backoffice | Next.js + Firebase Hosting |
| UI library | @cre/web-ui (internal, `packages/cre-web-ui`) |
| Package manager | pnpm workspaces |

**Tone:** internal tool docs — direct and practical, not marketing. No emoji.
