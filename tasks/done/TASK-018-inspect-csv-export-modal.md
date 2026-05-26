---
id: TASK-018
title: Inspect page — CSV export modal
status: done
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/web-ui.md
depends-on: TASK-017
doc-impact: []
---

## Description

Add a "Export CSV" button to the Inspect page that opens a `Modal`. The modal lets the user confirm and trigger a CSV download. The export reflects exactly what is currently displayed on the table: the same visible columns and the same filtered sessions (after date filtering from TASK-017).

### CSV format rules
- **Headers**: use the full column key verbatim (e.g., `Tutorial Diegetico/Cliques/Botão A`). For metadata columns, use human-readable names: `Session ID`, `Schema Version`, `Platform`, `Started At`, `Ended At`.
- **Rows**: one row per session in `filteredSessions`, in display order.
- **Column order**: same order as `visibleColumnKeys` (which mirrors the table's column order).
- **Escaping**: if a cell value contains a comma, double-quote, or newline, wrap the value in double quotes and escape any inner double quotes by doubling them (`"` → `""`). Values that are `null` or `undefined` become empty strings.
- **Encoding**: UTF-8 with BOM (`﻿` prefix) so Excel opens it correctly without encoding issues.
- **Download**: trigger via a temporary `<a>` element pointing to a `Blob` URL; revoke the URL after click.

---

## Acceptance Criteria

- [ ] An "Export CSV" button is visible in the `ControlsRow` right slot (alongside the `FieldSelector`, added by TASK-017)
- [ ] Clicking the button opens a `Modal` with:
  - Title: "Export CSV"
  - Body: a sentence summarising what will be exported, e.g. "Export **42 sessions** across **8 columns**."  — numbers are live (reflect current filter state)
  - Footer: a "Download" button and a "Cancel" button
- [ ] Clicking "Download" generates a valid CSV string and triggers a file download named `sessions-{projectId}.csv`
- [ ] The CSV contains exactly the visible columns (from `visibleColumnKeys`) in order
- [ ] The CSV contains exactly the filtered sessions (from `filteredSessions`) — no more, no less
- [ ] Nested column keys are used verbatim as headers (e.g., `Tutorial Diegetico/Cliques/Botão A`)
- [ ] Metadata column headers use the human-readable names (`Session ID`, etc.)
- [ ] All cell values are correctly CSV-escaped
- [ ] The file is UTF-8 with BOM so Excel opens it without mojibake
- [ ] The modal can be dismissed with the "Cancel" button, backdrop click, or Escape key
- [ ] TypeScript compiles without errors; run `pnpm --filter backoffice build` to verify

---

## Relevant Data

### File to modify
`backoffice/src/app/projects/inspect/page.tsx`

This task builds on TASK-017. After TASK-017 the file exposes these variables in `InspectPageContent`:
- `filteredSessions: SessionRow[]` — sessions after date-range filtering
- `visibleColumnKeys: string[]` — keys of currently visible columns (mirrors Table's own fallback)
- `columns: TableColumn<SessionRow>[]` — full column definitions (with `.key` and `.header`)
- `projectId: string | null` — from `searchParams.get('id')`

### State to add
```ts
const [exportOpen, setExportOpen] = useState(false);
```

### Placement of the Export button
In the `ControlsRow` right slot (alongside `FieldSelector`), wrap both in an `Inline`:
```tsx
right={
  <Inline gap="nano" align="center">
    <Button variant="secondary" onClick={() => setExportOpen(true)}>
      Export CSV
    </Button>
    <FieldSelector ... />
  </Inline>
}
```

### Modal structure
```tsx
<Modal
  open={exportOpen}
  title="Export CSV"
  onClose={() => setExportOpen(false)}
  footer={
    <Inline gap="nano" justify="flex-end">
      <Button variant="secondary" onClick={() => setExportOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleDownload}>
        Download
      </Button>
    </Inline>
  }
>
  <Text>
    Export <strong>{filteredSessions.length} sessions</strong> across{' '}
    <strong>{visibleColumnKeys.length} columns</strong>.
  </Text>
</Modal>
```

Place the `<Modal>` at the bottom of the JSX returned by `InspectPageContent`, outside the conditional rendering tree (it uses `open` to control visibility).

### Metadata label map (matches TASK-017's METADATA_LABELS)
```ts
const METADATA_LABELS: Record<string, string> = {
  __sessionId: 'Session ID',
  __schemaVersion: 'Schema Version',
  __platform: 'Platform',
  __startedAt: 'Started At',
  __endedAt: 'Ended At',
};
```

If this constant is already defined in the file by TASK-017, reuse it — do not duplicate it.

### CSV generation helper
```ts
function escapeCsv(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(
  visibleColumnKeys: string[],
  columns: TableColumn<SessionRow>[],
  filteredSessions: SessionRow[],
): string {
  const headerRow = visibleColumnKeys
    .map((key) => METADATA_LABELS[key] ?? key)
    .map(escapeCsv)
    .join(',');

  const dataRows = filteredSessions.map((row) =>
    visibleColumnKeys
      .map((key) => escapeCsv(row[key]))
      .join(','),
  );

  return '﻿' + [headerRow, ...dataRows].join('\r\n');
}
```

### Download trigger
```ts
function handleDownload() {
  const csv = buildCsv(visibleColumnKeys, columns, filteredSessions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sessions-${projectId ?? 'export'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setExportOpen(false);
}
```

### Additional imports needed from @cre/web-ui
```ts
import { Modal } from '@cre/web-ui';
```

(`Inline` and `Button` are already imported by TASK-017's changes.)

### Modal API (from packages/cre-web-ui/src/components/Modal.tsx)
```ts
type ModalProps = {
  open: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  dismissible?: boolean;   // default true — ESC + backdrop click close the modal
};
```
