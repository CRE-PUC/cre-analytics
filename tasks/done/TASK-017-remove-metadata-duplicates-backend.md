---
id: TASK-017
title: Remove duplicate fields from metaData schema (Backend)
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/context/session-data-format.md
  - docs/context/firebase.md
doc-impact:
  - docs/context/session-data-format.md
deploy-before: TASK-016
---

## Description

`platform`, `startedAt`, and `endedAt` are being removed from `metaData` on the Unity side (TASK-016). The backend Zod schema and TypeScript types must reflect this. These fields are redundant — the same data lives in the `Session/` entries of the `data` array.

**Deploy this backend change before or simultaneously with the Unity change (TASK-016).** Zod strips unknown fields by default, so deploying the new backend first is safe: sessions submitted by the old SDK will have their extra metaData fields silently stripped — no 400 errors.

---

## Files to modify

| File | Change |
|------|--------|
| `functions/src/types.ts` | Remove from `SessionMetaData` interface and from `SubmitSessionBodyZod` |

---

## types.ts changes

### `SessionMetaData` interface

```typescript
// Before
export interface SessionMetaData {
  projectId: string;
  schemaVersion: string;
  sessionId: string;
  platform: string;   // ← REMOVE
  startedAt: string;  // ← REMOVE
  endedAt: string;    // ← REMOVE
}

// After
export interface SessionMetaData {
  projectId: string;
  schemaVersion: string;
  sessionId: string;
}
```

### `SubmitSessionBodyZod` — metaData object

```typescript
// Before
metaData: z.object({
  projectId: z.string().min(1),
  schemaVersion: z.string().min(1),
  sessionId: z.string().min(1),
  platform: z.string().min(1),                           // ← REMOVE
  startedAt: z.string().datetime({ offset: true }),      // ← REMOVE
  endedAt: z.string().datetime({ offset: true }),        // ← REMOVE
}),

// After
metaData: z.object({
  projectId: z.string().min(1),
  schemaVersion: z.string().min(1),
  sessionId: z.string().min(1),
}),
```

No other files need to change. The `sessions.controller.ts` only reads `projectId`, `sessionId`, and `schemaVersion` from `metaData` — it does not reference `platform`, `startedAt`, or `endedAt`.

---

## Acceptance Criteria

- [ ] `SessionMetaData` interface has exactly three fields: `projectId`, `schemaVersion`, `sessionId`
- [ ] `SubmitSessionBodyZod` metaData object validates exactly those three fields
- [ ] A POST to `/sessions` with a payload that includes `platform`, `startedAt`, `endedAt` in `metaData` is accepted without error (Zod strips unknown fields — no regression)
- [ ] A POST to `/sessions` without those fields in `metaData` is also accepted
- [ ] No other files are modified
