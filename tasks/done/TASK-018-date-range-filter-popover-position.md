---
id: TASK-018
title: Fix DateRangeFilter popover positioning (off-screen + position shift on select)
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/context/component-patterns.md
  - docs/context/web-ui.md
doc-impact: []
---

## Description

Two related bugs in `packages/cre-web-ui/src/components/DateRangeFilter.tsx`:

**Bug A — Popover goes off-screen when trigger is on the left.**
The popover CSS uses `right: 0`, which aligns the popover's RIGHT edge to the parent root's RIGHT edge. When the trigger sits on the LEFT side of the page, the 320px-wide popover extends leftward and clips off-screen. Fix: default to `left: 0` (popover's left edge aligns to the root's left edge, opens rightward), and expose a prop to flip to `right: 0` when the trigger is on the right side of the page.

**Bug B — Popover jumps position when the first date is selected.**
When the user selects a start date, the trigger button label changes from the placeholder ("Date range") to a date string ("2026-04-29 —"), widening the button. The root div (`display: inline-flex`) grows rightward, shifting its right edge. Since `right: 0` is anchored to that right edge, the popover shifts horizontally. With `left: 0` as the default, the root's left edge never moves when the button grows, so the popover stays still.

## Changes

**File: `packages/cre-web-ui/src/components/DateRangeFilter.tsx`**

1. Add a `popoverAlign?: 'left' | 'right'` prop (default `'left'`).

2. Replace the hardcoded CSS rule for `[data-cre="dateRangeFilterPopover"]` with two alignment variants. Remove the static `right: 0` and `transform-origin: top right`. Instead render the alignment inline (or via a `data-align` attribute + CSS rule):

Current CSS to update:
```css
[data-cre="dateRangeFilterPopover"] {
  position: absolute;
  top: calc(100% + var(--cre-space-nano));
  right: 0;                    ← remove
  z-index: 20;
  width: 320px;
  transform-origin: top right; ← remove
  ...
}
```

Replace with two CSS rules based on a `data-align` attribute:
```css
[data-cre="dateRangeFilterPopover"][data-align="left"] {
  left: 0;
  transform-origin: top left;
}

[data-cre="dateRangeFilterPopover"][data-align="right"] {
  right: 0;
  transform-origin: top right;
}
```

Keep all other properties (`position: absolute`, `top: calc(100% + var(--cre-space-nano))`, `z-index: 20`, `width: 320px`, the open/closed transition styles).

3. Pass `data-align={popoverAlign}` to the popover `<div>`:
```tsx
<div
  data-cre="dateRangeFilterPopover"
  data-align={popoverAlign}
  data-state={open ? 'open' : 'closed'}
  ...
>
```

4. Add `popoverAlign` to `DateRangeFilterProps`:
```ts
export type DateRangeFilterProps = {
  ...
  popoverAlign?: 'left' | 'right';
  ...
};
```

5. Default `popoverAlign` to `'left'` in the destructure:
```ts
export function DateRangeFilter({
  ...
  popoverAlign = 'left',
  ...
}: DateRangeFilterProps) {
```

## Acceptance Criteria

- [ ] `popoverAlign` prop added to `DateRangeFilterProps` and `DateRangeFilter` function signature
- [ ] Default value of `popoverAlign` is `'left'`
- [ ] CSS: `[data-align="left"]` rule uses `left: 0` and `transform-origin: top left`
- [ ] CSS: `[data-align="right"]` rule uses `right: 0` and `transform-origin: top right`
- [ ] Popover `<div>` receives `data-align={popoverAlign}`
- [ ] No other logic changes — only the alignment prop and CSS rules
- [ ] `packages/cre-web-ui/STORYBOOK_SYNC.md` updated with a one-line entry noting the new `popoverAlign` prop

## Relevant Data

The component is used in the inspect page at `backoffice/src/app/projects/inspect/page.tsx`:
```tsx
<DateRangeFilter
  value={dateRange}
  onChange={setDateRange}
  triggerVariant="field"
  disabled={loading}
/>
```
No change needed in the backoffice — `popoverAlign` defaults to `'left'`, which is correct for the left-side placement.

The popover `<div>` mount block (line ~320 in the file):
```tsx
{mounted ? (
  <div
    data-cre="dateRangeFilterPopover"
    data-state={open ? 'open' : 'closed'}
    role="dialog"
    aria-modal="false"
  >
    ...
  </div>
) : null}
```
Add `data-align={popoverAlign}` to this element.
