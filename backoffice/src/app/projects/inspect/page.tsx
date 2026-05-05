'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
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
  ControlsRow,
  FieldSelector,
  DateRangeFilter,
  type DateRangeValue,
  Modal,
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

  return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
}

function InspectPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('id');

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [columns, setColumns] = useState<TableColumn<SessionRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeValue>({ startMs: null, endMs: null });
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

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

  useEffect(() => {
    if (columns.length > 0 && visibleFields.length === 0) {
      setVisibleFields(columns.map(c => c.key));
    }
  }, [columns, visibleFields.length]);

  const filteredSessions = useMemo(() => {
    const { startMs, endMs } = dateRange;
    if (startMs == null) return sessions;
    return sessions.filter((row) => {
      const ts = new Date(row.__startedAt as string).getTime();
      const dayEnd = endMs != null ? endMs + 86_400_000 - 1 : startMs + 86_400_000 - 1;
      return ts >= startMs && ts <= dayEnd;
    });
  }, [sessions, dateRange]);

  const visibleColumnKeys = visibleFields.length > 0 ? visibleFields : columns.map(c => c.key);

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
              <Inline gap="nano" align="center">
                <Button variant="secondary" onClick={() => setExportOpen(true)}>
                  Export CSV
                </Button>
                <FieldSelector
                  fields={columns.map(c => c.key)}
                  visibleFields={visibleFields}
                  onVisibleFieldsChange={setVisibleFields}
                  groupSeparator="/"
                  labelParser={inspectLabelParser}
                  disabled={loading}
                />
              </Inline>
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
