---
id: TASK-018
title: Remove duplicate metaData columns from inspect page (Backoffice)
status: completed
model: cheap
model-name: SWE-1.6
context:
  - docs/context/firebase.md
doc-impact: []
---

## Description

The inspect page currently maps `metaData.platform`, `metaData.startedAt`, and `metaData.endedAt` into special `__platform`, `__startedAt`, `__endedAt` row fields and displays them as hardcoded table columns. These are being removed from `metaData` (TASK-016/017).

Those same values already come through the `data` array as `Session/Platform`, `Session/StartedAt`, and `Session/EndedAt` — the `data.forEach` loop already populates them into the row. After removing the metaData mappings, these columns will still appear in the table, just as regular data columns under the `Session/` group hierarchy alongside `Session/Duration` and `Session/DeviceModel`.

One functional change is required: the `DateRangeFilter` currently reads `row.__startedAt`. Update it to read `row['Session/StartedAt']` instead.

---

## File to modify

`backoffice/src/app/projects/inspect/page.tsx` — only this file.

---

## Changes

### 1. `SessionMetaData` interface (lines 23–30)

```typescript
// Before
interface SessionMetaData {
  projectId: string;
  schemaVersion: string;
  sessionId: string;
  platform: string;
  startedAt: string;
  endedAt: string;
}

// After
interface SessionMetaData {
  projectId: string;
  schemaVersion: string;
  sessionId: string;
}
```

### 2. `SessionRow` interface (lines 44–51)

```typescript
// Before
interface SessionRow {
  __sessionId: string;
  __schemaVersion: string;
  __platform: string;
  __startedAt: string;
  __endedAt: string;
  [columnName: string]: unknown;
}

// After
interface SessionRow {
  __sessionId: string;
  __schemaVersion: string;
  [columnName: string]: unknown;
}
```

### 3. `METADATA_LABELS` (lines 53–59)

```typescript
// Before
const METADATA_LABELS: Record<string, string> = {
  __sessionId: 'Session ID',
  __schemaVersion: 'Schema Version',
  __platform: 'Platform',
  __startedAt: 'Started At',
  __endedAt: 'Ended At',
};

// After
const METADATA_LABELS: Record<string, string> = {
  __sessionId: 'Session ID',
  __schemaVersion: 'Schema Version',
};
```

### 4. Row construction inside `snap.docs.forEach` (lines 129–135)

```typescript
// Before
const row: SessionRow = {
  __sessionId: doc.id,
  __schemaVersion: metaData.schemaVersion,
  __platform: metaData.platform,
  __startedAt: metaData.startedAt,
  __endedAt: metaData.endedAt,
};

// After
const row: SessionRow = {
  __sessionId: doc.id,
  __schemaVersion: metaData.schemaVersion,
};
```

### 5. `builtColumns` hardcoded entries (lines 147–153)

```typescript
// Before
const builtColumns: TableColumn<SessionRow>[] = [
  { key: '__sessionId', header: 'Session ID' },
  { key: '__schemaVersion', header: 'Schema Version' },
  { key: '__platform', header: 'Platform' },
  { key: '__startedAt', header: 'Started At' },
  { key: '__endedAt', header: 'Ended At' },
];

// After
const builtColumns: TableColumn<SessionRow>[] = [
  { key: '__sessionId', header: 'Session ID' },
  { key: '__schemaVersion', header: 'Schema Version' },
];
```

### 6. Date range filter — update the field key (line 186)

```typescript
// Before
const ts = new Date(row.__startedAt as string).getTime();

// After
const ts = new Date(row['Session/StartedAt'] as string).getTime();
```

---

## Result

After this change the table will show:
- `Session ID` and `Schema Version` as the two hardcoded leading columns (from metaData)
- All `data` array entries as data columns, including the `Session/` group: `Session/StartedAt`, `Session/EndedAt`, `Session/Duration`, `Session/Platform`, `Session/DeviceModel`
- All user-defined columns as before

The `DateRangeFilter` continues to work, reading from `Session/StartedAt` in the data row.

---

## Acceptance Criteria

- [ ] No `__platform`, `__startedAt`, or `__endedAt` fields exist in `SessionRow`, `METADATA_LABELS`, row construction, or `builtColumns`
- [ ] `SessionMetaData` interface has only `projectId`, `schemaVersion`, `sessionId`
- [ ] Date filter reads `row['Session/StartedAt']` — not `row.__startedAt`
- [ ] `Session/StartedAt`, `Session/EndedAt`, `Session/Platform` appear in the table as data columns (they come through the existing `data.forEach` loop — no extra code needed)
- [ ] TypeScript compiles without errors
- [ ] No other files are modified
