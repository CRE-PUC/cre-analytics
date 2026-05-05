# Architecture

> Keep this file current. If a decision is made during a Claude session, update it before ending the session.

---

## Overview

CRE Analytics is a multi-stack monorepo providing a session-based analytics platform for Unity applications. Unity projects instrument their sessions using the SDK, aggregate all data locally, then send one document per session to a Firebase backend. A Next.js backoffice lets the team read, filter, and export session data.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | Firebase Functions (TypeScript) | Single HTTP endpoint per session submission |
| Database | Firestore | One document per session, under `projects/{projectId}/sessions/{sessionId}` |
| Backoffice | Next.js (React), Firebase Hosting | Internal dashboard — table view, column selector, CSV export |
| UI Library | `@cre/web-ui` at `packages/cre-web-ui/` | Token-driven React component library; consumed by backoffice via pnpm workspace |
| Package manager | pnpm with workspaces | Used for `functions/`, `backoffice/`, and `packages/cre-web-ui/` — not for Unity |
| Unity SDK | UPM package at `packages/com.cre.analytics/` | Distributed via Git URL with `?path=packages/com.cre.analytics` |
| CI/CD | GitHub Actions | Two separate workflows: Firebase deploy, UPM package validation |
| Unity version | 6000.0.74f1 | Minimum supported Unity version for UPM consumers |

---

## Project Structure

```
cre-analytics/
├── packages/
│   ├── com.cre.analytics/     # Unity UPM package (SDK)
│   │   ├── package.json       # Unity package manifest
│   │   ├── Runtime/           # C# runtime — schema, session, sender
│   │   ├── Editor/            # Unity editor tools (Bake Analytics window)
│   │   ├── Tests/
│   │   └── AGENTS.md          # Unity-specific rules for Windsurf
│   └── cre-web-ui/            # React component library (@cre/web-ui)
│       ├── src/
│       │   ├── index.ts       # Public API
│       │   ├── components/    # Interactive components (documented in Storybook)
│       │   │   └── undocumented/  # New components pending Storybook migration
│       │   ├── primitives/    # Layout & typography primitives
│       │   ├── theme/         # Token system & CSS vars
│       │   └── DsTokens/      # Figma JSON exports (READ-ONLY)
│       ├── dist/              # Built output (not in git)
│       ├── AGENTS.md          # Windsurf rules for this package
│       └── STORYBOOK_SYNC.md  # Cross-repo change log for Storybook migration
├── functions/                 # Firebase Functions backend
│   └── src/
├── backoffice/                # Next.js dashboard
│   └── src/
├── unity-project/             # Unity project used to develop the package (created manually by user)
│   └── Packages/
│       └── manifest.json      # references com.cre.analytics via local file path
├── .github/
│   └── workflows/
│       ├── firebase-deploy.yml
│       └── upm-validate.yml
├── firebase.json
├── .firebaserc
├── pnpm-workspace.yaml
└── docs/
    ├── architecture.md
    ├── sync-queue.md
    └── context/
        ├── unity-sdk.md
        ├── session-data-format.md
        ├── firebase.md
        ├── web-ui.md
        ├── token-system.md
        └── component-patterns.md
```

---

## Key Architectural Decisions

### Session-based analytics (not event-based)
Unity aggregates all session data locally and sends one Firestore document per session at the end. This keeps write costs predictable, avoids per-event quota pressure, and lets Unity pre-aggregate data before sending.

### Session schema via ScriptableObject ("Bake Analytics")
Each Unity project defines its analytics schema as a `SessionSchema` ScriptableObject — a list of fields with column names, types, and optional descriptions. A Unity Editor tool ("Bake Analytics") validates and versions the schema. The SDK serializes all defined fields into `columnName/value` pairs, always including every field (even if empty), so all sessions of the same schema version have a coherent, predictable shape.

### Schema versioning
The `schemaVersion` in `metaData` corresponds to the ScriptableObject version when it was baked. Old session documents remain readable even after schema changes. The dashboard can filter by schema version if needed.

### Multi-project support via Firestore path
Firestore path: `projects/{projectId}/sessions/{sessionId}`. Projects are created in the backoffice — each gets a UUID `projectId` (Firestore document ID) and a UUID `projectKey` (secret for Unity SDK auth). The Unity SDK is configured with both values. A single Firebase deployment hosts all analytics projects. The backoffice scopes views by `projectId`.

### Schema baking
Before submitting sessions, Unity bakes the schema by calling `bakeSchema` with the list of column names (and optional data types for display). This stores a `ProjectSchema` document at `projects/{projectId}/schemas/{schemaVersion}`. The `submitSession` function validates incoming session data against the stored schema when one exists for the given version. If no schema exists for a version, the session is accepted without column validation (backward compat).

See `docs/context/projects.md`.

### Column name hierarchy with `/` separator
Column names use `/` as a hierarchy separator (e.g., `Tutorial Diegetico/Cliques/Botão A`). The dashboard treats these as a tree for column selection and display — not flat strings.

### Backoffice access
Internal-only for now using Firebase Authentication. Auth is not coupled to a single access level — the Firestore path structure (`projects/{projectId}/...`) already supports future per-project scoping without requiring a data migration.

### UPM distribution via `?path=`
The UPM package lives in a subfolder of the monorepo. Users install it in Unity Package Manager with the Git URL format: `https://github.com/{org}/cre-analytics.git?path=packages/com.cre.analytics`. No separate package repo needed.

---

## Modules & Domains

### `packages/com.cre.analytics/`
Unity UPM package. See `docs/context/unity-sdk.md` for structure, conventions, and the manual steps required when working in this module.

### `functions/`
Firebase Functions (TypeScript). A single Gen 2 `onRequest` export (`api`) serves an Express app deployed to the `southamerica-east1` (São Paulo) region. Request body validation uses Zod. Source structure:

```
functions/src/
├── index.ts              # exports: api = onRequest({ region: 'southamerica-east1' }, app)
├── app.ts                # Express app setup + route registration
├── middleware/
│   └── validateProjectKey.ts   # reads projectId+projectKey from body, validates against Firestore
├── controllers/
│   ├── schemas.controller.ts   # POST /schemas/bake
│   └── sessions.controller.ts  # POST /sessions
├── routes/
│   └── index.ts
└── types.ts
```

Routes:
- `POST /schemas/bake` — validates projectKey, stores column definitions at `projects/{projectId}/schemas/{schemaVersion}`
- `POST /sessions` — validates projectKey + schema columns, writes to `projects/{projectId}/sessions/{sessionId}`

See `docs/context/firebase.md`.

### `backoffice/`
Next.js dashboard hosted on Firebase Hosting. Two main views:
- **Projects** (`/projects`) — CRUD management of analytics projects.
- **Inspect** (`/projects/inspect?id={projectId}`) — sessions table for a project, with hierarchical column headers derived from `/`-separated column names, filtered by schema version.

All UI is built with `@cre/web-ui` — no standalone CSS frameworks. The `Table` component's `groupSeparator="/"` prop renders nested column groups automatically.

See `docs/context/firebase.md`.

### `packages/cre-web-ui/`
Token-driven React component library. 14 interactive components, 12 layout/typography primitives, and a Figma-sourced design token system (CSS custom properties, light/dark theme). Consumed by `backoffice/` via pnpm workspace linking.

Will eventually migrate to the dedicated `web-ui` repo with Storybook documentation. Until then, new components go in `src/components/undocumented/` and all changes are logged in `STORYBOOK_SYNC.md` for handoff.

See `docs/context/web-ui.md`, `docs/context/token-system.md`, `docs/context/component-patterns.md`.

---

## External Dependencies & Integrations

- **Firebase** (single project): Functions, Firestore, Hosting, Authentication
- **Unity 6000.0.74f1** — minimum version for UPM consumers; the development project in `unity-project/` uses this version
- **Figma** — source of truth for the design token JSON files (`packages/cre-web-ui/src/DsTokens/`); those files are read-only in this repo

---

## Known Constraints & Non-Negotiables

- Unity projects **cannot be created or compiled by Windsurf** — see `docs/context/unity-sdk.md` for all Unity manual steps
- All Node.js package management uses **pnpm**, never npm or yarn
- Schema versioning must be preserved — old session documents must remain readable after schema changes
- The `data` array in a session document must always contain **all fields defined in the schema**, even if values are empty — this is what makes the data model coherent across sessions
