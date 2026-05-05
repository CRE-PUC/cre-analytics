import React, { useMemo, useState } from 'react';
import { injectStyles } from '../internal/injectStyles';
import { defaultLabelParser, flattenFields, getNestedValue, buildHeaderTree, countHeaderLeaves, headerTreeMaxDepth, type HeaderTreeNode } from '../internal/fieldUtils';
import { Box } from '../primitives/Box';
import { Text } from '../primitives/Text';
import { Checkbox } from './Checkbox';

const TABLE_CSS = `
[data-cre="tableWrap"] {
  width: 100%;
  overflow: auto;
  border-radius: var(--cre-radius-small);
  border-width: var(--cre-border-width-small);
  border-style: solid;
  border-color: var(--cre-color-border);
  box-sizing: border-box;
}

[data-cre="table"] {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--cre-font-family-body);
  font-size: var(--cre-font-size-tiny);
  color: var(--cre-color-text);
}

[data-cre="th"] {
  text-align: left;
  font-size: var(--cre-font-size-micro);
  font-weight: 600;
  color: var(--cre-accent-fg);
  padding: var(--cre-space-nano) var(--cre-space-micro);
  border-bottom: var(--cre-border-width-small) solid var(--cre-accent-border);
  border-right: var(--cre-border-width-small) solid var(--cre-accent-border);
  background: var(--cre-accent-bg);
  position: sticky;
  top: 0;
  width: var(--cre-th-width, auto);
}

[data-cre="th"][data-select-col="true"] {
  width: 40px;
}

[data-cre="td"] {
  padding: var(--cre-space-nano) var(--cre-space-micro);
  border-bottom: var(--cre-border-width-small) solid var(--cre-color-border);
  background: var(--cre-color-surface);
}

[data-cre="tr"][data-clickable="true"] {
  cursor: pointer;
}

[data-cre="tr"][data-clickable="true"]:hover [data-cre="td"] {
  background: var(--cre-color-bg);
}

[data-cre="thButton"] {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--cre-space-quark);
}

[data-cre="thGroup"] {
  text-align: center;
  font-size: var(--cre-font-size-micro);
  font-weight: 600;
  color: var(--cre-accent-fg);
  padding: var(--cre-space-nano) var(--cre-space-micro);
  border-bottom: var(--cre-border-width-small) solid var(--cre-accent-border);
  border-right: var(--cre-border-width-small) solid var(--cre-accent-border);
  background: var(--cre-accent-bg);
  position: sticky;
  top: 0;
}

[data-cre="th"]:last-child,
[data-cre="thGroup"]:last-child {
  border-right: none;
}

[data-cre="emptyCell"] {
  padding: var(--cre-space-micro);
}
`;

injectStyles('cre-table-styles', TABLE_CSS);

export type TableSortDirection = 'asc' | 'desc';

export type TableColumn<Row> = {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  render?: (row: Row) => React.ReactNode;
  sort?: (a: Row, b: Row) => number;
};

export type TableProps<Row> = {
  /** Explicit column definitions. If omitted and deriveColumns is true, columns are auto-derived from rows. */
  columns?: TableColumn<Row>[];
  rows: Row[];
  /**
   * When true and columns is empty/omitted, columns are automatically derived
   * from the row data using flattenFields. Nested objects are flattened into
   * dot-path keys (e.g. "address.city").
   */
  deriveColumns?: boolean;
  /**
   * Restricts which columns are displayed. The values must match column keys.
   * When provided, only columns whose key is in this array are shown.
   */
  visibleFields?: string[];
  /**
   * Custom label parser for column headers derived from field paths.
   * Receives a dot-path like "address.city" and returns a display string.
   * Defaults to defaultLabelParser (splits on dots + camelCase).
   */
  labelParser?: (path: string) => string;
  /**
   * Separator used to parse column keys into header groups.
   * Default '/'. Set to '.' for dot-separated keys, or null to disable grouping entirely.
   */
  groupSeparator?: string | null;
  getRowId?: (row: Row, index: number) => string;
  onRowClick?: (row: Row) => void;
  selectableRows?: boolean;
  selectedRowIds?: string[];
  defaultSelectedRowIds?: string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  emptyState?: React.ReactNode;
  sortable?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function renderGroupedHeader<Row>(
  headerTree: HeaderTreeNode[],
  maxDepth: number,
  columns: TableColumn<Row>[],
  selectableRows: boolean,
  sortable: boolean,
  sortKey: string | null,
  sortDir: TableSortDirection,
  onSortClick: (key: string) => void,
  selectAllCheckbox: React.ReactNode,
): React.ReactNode {
  const rows: React.ReactNode[][] = Array.from({ length: maxDepth + 1 }, () => []);

  function walk(nodes: HeaderTreeNode[]) {
    for (const node of nodes) {
      if (node.isLeaf) {
        const col = columns.find((c) => c.key === node.key);
        const canSort = sortable && !!col?.sort;
        const active = sortKey === node.key;
        const label = typeof col?.header === 'string' ? col.header : undefined;
        const rowspan = maxDepth - node.depth + 1;

        rows[node.depth].push(
          <th
            key={node.key}
            data-cre="th"
            rowSpan={rowspan}
            style={col?.width !== undefined ? { '--cre-th-width': typeof col.width === 'number' ? `${col.width}px` : col.width } as React.CSSProperties : undefined}
          >
            {canSort ? (
              <button
                type="button"
                data-cre="thButton"
                aria-label={label ? `Sort by ${label}` : undefined}
                onClick={() => onSortClick(node.key)}
              >
                {col?.header}
                {active ? <Text as="span">{sortDir === 'asc' ? '↑' : '↓'}</Text> : null}
              </button>
            ) : (
              col?.header
            )}
          </th>,
        );
      } else {
        const colspan = countHeaderLeaves(node);
        rows[node.depth].push(
          <th key={node.key} data-cre="thGroup" colSpan={colspan}>
            {node.segment}
          </th>,
        );
      }
      walk(node.children);
    }
  }

  walk(headerTree);

  if (selectableRows) {
    rows[0].unshift(
      <th key="__select" data-cre="th" data-select-col="true" rowSpan={maxDepth + 1}>
        {selectAllCheckbox}
      </th>,
    );
  }

  return rows.map((cells, i) => <tr key={i}>{cells}</tr>);
}

export function Table<Row>({
  columns: columnsProp = [],
  rows,
  deriveColumns = false,
  visibleFields,
  labelParser,
  groupSeparator = '/',
  getRowId,
  onRowClick,
  selectableRows = false,
  selectedRowIds,
  defaultSelectedRowIds,
  onSelectedRowIdsChange,
  emptyState,
  sortable = true,
  className,
  style,
}: TableProps<Row>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<TableSortDirection>('asc');
  const [internalSelected, setInternalSelected] = useState<string[]>(defaultSelectedRowIds ?? []);

  const effectiveSelected = selectedRowIds ?? internalSelected;
  const setSelected = (ids: string[]) => {
    onSelectedRowIdsChange?.(ids);
    if (selectedRowIds == null) setInternalSelected(ids);
  };

  const resolveLabelParser = labelParser ?? defaultLabelParser;

  // Derive or use explicit columns, then apply visibleFields filter.
  const columns = useMemo<TableColumn<Row>[]>(() => {
    let cols: TableColumn<Row>[] = columnsProp;

    if (deriveColumns && cols.length === 0) {
      const paths = flattenFields(rows as Record<string, unknown>[]);
      cols = paths.map((path) => ({
        key: path,
        header: resolveLabelParser(path),
      }));
    }

    if (visibleFields && visibleFields.length > 0) {
      cols = cols.filter((c) => visibleFields.includes(c.key));
    }

    return cols;
  }, [columnsProp, rows, deriveColumns, visibleFields, resolveLabelParser]);

  const sortedRows = useMemo(() => {
    if (!sortable || !sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sort) return rows;
    const copy = [...rows];
    copy.sort((a, b) => (sortDir === 'asc' ? col.sort!(a, b) : -col.sort!(a, b)));
    return copy;
  }, [rows, columns, sortKey, sortDir, sortable]);

  const isEmpty = sortedRows.length === 0;

  const resolvedGetRowId = (row: Row, index: number) => getRowId?.(row, index) ?? String(index);

  const allIds = selectableRows ? sortedRows.map((r, i) => resolvedGetRowId(r, i)) : [];
  const allSelected = selectableRows && allIds.length > 0 && allIds.every((id) => effectiveSelected.includes(id));
  const someSelected = selectableRows && allIds.some((id) => effectiveSelected.includes(id));

  const useGroupedHeaders =
    !!groupSeparator &&
    columns.some((c) => c.key.includes(groupSeparator));

  const headerTree = useMemo(() => {
    if (!useGroupedHeaders || !groupSeparator) return null;
    return buildHeaderTree(columns.map((c) => c.key), groupSeparator);
  }, [columns, useGroupedHeaders, groupSeparator]);

  const headerMaxDepth = useMemo(
    () => (headerTree ? headerTreeMaxDepth(headerTree) : 0),
    [headerTree],
  );

  const handleSortClick = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
      return;
    }
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  };

  const selectAllCheckbox = (
    <Checkbox
      ariaLabel="Select all rows"
      checked={allSelected}
      indeterminate={!allSelected && someSelected}
      onChange={(next) => {
        setSelected(next ? allIds : []);
      }}
    />
  );

  return (
    <Box as="div" data-cre="tableWrap" className={className} style={style}>
      <table data-cre="table">
        <thead>
          {useGroupedHeaders && headerTree
            ? renderGroupedHeader(
                headerTree,
                headerMaxDepth,
                columns,
                selectableRows,
                sortable,
                sortKey,
                sortDir,
                handleSortClick,
                selectAllCheckbox,
              )
            : (
              <tr>
                {selectableRows ? (
                  <th data-cre="th" data-select-col="true">
                    {selectAllCheckbox}
                  </th>
                ) : null}
                {columns.map((c) => {
                  const canSort = sortable && !!c.sort;
                  const active = sortKey === c.key;
                  const label = typeof c.header === 'string' ? c.header : undefined;

                  return (
                    <th
                      key={c.key}
                      data-cre="th"
                      style={c.width !== undefined ? { '--cre-th-width': typeof c.width === 'number' ? `${c.width}px` : c.width } as React.CSSProperties : undefined}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          data-cre="thButton"
                          aria-label={label ? `Sort by ${label}` : undefined}
                          onClick={() => handleSortClick(c.key)}
                        >
                          {c.header}
                          {active ? <Text as="span">{sortDir === 'asc' ? '↑' : '↓'}</Text> : null}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            )}
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td data-cre="emptyCell" colSpan={columns.length + (selectableRows ? 1 : 0)}>
                {emptyState ?? (
                  <Text as="p" tone="muted">
                    No results.
                  </Text>
                )}
              </td>
            </tr>
          ) : (
            sortedRows.map((row, i) => {
              const rowId = resolvedGetRowId(row, i);
              const checked = selectableRows ? effectiveSelected.includes(rowId) : false;
              return (
                <tr
                  key={rowId}
                  data-cre="tr"
                  data-clickable={onRowClick ? 'true' : 'false'}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectableRows ? (
                    <td data-cre="td">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onChange={(nextChecked) => {
                            const next = nextChecked
                              ? [...effectiveSelected, rowId]
                              : effectiveSelected.filter((id) => id !== rowId);
                            setSelected(next);
                          }}
                        />
                      </div>
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td key={c.key} data-cre="td">
                      {c.render
                        ? c.render(row)
                        : (getNestedValue(row, c.key) as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </Box>
  );
}
Table.displayName = 'Table';
