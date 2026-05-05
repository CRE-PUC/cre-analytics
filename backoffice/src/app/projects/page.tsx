'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuthGuard } from '@/components/AuthGuard';
import {
  Stack,
  Heading,
  Button,
  Table,
  type TableColumn,
  Drawer,
  Field,
  Input,
  Inline,
  Text,
  Modal,
} from '@cre/web-ui';

interface Project {
  projectName: string;
  projectDescription: string;
  projectKey: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectRow extends Project {
  id: string;
}

function CopyCell({ value }: { value: string }) {
  return (
    <Inline gap="nano" align="center">
      <Text as="span" style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>
        {value}
      </Text>
      <Button size="small" onClick={() => navigator.clipboard.writeText(value)}>
        Copy
      </Button>
    </Inline>
  );
}

function RevealCopyCell({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <Inline gap="nano" align="center">
      <Text as="span" style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>
        {revealed ? value : '••••••••'}
      </Text>
      <Button size="small" onClick={() => setRevealed((r) => !r)}>
        {revealed ? 'Hide' : 'Show'}
      </Button>
      <Button size="small" onClick={() => navigator.clipboard.writeText(value)}>
        Copy
      </Button>
    </Inline>
  );
}

function ActionsCell({
  row,
  onEdit,
  onDelete,
  onInspect,
}: {
  row: ProjectRow;
  onEdit: (row: ProjectRow) => void;
  onDelete: (row: ProjectRow) => void;
  onInspect: (row: ProjectRow) => void;
}) {
  return (
    <Inline gap="nano" align="center">
      <Button size="small" onClick={() => onEdit(row)}>
        Edit
      </Button>
      <Button size="small" onClick={() => onDelete(row)}>
        Delete
      </Button>
      <Button size="small" onClick={() => onInspect(row)}>
        Inspect
      </Button>
    </Inline>
  );
}

function ProjectsPageContent() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectRow | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'projects'));
      const projectsData: ProjectRow[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Project),
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateDrawer = () => {
    setDrawerMode('create');
    setProjectName('');
    setProjectDescription('');
    setEditingProject(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (row: ProjectRow) => {
    setDrawerMode('edit');
    setProjectName(row.projectName);
    setProjectDescription(row.projectDescription);
    setEditingProject(row);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!projectName.trim()) return;

    setSaving(true);
    try {
      if (drawerMode === 'create') {
        const projectId = crypto.randomUUID();
        await setDoc(doc(db, 'projects', projectId), {
          projectName,
          projectDescription,
          projectKey: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } satisfies Project);
      } else if (drawerMode === 'edit' && editingProject) {
        await updateDoc(doc(db, 'projects', editingProject.id), {
          projectName,
          projectDescription,
          updatedAt: new Date().toISOString(),
        });
      }
      setDrawerOpen(false);
      await fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (row: ProjectRow) => {
    setDeletingProject(row);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProject) return;

    try {
      await deleteDoc(doc(db, 'projects', deletingProject.id));
      setDeleteModalOpen(false);
      setDeletingProject(null);
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleInspect = (row: ProjectRow) => {
    router.push(`/projects/inspect?id=${row.id}`);
  };

  const columns: TableColumn<ProjectRow>[] = [
    { key: 'projectName', header: 'Project Name' },
    {
      key: 'projectId',
      header: 'Project ID',
      render: (row) => <CopyCell value={row.id} />,
    },
    {
      key: 'projectKey',
      header: 'Project Key',
      render: (row) => <RevealCopyCell value={row.projectKey} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <ActionsCell row={row} onEdit={openEditDrawer} onDelete={openDeleteModal} onInspect={handleInspect} />
      ),
    },
  ];

  return (
    <Stack gap="medium" style={{ padding: 'var(--cre-space-large)' }}>
      <Inline justify="space-between" align="center">
        <Heading level={1}>Projects</Heading>
        <Button variant="primary" onClick={openCreateDrawer}>
          New Project
        </Button>
      </Inline>

      {loading ? (
        <Text>Loading projects...</Text>
      ) : (
        <Table<ProjectRow>
          columns={columns}
          rows={projects}
          getRowId={(row) => row.id}
          groupSeparator={null}
        />
      )}

      <Drawer
        open={drawerOpen}
        title={drawerMode === 'create' ? 'New Project' : 'Edit Project'}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Inline justify="flex-end" gap="small">
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !projectName.trim()}>
              {saving ? 'Saving…' : drawerMode === 'create' ? 'Create Project' : 'Save Changes'}
            </Button>
          </Inline>
        }
      >
        <Stack gap="small">
          <Field label="Project Name">
            <Input value={projectName} onChange={setProjectName} />
          </Field>
          <Field label="Description">
            <Input value={projectDescription} onChange={setProjectDescription} />
          </Field>
        </Stack>
      </Drawer>

      <Modal
        open={deleteModalOpen}
        title="Delete Project"
        onClose={() => setDeleteModalOpen(false)}
        footer={
          <Inline justify="flex-end" gap="small">
            <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleDelete}>
              Delete
            </Button>
          </Inline>
        }
      >
        <Text>
          Delete <strong>{deletingProject?.projectName}</strong>? This cannot be undone.
        </Text>
      </Modal>
    </Stack>
  );
}

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <ProjectsPageContent />
    </AuthGuard>
  );
}
