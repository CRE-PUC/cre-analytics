---
id: TASK-014
title: Backoffice — project inspect page (sessions table)
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/session-data-format.md
  - docs/context/web-ui.md
  - docs/context/component-patterns.md
doc-impact:
  - docs/architecture.md
---

## Description

Add a "sessions inspect" page to the backoffice at `backoffice/src/app/projects/inspect/page.tsx`. The page reads `?id={projectId}` from the URL query string, fetches all sessions from `projects/{projectId}/sessions/`, and renders them in a table with hierarchical column headers.

Also wire up the currently-disabled "Inspect" button in `backoffice/src/app/projects/page.tsx` to navigate to `/projects/inspect?id={projectId}`.

**Important constraint**: the backoffice uses `output: 'export'` (static export for Firebase Hosting). Use a fixed path `/projects/inspect` with a `?id=` query parameter — not a dynamic route like `/projects/[projectId]/page.tsx`, which would require `generateStaticParams` and can't enumerate dynamic UUIDs.

### Data shape in Firestore

Each session document stored at `projects/{projectId}/sessions/{sessionId}` has this shape:
```json
{
  "sessionData": {
    "metaData": {
      "projectId": "uuid",
      "schemaVersion": "1.0.0",
      "sessionId": "uuid",
      "platform": "quest_3",
      "startedAt": "2025-10-15T12:00:00.000Z",
      "endedAt": "2025-10-15T12:05:00.000Z"
    },
    "data": [
      { "columnName": "Tutorial Diegetico/Começou em", "value": "2025-10-15T10:00:00Z" },
      { "columnName": "Tutorial Diegetico/Cliques/Botão A", "value": 40 }
    ]
  }
}
```

### Row transformation

Transform each session document into a flat row object for the Table:
```ts
{
  __sessionId: string;       // session Firestore doc ID
  __schemaVersion: string;
  __platform: string;
  __startedAt: string;
  __endedAt: string;
  [columnName: string]: unknown;  // one key per data entry, key = columnName (with "/" intact)
}
```

Example:
```ts
{
  __sessionId: "1234",
  __schemaVersion: "1.0.0",
  __platform: "quest_3",
  __startedAt: "2025-10-15T12:00:00.000Z",
  __endedAt: "2025-10-15T12:05:00.000Z",
  "Tutorial Diegetico/Começou em": "2025-10-15T10:00:00Z",
  "Tutorial Diegetico/Cliques/Botão A": 40,
}
```

### Column construction

Collect all unique `columnName` values across all fetched sessions (union). Sort them alphabetically — this naturally groups `/`-prefixed siblings together. Build explicit `TableColumn` definitions for:

1. Fixed metaData columns (no `/` in key, so not grouped): `__sessionId`, `__schemaVersion`, `__platform`, `__startedAt`, `__endedAt`
2. One column per unique session data key. The header string is the last segment after the final `/` (e.g. key `"Tutorial Diegetico/Cliques/Botão A"` → header `"Botão A"`).

**Do not use `deriveColumns`** — build columns explicitly so you control order and headers.

### Table rendering

Use `<Table groupSeparator="/" ... />`. With `groupSeparator="/"`, the Table component automatically creates multi-row grouped header rows from the `/`-separated column keys. This is already implemented in `@cre/web-ui` — no changes to the Table component are needed.

`getNestedValue` (used by Table's default cell renderer) splits on `.` not `/`, so rows with `/`-keyed properties are accessed as direct object properties. No custom `render` function needed for data columns.

## Acceptance Criteria

- [ ] Page exists at `backoffice/src/app/projects/inspect/page.tsx`
- [ ] Reads `?id=` from URL using `useSearchParams()` (wrapped in `Suspense` as required by Next.js static export)
- [ ] If `?id=` is missing, shows an empty state or redirects to `/projects`
- [ ] Fetches all documents from `projects/{id}/sessions` collection via Firestore client
- [ ] Transforms session docs into flat row objects (metaData fields with `__` prefix + data fields with `/`-keyed names)
- [ ] Collects unique column names across all sessions, sorts them alphabetically, builds explicit `TableColumn` definitions
- [ ] Renders `<Table groupSeparator="/" />` — grouped headers appear automatically for `/`-separated column keys
- [ ] Shows loading state while fetching; shows empty state if no sessions found
- [ ] "Inspect" button in `backoffice/src/app/projects/page.tsx` navigates to `/projects/inspect?id={row.id}` (use Next.js `useRouter().push(...)` or `<Link>`)
- [ ] Page is wrapped in `<AuthGuard>` consistent with the rest of the backoffice
- [ ] All layout/UI uses `@cre/web-ui` components (Stack, Heading, Text, Table, etc.) — no inline CSS for visual styling

## Relevant Data

**`backoffice/src/app/projects/page.tsx`** — current "Inspect" button (line ~80):
```tsx
<Button size="small" disabled>
  Inspect
</Button>
```
Replace with a button that navigates to `/projects/inspect?id={row.id}`.

**`backoffice/src/lib/firebase.ts`** exports `db` — import and use `collection`, `getDocs` from `firebase/firestore`.

**`@cre/web-ui` Table props relevant here:**
```ts
<Table<SessionRow>
  columns={columns}         // explicit column definitions
  rows={rows}               // transformed session rows
  getRowId={(row) => row.__sessionId}
  groupSeparator="/"        // enables hierarchical header groups
  sortable={false}          // optional — no sort needed for MVP
/>
```

**Next.js static export + `useSearchParams`**: wrap the component reading `useSearchParams()` in `<Suspense fallback={...}>` — Next.js requires this for static export when `useSearchParams` is used.

**`backoffice/AGENTS.md`** rule: `output: 'export'` must stay. No SSR, no API routes, no server components that fetch at request time. All data fetching is client-side.
