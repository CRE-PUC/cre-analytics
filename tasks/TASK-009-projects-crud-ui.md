---
id: TASK-009
title: Projects page — list, create, edit, delete
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/projects.md
  - docs/context/web-ui.md
doc-impact: []
---

## Description

Build the `/projects` page: a table listing all projects, with a "New Project" button that opens a Drawer to create one, inline edit and delete actions per row, and a disabled "Inspect" placeholder for the future analytics view.

Projects are stored in Firestore at `projects/{projectId}`. The `projectId` is the Firestore document ID (a UUID generated at creation time). Each project also has a `projectKey` (a separate UUID) that the Unity SDK uses for authentication. Both IDs are copyable from the table.

This page depends on TASK-008 (AuthGuard and AuthProvider must already exist).

Do **not** modify anything in `packages/cre-web-ui/` — all needed components are already built.

## Acceptance Criteria

- [ ] `backoffice/src/app/projects/page.tsx` exists and is wrapped in `<AuthGuard>`
- [ ] Page fetches all documents from the `projects` Firestore collection on mount and re-fetches after any mutation
- [ ] Table has columns: **Project Name**, **Project ID** (monospace text + copy button), **Project Key** (masked `••••••••` with reveal toggle + copy button), **Created**, **Actions**
- [ ] Actions column contains: **Edit** (opens edit Drawer), **Delete** (opens confirm Modal), **Inspect** (disabled Button — links to `/projects/[id]` but disabled for now)
- [ ] "New Project" button above the table opens a Drawer titled "New Project" with fields: `projectName` (required) and `projectDescription` (optional)
- [ ] On create: generate `projectId = crypto.randomUUID()` and `projectKey = crypto.randomUUID()`, write to Firestore `projects/{projectId}`, close Drawer, refresh list
- [ ] Edit Drawer is pre-populated with the project's current `projectName` and `projectDescription`; `projectKey` is not shown or editable in the edit form
- [ ] On edit save: update `projectName`, `projectDescription`, and `updatedAt` in Firestore, close Drawer, refresh list
- [ ] Delete confirm Modal asks "Delete [projectName]? This cannot be undone." with a **Cancel** and a **Delete** (danger) button
- [ ] On delete confirm: `deleteDoc(doc(db, 'projects', projectId))`, close Modal, refresh list
- [ ] `backoffice/src/app/page.tsx` redirects to `/projects`
- [ ] All UI uses only `@cre/web-ui` components — no inline CSS frameworks or external component libraries

## Relevant Data

**Project types — declare locally in the backoffice (do NOT import from `functions/`):**
```ts
interface Project {
  projectName: string;
  projectDescription: string;
  projectKey: string;
  createdAt: string;
  updatedAt: string;
}
interface ProjectRow extends Project { id: string; }
```

**Firestore operations:**
```ts
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// List — call this on mount and after any mutation
const snap = await getDocs(collection(db, 'projects'));
const projects: ProjectRow[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Project) }));

// Create
const projectId = crypto.randomUUID();
await setDoc(doc(db, 'projects', projectId), {
  projectName,
  projectDescription,
  projectKey: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} satisfies Project);

// Edit
await updateDoc(doc(db, 'projects', projectId), {
  projectName,
  projectDescription,
  updatedAt: new Date().toISOString(),
});

// Delete
await deleteDoc(doc(db, 'projects', projectId));
```

**Table component API (from `@cre/web-ui`):**
```tsx
import { Table, type TableColumn } from '@cre/web-ui';

const columns: TableColumn<ProjectRow>[] = [
  { key: 'projectName', header: 'Project Name' },
  { key: 'projectId',   header: 'Project ID',  render: (row) => <CopyCell value={row.id} /> },
  { key: 'projectKey',  header: 'Project Key', render: (row) => <RevealCopyCell value={row.projectKey} /> },
  { key: 'createdAt',   header: 'Created',     render: (row) => new Date(row.createdAt).toLocaleDateString() },
  { key: 'actions',     header: '',            render: (row) => <ActionsCell row={row} /> },
];

<Table<ProjectRow>
  columns={columns}
  rows={projects}
  getRowId={(row) => row.id}
  groupSeparator={null}   // disable group-header parsing — project names may contain '/'
/>
```

**Drawer component API:**
```tsx
import { Drawer } from '@cre/web-ui';

<Drawer
  open={drawerOpen}
  title="New Project"
  onClose={() => setDrawerOpen(false)}
  footer={
    <Inline justify="flex-end" gap="small">
      <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Create Project'}
      </Button>
    </Inline>
  }
>
  <Stack gap="small">
    <Field label="Project Name">
      <Input value={name} onChange={e => setName(e.target.value)} />
    </Field>
    <Field label="Description">
      <Input value={description} onChange={e => setDescription(e.target.value)} />
    </Field>
  </Stack>
</Drawer>
```

**Copy-to-clipboard pattern (inline, no new component needed):**
```tsx
<Inline gap="nano" align="center">
  <Text as="span" style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>{value}</Text>
  <Button size="small" onClick={() => navigator.clipboard.writeText(value)}>Copy</Button>
</Inline>
```

**Reveal + copy pattern for projectKey:**
```tsx
const [revealed, setRevealed] = useState(false);
<Inline gap="nano" align="center">
  <Text as="span" style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>
    {revealed ? value : '••••••••'}
  </Text>
  <Button size="small" onClick={() => setRevealed(r => !r)}>{revealed ? 'Hide' : 'Show'}</Button>
  <Button size="small" onClick={() => navigator.clipboard.writeText(value)}>Copy</Button>
</Inline>
```

**Root redirect — replace `backoffice/src/app/page.tsx` entirely:**
```tsx
import { redirect } from 'next/navigation';
export default function Home() { redirect('/projects'); }
```
