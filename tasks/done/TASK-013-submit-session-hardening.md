---
id: TASK-013
title: submitSession — projectKey auth and schema validation
status: done
model: medium
model-name: GPT-5.2
depends-on: TASK-012
context:
  - docs/context/firebase.md
  - docs/context/session-data-format.md
doc-impact:
  - docs/context/firebase.md
  - docs/context/session-data-format.md
---

## Description

Harden the existing `submitSession` function in `functions/src/index.ts` with two additions:

1. **ProjectKey auth**: validate `projectKey` from the request against `projects/{projectId}.projectKey` in Firestore. Reject with `permission-denied` on mismatch. This mirrors the auth pattern introduced in TASK-012 for `bakeSchema`.

2. **Schema validation**: after auth, fetch `projects/{projectId}/schemas/{metaData.schemaVersion}`. If that document exists, verify every `column.columnName` in the schema is present as a `columnName` in `sessionData.data`. Reject with `invalid-argument` and a list of missing column names if any are absent. If no schema document exists for the version, skip validation and write the session as-is (backward compat).

**Note:** `projectKey` must be added to `SubmitSessionRequest` in `functions/src/types.ts`. The Unity SDK will need to send it in the callable request body.

## Acceptance Criteria

- [ ] `SubmitSessionRequest` in `functions/src/types.ts` has `projectKey: string` field
- [ ] `submitSession` reads `projects/{projectId}` and throws `permission-denied` if `projectKey` does not match
- [ ] `submitSession` fetches `projects/{projectId}/schemas/{metaData.schemaVersion}` after auth
- [ ] If schema document exists, collects all `column.columnName` values from the schema, finds which are absent from `sessionData.data` entries, and throws `invalid-argument` with a descriptive message listing the missing column names
- [ ] If no schema document exists, skips validation entirely and proceeds to write
- [ ] Session write to `projects/{projectId}/sessions/{sessionId}` is unchanged
- [ ] Returns `{ success: true }` on success

## Relevant Data

**Current `functions/src/index.ts`** (full file — replace `submitSession` implementation):
```ts
export const submitSession = functions.https.onCall(
  async (request: functions.https.CallableRequest<SubmitSessionRequest>) => {
    const { sessionData } = request.data;

    if (!sessionData?.metaData?.projectId || !sessionData?.metaData?.sessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required metaData fields');
    }

    const { projectId, sessionId } = sessionData.metaData;

    await admin.firestore().collection('projects').doc(projectId)
      .collection('sessions').doc(sessionId).set({ sessionData });

    return { success: true };
  }
);
```

**Updated `SubmitSessionRequest` type** (add to `functions/src/types.ts`):
```ts
export interface SubmitSessionRequest {
  projectKey: string;
  sessionData: SessionData;
}
```

**Schema types** (defined in TASK-012, will exist in `functions/src/types.ts` after TASK-012 is done):
```ts
export interface SchemaColumn {
  columnName: string;
  dataType?: 'string' | 'number' | 'boolean' | null;
}
export interface ProjectSchema {
  columns: SchemaColumn[];
  bakedAt: string;
}
```

**Auth pattern** (same as TASK-012):
```ts
const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
if (!projectDoc.exists) {
  throw new functions.https.HttpsError('not-found', 'Project not found');
}
if (projectDoc.data()?.projectKey !== projectKey) {
  throw new functions.https.HttpsError('permission-denied', 'Invalid project key');
}
```

**Schema validation pattern**:
```ts
const schemaDoc = await admin.firestore()
  .collection('projects').doc(projectId)
  .collection('schemas').doc(sessionData.metaData.schemaVersion)
  .get();

if (schemaDoc.exists) {
  const schema = schemaDoc.data() as ProjectSchema;
  const submittedColumns = new Set(sessionData.data.map((d) => d.columnName));
  const missingColumns = schema.columns
    .map((c) => c.columnName)
    .filter((name) => !submittedColumns.has(name));

  if (missingColumns.length > 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Session data is missing required columns: ${missingColumns.join(', ')}`
    );
  }
}
```
