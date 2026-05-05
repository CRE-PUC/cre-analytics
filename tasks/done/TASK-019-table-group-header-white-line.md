---
id: TASK-019
title: Fix Table group header white line (sticky border-collapse bug)
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/context/component-patterns.md
  - docs/context/web-ui.md
doc-impact: []
---

## Description

In `packages/cre-web-ui/src/components/Table.tsx`, the grouped header rendering shows a white horizontal line between a group-header row and the leaf-header row below it. For example, when the column hierarchy is `Tutorial Diegetico / Cliques / Botão A`, a white line appears between the "Cliques" `thGroup` cell and the "Botão A" `th` cell directly below it.

**Root cause:** The current CSS gives `position: sticky; top: 0` to BOTH `[data-cre="th"]` (leaf columns) AND `[data-cre="thGroup"]` (group label cells). When a table uses `border-collapse: collapse` and multiple `<tr>` rows inside `<thead>` each contain `position: sticky` cells, browsers fail to render the collapsed border between sticky cells from different rows — they paint nothing at that junction, showing the page background (white) instead of the accent border color.

This is a known browser behavior: `border-collapse` + `position: sticky` across different rows of the same `<thead>` breaks border rendering at row boundaries.

**Fix:** Remove `position: sticky; top: 0` from `[data-cre="thGroup"]` only. Group-label cells ("Tutorial Diegetico", "Cliques") do not need to be sticky — they are context labels that appear above the leaf column names. Only the leaf `[data-cre="th"]` cells need to stay visible during vertical scroll.

Removing sticky from `thGroup` eliminates the conflicting sticky-element border rendering and the white line disappears. The leaf headers remain sticky and continue to function correctly.

**Side effect (improvement):** Previously, all header rows were sticky at `top: 0`, causing them to overlap each other during scroll (row 1 group headers would slide under row 0 group headers). After this fix, only the bottom leaf-header row stays fixed; group headers scroll away naturally, which is correct behavior.

## Changes

**File: `packages/cre-web-ui/src/components/Table.tsx`**

Locate the `thGroup` CSS rule in the `TABLE_CSS` constant. Remove `position: sticky;` and `top: 0;` from it.

Current `thGroup` rule:
```css
[data-cre="thGroup"] {
  text-align: center;
  font-size: var(--cre-font-size-micro);
  font-weight: 600;
  color: var(--cre-accent-fg);
  padding: var(--cre-space-nano) var(--cre-space-micro);
  border-bottom: var(--cre-border-width-small) solid var(--cre-accent-border);
  border-right: var(--cre-border-width-small) solid var(--cre-accent-border);
  background: var(--cre-accent-bg);
  position: sticky;   ← REMOVE THIS LINE
  top: 0;             ← REMOVE THIS LINE
}
```

After fix:
```css
[data-cre="thGroup"] {
  text-align: center;
  font-size: var(--cre-font-size-micro);
  font-weight: 600;
  color: var(--cre-accent-fg);
  padding: var(--cre-space-nano) var(--cre-space-micro);
  border-bottom: var(--cre-border-width-small) solid var(--cre-accent-border);
  border-right: var(--cre-border-width-small) solid var(--cre-accent-border);
  background: var(--cre-accent-bg);
}
```

The `[data-cre="th"]` rule is **unchanged** — leaf column headers remain sticky at `top: 0`.

No changes to TypeScript logic, props, or JSX. Only the CSS rule changes.

## Acceptance Criteria

- [ ] `position: sticky` and `top: 0` removed from `[data-cre="thGroup"]` CSS rule in `Table.tsx`
- [ ] `[data-cre="th"]` CSS rule is unchanged (still has `position: sticky; top: 0`)
- [ ] No TypeScript or JSX changes
- [ ] `packages/cre-web-ui/STORYBOOK_SYNC.md` updated with a one-line entry noting the sticky fix for thGroup
- [ ] `packages/cre-web-ui/` is rebuilt (`pnpm build` in `packages/cre-web-ui/`) so the backoffice picks up the change

## Relevant Data

The bug is visible whenever `groupSeparator` is active and there are at least 3 levels of column depth (i.e., 3+ segments in a column name). In the inspect page, columns like `Tutorial Diegetico/Cliques/Botão A` produce 3 header rows, triggering the white line between rows 1 and 2.

The `TABLE_CSS` constant is at the top of `packages/cre-web-ui/src/components/Table.tsx`. The `thGroup` rule starts around line 73.

**Do not** attempt to fix the sticky overlapping during scroll by adding `top` offset calculations — that requires measuring row heights and is out of scope. The current fix (remove sticky from thGroup entirely) is the correct minimal change.
