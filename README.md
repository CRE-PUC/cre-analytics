# CRE Analytics

A session-based analytics platform for Unity applications. Unity projects instrument their sessions using the SDK, aggregate all data locally, then send one document per session to a Firebase backend. A Next.js backoffice lets the team read, filter, and export session data.

---

## Overview

1. Unity SDK (`packages/com.cre.analytics/`) collects session data and aggregates it locally
2. At session end, the SDK sends a single document to Firebase Functions
3. Firestore stores the session document under `projects/{projectId}/sessions/{sessionId}`
4. Next.js backoffice (`backoffice/`) provides a dashboard to view, filter, and export sessions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Unity SDK | UPM package (`packages/com.cre.analytics`) |
| Backend | Firebase Functions (TypeScript) |
| Database | Firestore |
| Backoffice | Next.js + Firebase Hosting |
| UI library | @cre/web-ui (internal, `packages/cre-web-ui`) |
| Package manager | pnpm workspaces |

---

## Local Development

### Prerequisites
- Node.js 20
- pnpm
- Firebase CLI

### Setup
```bash
pnpm install
pnpm dev
```

This starts:
- Firebase Emulators UI at http://localhost:4000
- Next.js backoffice at http://localhost:3000

---

## Creating a Project

1. Open the backoffice at http://localhost:3000
2. Create a new project
3. Copy the Project ID and Project Key
4. Configure these values in the Unity SDK

The Unity SDK requires both values to authenticate and route session data to the correct project in Firestore.

---

## Contributing

This repo uses a Claude → Windsurf pipeline for development:
- Tasks live in `tasks/`
- Claude creates tasks based on architectural decisions
- Windsurf executes tasks to acceptance criteria
- Completed tasks move to `tasks/done/`

See `docs/architecture.md` for detailed system documentation.
