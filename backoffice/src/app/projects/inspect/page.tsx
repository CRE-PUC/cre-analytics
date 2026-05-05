'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuthGuard } from '@/components/AuthGuard';
import {
  Stack,
  Heading,
  Text,
  Table,
  type TableColumn,
  Button,
  Inline,
} from '@cre/web-ui';

interface SessionMetaData {
  projectId: string;
  schemaVersion: string;
  sessionId: string;
  platform: string;
  startedAt: string;
  endedAt: string;
}

interface SessionDataEntry {
  columnName: string;
  value: unknown;
}

interface SessionDocument {
  sessionData: {
    metaData: SessionMetaData;
    data: SessionDataEntry[];
  };
}

interface SessionRow {
  __sessionId: string;
  __schemaVersion: string;
  __platform: string;
  __startedAt: string;
  __endedAt: string;
  [columnName: string]: unknown;
}

function InspectPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('id');

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [columns, setColumns] = useState<TableColumn<SessionRow>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const sessionsRef = collection(db, 'projects', projectId, 'sessions');
        const snap = await getDocs(sessionsRef);

        const allColumnNames = new Set<string>();
        const rows: SessionRow[] = [];

        snap.docs.forEach((doc) => {
          const sessionDoc = doc.data() as SessionDocument;
          const { metaData, data } = sessionDoc.sessionData;

          const row: SessionRow = {
            __sessionId: doc.id,
            __schemaVersion: metaData.schemaVersion,
            __platform: metaData.platform,
            __startedAt: metaData.startedAt,
            __endedAt: metaData.endedAt,
          };

          data.forEach((entry) => {
            allColumnNames.add(entry.columnName);
            row[entry.columnName] = entry.value;
          });

          rows.push(row);
        });

        const sortedColumnNames = Array.from(allColumnNames).sort();

        const builtColumns: TableColumn<SessionRow>[] = [
          { key: '__sessionId', header: 'Session ID' },
          { key: '__schemaVersion', header: 'Schema Version' },
          { key: '__platform', header: 'Platform' },
          { key: '__startedAt', header: 'Started At' },
          { key: '__endedAt', header: 'Ended At' },
        ];

        sortedColumnNames.forEach((columnName) => {
          const segments = columnName.split('/');
          const headerText = segments[segments.length - 1];
          builtColumns.push({
            key: columnName,
            header: headerText,
          });
        });

        setColumns(builtColumns);
        setSessions(rows);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [projectId]);

  if (!projectId) {
    return (
      <Stack gap="medium" style={{ padding: 'var(--cre-space-large)' }}>
        <Heading level={1}>Inspect Sessions</Heading>
        <Text>No project ID provided.</Text>
        <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
      </Stack>
    );
  }

  return (
    <Stack gap="medium" style={{ padding: 'var(--cre-space-large)' }}>
      <Inline justify="space-between" align="center">
        <Heading level={1}>Inspect Sessions</Heading>
        <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
      </Inline>

      {loading ? (
        <Text>Loading sessions...</Text>
      ) : sessions.length === 0 ? (
        <Text>No sessions found for this project.</Text>
      ) : (
        <Table<SessionRow>
          columns={columns}
          rows={sessions}
          getRowId={(row) => row.__sessionId}
          groupSeparator="/"
          sortable={false}
        />
      )}
    </Stack>
  );
}

export default function InspectPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<Text>Loading...</Text>}>
        <InspectPageContent />
      </Suspense>
    </AuthGuard>
  );
}
