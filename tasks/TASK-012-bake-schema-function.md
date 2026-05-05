---
id: TASK-012
title: Firebase Function — bakeSchema endpoint
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/session-data-format.md
doc-impact:
  - docs/context/firebase.md
  - docs/context/session-data-format.md
---

## Description

Add a new HTTPS callable Firebase Function `bakeSchema` to `functions/src/index.ts`. Unity's Editor tool ("Bake Analytics") calls this endpoint when the developer bakes their schema, before any sessions are submitted for a new schema version.

The function stores the column definitions for a specific `schemaVersion` under `projects/{projectId}/schemas/{schemaVersion}` in Firestore. This is the source of truth the dashboard uses to determine which columns a project has, and what `submitSession` uses to validate incoming session data.

Auth uses the same `projectKey` pattern planned for `submitSession`: read the project document from Firestore and compare `projectKey` fields.

Also update `firestore.rules` to allow authenticated backoffice users to read the `schemas` subcollection.

## Acceptance Criteria

- [ ] New function `bakeSchema` exported from `functions/src/index.ts`
- [ ] Validates required fields: `projectId` (non-empty string), `schemaVersion` (non-empty string), `columns` (non-empty array), `projectKey` (non-empty string)
- [ ] Reads `projects/{projectId}` from Firestore — throws `not-found` if project doesn't exist
- [ ] Compares request `projectKey` to project document `projectKey` — throws `permission-denied` on mismatch
- [ ] Writes to `projects/{projectId}/schemas/{schemaVersion}` with `{ columns, bakedAt }` (upsert — overwrite if exists)
- [ ] New types added to `functions/src/types.ts`: `SchemaColumn`, `ProjectSchema`, `BakeSchemaRequest`
- [ ] `firestore.rules` updated: authenticated users can `read` `projects/{projectId}/schemas/{schemaVersion}`; write is `false` (Functions write via Admin SDK, bypassing rules)
- [ ] Returns `{ success: true }` on success

## Relevant Data

**Request shape:**
```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "projectKey": "secret-uuid-here",
  "schemaVersion": "1.0.0",
  "columns": [
    { "columnName": "Tutorial Diegetico/Começou em" },
    { "columnName": "Tutorial Diegetico/Cliques/Botão A" },
    { "columnName": "Experiência Principal/Começou em" },
    { "columnName": "Experiência Principal/Cliques/Botão A" }
  ]
}
```

`dataType` is optional on each column. If omitted, store as `null`. Do not reject requests that omit it.

**Firestore write target** — `projects/{projectId}/schemas/{schemaVersion}`:
```json
{
  "columns": [
    { "columnName": "Tutorial Diegetico/Começou em", "dataType": null },
    { "columnName": "Tutorial Diegetico/Cliques/Botão A", "dataType": null }
  ],
  "bakedAt": "2026-05-05T12:00:00.000Z"
}
```

**New types for `functions/src/types.ts`:**
```ts
export interface SchemaColumn {
  columnName: string;
  dataType?: 'string' | 'number' | 'boolean' | null;
}

export interface ProjectSchema {
  columns: SchemaColumn[];
  bakedAt: string;
}

export interface BakeSchemaRequest {
  projectId: string;
  projectKey: string;
  schemaVersion: string;
  columns: SchemaColumn[];
}
```

**Current `firestore.rules`** (update to add the `schemas` match block):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null;

      match /sessions/{sessionId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }
  }
}
```

Add inside `match /projects/{projectId}`:
```
match /schemas/{schemaVersion} {
  allow read: if request.auth != null;
  allow write: if false;
}
```

**Auth pattern** (same for both functions):
```ts
const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
if (!projectDoc.exists) {
  throw new functions.https.HttpsError('not-found', 'Project not found');
}
if (projectDoc.data()?.projectKey !== projectKey) {
  throw new functions.https.HttpsError('permission-denied', 'Invalid project key');
}
```
