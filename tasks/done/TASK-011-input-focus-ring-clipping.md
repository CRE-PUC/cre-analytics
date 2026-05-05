---
id: TASK-011
title: Fix Input focus ring clipping inside Surface/Drawer
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/context/web-ui.md
  - docs/context/component-patterns.md
doc-impact: []
---

## Description

The Input component's focus ring is clipped on its left edge when rendered inside a Drawer (or any Surface with a border-radius). The ring is implemented as `box-shadow`, which is cropped by `overflow: hidden` on ancestor elements.

The fix is to replace `box-shadow` with `outline` on `[data-cre="inputRoot"]:focus-within`. `outline` renders outside the normal box model and is not clipped by parent overflow. Visually it should look identical — same thickness, same color, follows the input's border-radius in modern browsers.

Apply the same change to the error focus state (`[data-cre="inputRoot"][data-error="true"]:focus-within`).

After changing the CSS, rebuild the package and add a STORYBOOK_SYNC.md entry.

## Acceptance Criteria

- [ ] In `packages/cre-web-ui/src/components/Input.tsx`, the `INPUT_CSS` constant no longer uses `box-shadow` for focus states
- [ ] Normal focus state uses `outline: var(--cre-border-width-medium) solid var(--cre-color-focus)` with `outline-offset: 1px`
- [ ] Error focus state uses `outline: var(--cre-border-width-medium) solid var(--cre-feedback-error-border)` with `outline-offset: 1px`
- [ ] `pnpm --filter @cre/web-ui build` runs without errors
- [ ] `packages/cre-web-ui/STORYBOOK_SYNC.md` has a new entry at the top of the Log section following the required format

## Relevant Data

**File to edit:** `packages/cre-web-ui/src/components/Input.tsx`

**Current CSS (lines to replace):**
```css
[data-cre="inputRoot"]:focus-within {
  box-shadow: 0 0 0 var(--cre-border-width-medium) var(--cre-color-focus);
  border-color: var(--cre-color-border-strong);
}

[data-cre="inputRoot"][data-error="true"]:focus-within {
  box-shadow: 0 0 0 var(--cre-border-width-medium) var(--cre-feedback-error-border);
  border-color: var(--cre-feedback-error-border);
}
```

**Replacement:**
```css
[data-cre="inputRoot"]:focus-within {
  outline: var(--cre-border-width-medium) solid var(--cre-color-focus);
  outline-offset: 1px;
  border-color: var(--cre-color-border-strong);
}

[data-cre="inputRoot"][data-error="true"]:focus-within {
  outline: var(--cre-border-width-medium) solid var(--cre-feedback-error-border);
  outline-offset: 1px;
  border-color: var(--cre-feedback-error-border);
}
```

**STORYBOOK_SYNC.md entry (add at the top of the Log section, replacing the "No entries yet" placeholder):**
```
### [2026-05-05] modified-component: Input

- **Type:** modified-component
- **Status:** undocumented
- **Location:** src/components/Input.tsx
- **Summary:** Changed focus ring from box-shadow to outline so it renders correctly when the Input is inside a clipping ancestor (e.g. Drawer, Surface with border-radius).
- **Props / Changes:**
  - No prop changes. CSS-only fix: `box-shadow` on `:focus-within` replaced with `outline` + `outline-offset: 1px` on both the normal and error focus states.
- **Usage example:**
  ```tsx
  <Input value={val} onChange={setVal} />
  ```
- **Storybook notes:**
  The existing focused state story should look identical to before. Add a variant showing the Input focused inside a Surface card to verify the ring is not clipped.
```

**Build command:**
```bash
pnpm --filter @cre/web-ui build
```
