/**
 * Shared field utilities for table data pipeline and FieldSelector.
 * Single source of truth — do not duplicate this logic elsewhere.
 */

/**
 * Walk an array of row objects and collect every unique leaf field path,
 * expressed as a dot-separated string (e.g. "address.city").
 * Stops at arrays and primitives; recurses into plain objects up to maxDepth.
 */
export function flattenFields(
  rows: Record<string, unknown>[],
  maxDepth = 3,
): string[] {
  const paths = new Set<string>();

  function walk(obj: unknown, prefix: string, depth: number) {
    if (depth > maxDepth) return;
    if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        walk(val, path, depth + 1);
      } else {
        paths.add(path);
      }
    }
  }

  for (const row of rows) {
    walk(row, '', 0);
  }

  return Array.from(paths);
}

/**
 * Default label parser: converts a dot-path like "address.city" or
 * "createdAtMs" into a human-readable label like "Address / City" or
 * "Created At Ms".
 */
export function defaultLabelParser(path: string): string {
  return path
    .split('.')
    .map((seg) =>
      seg
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase()),
    )
    .join(' / ');
}

/**
 * Read a value from a (possibly nested) object using a dot-path key.
 * e.g. getNestedValue({ a: { b: 1 } }, "a.b") === 1
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export type FieldTreeNode = {
  /** Full path from root to this node joined by separator. e.g. "scene/buttonClicks" */
  key: string;
  /** The last segment label only. e.g. "buttonClicks" */
  segment: string;
  children: FieldTreeNode[];
  isLeaf: boolean;
};

/**
 * Build a tree from flat field path strings.
 * ["sessionId", "scene/durationMs", "scene/buttonA"]
 * → [ {key:"sessionId", leaf}, {key:"scene", group → [{key:"scene/durationMs"}, {key:"scene/buttonA"}]} ]
 */
export function buildFieldTree(fields: string[], separator = '/'): FieldTreeNode[] {
  const root: FieldTreeNode[] = [];
  for (const field of fields) {
    const parts = field.split(separator);
    let level = root;
    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i];
      const key = parts.slice(0, i + 1).join(separator);
      const isLeaf = i === parts.length - 1;
      let node = level.find((n) => n.key === key);
      if (!node) {
        node = { key, segment, children: [], isLeaf };
        level.push(node);
      } else if (isLeaf) {
        node.isLeaf = true;
      }
      level = node.children;
    }
  }
  return root;
}

export type HeaderTreeNode = {
  key: string;
  segment: string;
  children: HeaderTreeNode[];
  isLeaf: boolean;
  depth: number;
};

export function buildHeaderTree(keys: string[], separator = '/'): HeaderTreeNode[] {
  const root: HeaderTreeNode[] = [];
  for (const key of keys) {
    const parts = key.split(separator);
    let level = root;
    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i];
      const nodeKey = parts.slice(0, i + 1).join(separator);
      const isLeaf = i === parts.length - 1;
      let node = level.find((n) => n.key === nodeKey);
      if (!node) {
        node = { key: nodeKey, segment, children: [], isLeaf, depth: i };
        level.push(node);
      } else if (isLeaf) {
        node.isLeaf = true;
      }
      level = node.children;
    }
  }
  return root;
}

export function countHeaderLeaves(node: HeaderTreeNode): number {
  if (node.isLeaf && node.children.length === 0) return 1;
  let count = node.isLeaf ? 1 : 0;
  for (const child of node.children) count += countHeaderLeaves(child);
  return count;
}

export function headerTreeMaxDepth(nodes: HeaderTreeNode[]): number {
  let max = 0;
  function walk(ns: HeaderTreeNode[], d: number) {
    for (const n of ns) {
      if (n.isLeaf) max = Math.max(max, d);
      walk(n.children, d + 1);
    }
  }
  walk(nodes, 0);
  return max;
}
