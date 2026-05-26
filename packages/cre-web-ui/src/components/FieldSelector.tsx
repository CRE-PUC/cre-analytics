import React, { useEffect, useRef, useState } from 'react';
import { injectStyles } from '../internal/injectStyles';
import { defaultLabelParser, flattenFields, buildFieldTree, type FieldTreeNode } from '../internal/fieldUtils';
import { Box } from '../primitives/Box';
import { Stack } from '../primitives/Stack';
import { Surface } from '../primitives/Surface';
import { Text } from '../primitives/Text';
import { Checkbox } from './Checkbox';
import { Button } from './Button';

const FIELD_SELECTOR_CSS = `
[data-cre="fieldSelectorRoot"] {
  position: relative;
  display: inline-flex;
}

[data-cre="fieldSelectorPopover"] {
  position: absolute;
  top: calc(100% + var(--cre-space-nano));
  right: 0;
  z-index: 20;
  min-width: 200px;
  max-width: 280px;
  transform-origin: top right;
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

[data-cre="fieldSelectorPopover"][data-state="closed"] {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
  pointer-events: none;
}

[data-cre="fieldSelectorPopover"][data-state="open"] {
  opacity: 1;
  transform: translateY(0) scale(1);
}

[data-cre="fieldSelectorScroll"] {
  max-height: 20rem;
  overflow-y: auto;
  overflow-x: hidden;
}

[data-cre="fieldSelectorItem"] {
  display: flex;
  align-items: center;
  gap: var(--cre-space-nano);
  padding: var(--cre-space-quark) 0;
  padding-left: calc(var(--cre-field-selector-depth, 0) * var(--cre-space-small));
  white-space: nowrap;
}

[data-cre="fieldSelectorItem"] input[type="checkbox"] {
  flex-shrink: 0;
}
`;

injectStyles('cre-field-selector-styles', FIELD_SELECTOR_CSS);

export type FieldSelectorProps = {
  /**
   * Row data used to auto-derive the field list via flattenFields.
   * Ignored when fields is provided explicitly.
   */
  data?: Record<string, unknown>[];
  /**
   * Explicit list of field paths. When provided, data is not used for
   * field derivation (though it may still be passed for future use).
   */
  fields?: string[];
  /** Currently visible field paths. */
  visibleFields: string[];
  /** Called when the user toggles a field. */
  onVisibleFieldsChange: (fields: string[]) => void;
  /**
   * Custom label parser. Receives a dot-path (e.g. "address.city") and
   * returns a display label. Defaults to defaultLabelParser.
   */
  labelParser?: (path: string) => string;
  /**
   * Separator used to split field paths into tree groups.
   * Default '/' — e.g. "scene/buttonClicks/buttonA" becomes three levels.
   * Use '.' if paths are dot-separated.
   */
  groupSeparator?: string;
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
  /** Disables the trigger button. */
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function ColumnsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="4" width="5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.5" y="4" width="5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="16" y="4" width="5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function collectLeaves(node: FieldTreeNode): string[] {
  if (node.isLeaf && node.children.length === 0) return [node.key];
  const leaves: string[] = [];
  if (node.isLeaf) leaves.push(node.key);
  for (const child of node.children) leaves.push(...collectLeaves(child));
  return leaves;
}

function renderTree(
  nodes: FieldTreeNode[],
  depth: number,
  visibleFields: string[],
  onToggle: (key: string, checked: boolean) => void,
  onToggleGroup: (leaves: string[], checked: boolean) => void,
  labelParser: (seg: string) => string,
): React.ReactNode {
  return nodes.map((node) => {
    if (node.isLeaf && node.children.length === 0) {
      return (
        <Box key={node.key} as="div" data-cre="fieldSelectorItem"
          style={{ '--cre-field-selector-depth': String(depth) } as React.CSSProperties}>
          <Checkbox
            id={`field-selector-${node.key}`}
            checked={visibleFields.includes(node.key)}
            label={labelParser(node.segment)}
            onChange={(checked) => onToggle(node.key, checked)}
          />
        </Box>
      );
    }
    const leaves = collectLeaves(node);
    const allChecked = leaves.every((k) => visibleFields.includes(k));
    const someChecked = leaves.some((k) => visibleFields.includes(k));
    return (
      <React.Fragment key={node.key}>
        <Box as="div" data-cre="fieldSelectorItem"
          style={{ '--cre-field-selector-depth': String(depth) } as React.CSSProperties}>
          <Checkbox
            id={`field-selector-group-${node.key}`}
            checked={allChecked}
            indeterminate={!allChecked && someChecked}
            label={labelParser(node.segment)}
            onChange={(checked) => onToggleGroup(leaves, checked)}
          />
        </Box>
        {renderTree(node.children, depth + 1, visibleFields, onToggle, onToggleGroup, labelParser)}
      </React.Fragment>
    );
  });
}

export function FieldSelector({
  data,
  fields: fieldsProp,
  visibleFields,
  onVisibleFieldsChange,
  labelParser,
  groupSeparator = '/',
  ariaLabel = 'Select visible columns',
  disabled,
  className,
  style,
}: FieldSelectorProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const resolveLabelParser = labelParser ?? defaultLabelParser;

  const allFields: string[] = fieldsProp ?? (data ? flattenFields(data) : []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const t = window.setTimeout(() => setMounted(false), 140);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;

    function onMouseDown(e: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = (field: string, checked: boolean) => {
    const next = checked
      ? [...visibleFields, field]
      : visibleFields.filter((f) => f !== field);
    onVisibleFieldsChange(next);
  };

  const toggleGroup = (leafKeys: string[], checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...visibleFields, ...leafKeys]))
      : visibleFields.filter((f) => !leafKeys.includes(f));
    onVisibleFieldsChange(next);
  };

  const tree = buildFieldTree(allFields, groupSeparator);

  return (
    <div data-cre="fieldSelectorRoot" ref={rootRef} className={className} style={style}>
      <Button
        ref={triggerRef}
        variant="secondary"
        iconOnly
        leadingIcon={<ColumnsIcon />}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
      />

      {mounted ? (
        <div
          data-cre="fieldSelectorPopover"
          data-state={open ? 'open' : 'closed'}
          role="dialog"
          aria-modal="false"
          aria-label="Column visibility"
        >
          <Surface variant="raised" padding="micro" radius="small">
            <Stack gap="quark">
              <Text as="div" variant="label">
                Columns
              </Text>
              {allFields.length === 0 ? (
                <Text as="p" tone="muted">
                  No fields available.
                </Text>
              ) : (
                <div data-cre="fieldSelectorScroll">
                  {renderTree(tree, 0, visibleFields, toggle, toggleGroup, resolveLabelParser)}
                </div>
              )}
            </Stack>
          </Surface>
        </div>
      ) : null}
    </div>
  );
}
FieldSelector.displayName = 'FieldSelector';
