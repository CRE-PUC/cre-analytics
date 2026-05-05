---
id: TASK-017
title: Inspect page — FieldSelector and DateRangeFilter controls
status: done
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/web-ui.md
  - docs/context/firebase.md
doc-impact:
  - docs/sync-queue.md
---

## Description

Add two interactive controls to the Inspect page (`backoffice/src/app/projects/inspect/page.tsx`):

1. **`FieldSelector`** — a popover that lets the user toggle which table columns are visible. Wires into `Table`'s existing `visibleFields` prop.
2. **`DateRangeFilter`** — a calendar popover that filters the displayed sessions by their `startedAt` date.

Both controls sit in a `ControlsRow` above the table. The `ControlsRow` `left` slot holds the `DateRangeFilter`; the `right` slot holds the `FieldSelector`.

After this task, the Inspect page must expose two pieces of derived state — `filteredSessions` and `visibleColumnKeys` — that TASK-018 (CSV export modal) will consume. Structure your implementation so these values are available as named variables in `InspectPageContent`.

---

## Acceptance Criteria

- [ ] `ControlsRow` is rendered between the heading row and the table (only when sessions have loaded and the list is non-empty)
- [ ] `FieldSelector` appears on the right of `ControlsRow`; opening it shows all column keys in a hierarchical tree (grouped by `/` separator)
- [ ] Toggling fields in `FieldSelector` immediately updates which columns the table shows (via `Table`'s `visibleFields` prop)
- [ ] `visibleFields` is initialized to **all column keys** when sessions load; adding new column names (from fresh data) should not silently hide them
- [ ] `DateRangeFilter` appears on the left of `ControlsRow` with `triggerVariant="field"` (shows the selected range as text on the button)
- [ ] Selecting a date range filters the session rows to those whose `startedAt` falls within the range, inclusive of both selected dates (start-of-day to end-of-day)
- [ ] Clearing the date range (using the `Clear` button in the picker) shows all sessions again
- [ ] Both controls are disabled (`disabled` prop) while sessions are loading
- [ ] All imports come from `@cre/web-ui` — no new dependencies
- [ ] `filteredSessions: SessionRow[]` and `visibleColumnKeys: string[]` are named variables in scope at the point where the `Table` is rendered (TASK-018 will use these)
- [ ] TypeScript compiles without errors; run `pnpm --filter backoffice build` to verify

---

## Relevant Data

### File to modify
`backoffice/src/app/projects/inspect/page.tsx`

### Current imports from @cre/web-ui (lines 8–17)
```ts
import {
  Stack,
  Heading,
  Text,
  Table,
  type TableColumn,
  Button,
  Inline,
} from '@cre/web-ui';
```

Add to this import: `ControlsRow`, `FieldSelector`, `DateRangeFilter`, `type DateRangeValue`.

### Column keys in the current implementation
The page builds `builtColumns: TableColumn<SessionRow>[]` with these keys:
- Metadata: `__sessionId`, `__schemaVersion`, `__platform`, `__startedAt`, `__endedAt`
- Analytics: each `columnName` from `data[]` (e.g., `Tutorial Diegetico/Cliques/Botão A`)

All column keys are available as `builtColumns.map(c => c.key)`.

### State to add
```ts
const [dateRange, setDateRange] = useState<DateRangeValue>({ startMs: null, endMs: null });
const [visibleFields, setVisibleFields] = useState<string[]>([]);
```

Initialize `visibleFields` to all column keys whenever `columns` state changes to a non-empty array:
```ts
useEffect(() => {
  if (columns.length > 0 && visibleFields.length === 0) {
    setVisibleFields(columns.map(c => c.key));
  }
}, [columns]);
```

### Date filtering
```ts
const filteredSessions = useMemo(() => {
  const { startMs, endMs } = dateRange;
  if (startMs == null) return sessions;
  return sessions.filter((row) => {
    const ts = new Date(row.__startedAt as string).getTime();
    const dayEnd = endMs != null ? endMs + 86_400_000 - 1 : startMs + 86_400_000 - 1;
    return ts >= startMs && ts <= dayEnd;
  });
}, [sessions, dateRange]);
```

### visibleColumnKeys
```ts
const visibleColumnKeys = visibleFields.length > 0 ? visibleFields : columns.map(c => c.key);
```
(Mirrors Table's own fallback logic: empty visibleFields = show all.)

### FieldSelector custom labelParser
The metadata keys have `__` prefix which looks ugly. Provide a `labelParser` that handles them:
```ts
const METADATA_LABELS: Record<string, string> = {
  __sessionId: 'Session ID',
  __schemaVersion: 'Schema Version',
  __platform: 'Platform',
  __startedAt: 'Started At',
  __endedAt: 'Ended At',
};

function inspectLabelParser(segment: string): string {
  if (segment in METADATA_LABELS) return METADATA_LABELS[segment];
  return segment
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}
```

Pass `labelParser={inspectLabelParser}` to `FieldSelector`.

### ControlsRow placement
Replace the current:
```tsx
{loading ? (
  <Text>Loading sessions...</Text>
) : sessions.length === 0 ? (
  <Text>No sessions found for this project.</Text>
) : (
  <Table<SessionRow> ... />
)}
```

With:
```tsx
{loading ? (
  <Text>Loading sessions...</Text>
) : sessions.length === 0 ? (
  <Text>No sessions found for this project.</Text>
) : (
  <>
    <ControlsRow
      left={
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          triggerVariant="field"
          disabled={loading}
        />
      }
      right={
        <FieldSelector
          fields={columns.map(c => c.key)}
          visibleFields={visibleFields}
          onVisibleFieldsChange={setVisibleFields}
          groupSeparator="/"
          labelParser={inspectLabelParser}
          disabled={loading}
        />
      }
    />
    <Table<SessionRow>
      columns={columns}
      rows={filteredSessions}
      getRowId={(row) => row.__sessionId}
      groupSeparator="/"
      visibleFields={visibleColumnKeys}
      sortable={false}
    />
  </>
)}
```

### FieldSelector API (from packages/cre-web-ui/src/components/FieldSelector.tsx)
```ts
type FieldSelectorProps = {
  data?: Record<string, unknown>[];
  fields?: string[];           // use this — explicit list of all column keys
  visibleFields: string[];
  onVisibleFieldsChange: (fields: string[]) => void;
  labelParser?: (path: string) => string;
  groupSeparator?: string;     // default '/' — matches our column naming
  ariaLabel?: string;
  disabled?: boolean;
};
```

### DateRangeFilter API (from packages/cre-web-ui/src/components/DateRangeFilter.tsx)
```ts
type DateRangeFilterProps = {
  value?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
  disabled?: boolean;
  triggerVariant?: 'field' | 'icon';   // use 'field'
};

type DateRangeValue = {
  startMs: number | null;
  endMs: number | null;
};
```

### Table visibleFields API (from packages/cre-web-ui/src/components/Table.tsx)
```ts
// Restricts which columns are displayed. Values must match column keys.
// When provided, only columns whose key is in this array are shown.
// Empty array = show all columns.
visibleFields?: string[];
```
