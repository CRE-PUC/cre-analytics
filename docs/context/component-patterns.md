# Context: Component Patterns

How to build components in @cre/web-ui. Read before creating a new component.

---

## New Component Checklist

1. Determine the right location:
   - `src/components/undocumented/MyComponent.tsx` — new work not yet in Storybook (default for all new components)
   - `src/components/MyComponent.tsx` — only when migrating from the Storybook repo or replacing an existing component
2. Follow the implementation patterns below
3. Export from `src/index.ts`
4. Build: `pnpm --filter @cre/web-ui build`
5. Update `STORYBOOK_SYNC.md` with a new entry (required — see format in that file)

---

## Primitive vs Component

| Primitive (`src/primitives/`) | Component (`src/components/`) |
|-------------------------------|-------------------------------|
| Layout and typography building blocks | Interactive UI with behavior |
| No state, no event handlers | May have state or event handlers |
| Examples: Box, Stack, Text, Heading | Examples: Button, Input, Table, Modal |
| Minimal CSS — just spacing and layout | Complex CSS (hover, focus, variants, states) |

When in doubt: if it only arranges or styles children without user interaction, it's a primitive. If it has a user interaction, controlled state, or event handlers, it's a component.

---

## Style Injection Pattern

CSS lives in the component file, injected once at module level — before the component function:

```tsx
import { injectStyles } from '../internal/injectStyles';

const MY_COMPONENT_CSS = `
.cre-my-component {
  display: flex;
  padding: var(--cre-space-micro);
  background: var(--cre-color-surface);
  border-radius: var(--cre-radius-medium);
}
`;

injectStyles('cre-my-component-styles', MY_COMPONENT_CSS);

export const MyComponent = ...
```

Rules:
- `injectStyles` id must be unique: `cre-<kebab-component-name>-styles`
- All values from `--cre-*` vars — no hardcoded hex, px, or palette keys
- No CSS modules, Tailwind, styled-components, emotion, or any other CSS system

---

## Data-Attribute Variant Pattern

Variants and states use `data-*` HTML attributes, not className toggling:

```tsx
// JSX
<div
  data-cre="my-component"
  data-variant={variant}
  data-size={size}
  data-disabled={disabled || undefined}
  className="cre-my-component"
>

// CSS
.cre-my-component[data-variant="secondary"] {
  background: var(--cre-color-surface-raised);
}
.cre-my-component[data-size="large"] {
  --cre-my-component-padding: var(--cre-space-small);
}
.cre-my-component[data-disabled] {
  opacity: var(--cre-opacity-medium);
  pointer-events: none;
}
```

Override CSS vars locally on the element for size/variant changes, rather than duplicating all property declarations. This keeps variant CSS terse.

---

## forwardRef Pattern

Any component wrapping a native HTML element must use `React.forwardRef` and set `displayName`:

```tsx
import React from 'react';

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary';
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ variant = 'primary', children, ...props }, ref) => (
    <div
      ref={ref}
      data-cre="my-component"
      data-variant={variant}
      className="cre-my-component"
      {...props}
    >
      {children}
    </div>
  )
);
MyComponent.displayName = 'MyComponent';
```

---

## Public API Export

Add to `src/index.ts`:

```ts
export { MyComponent } from './components/undocumented/MyComponent';
export type { MyComponentProps } from './components/undocumented/MyComponent';
```

Undocumented components are exported — they are production-ready, just not yet in Storybook.

---

## Token Access in Components

For component-specific tokens, define them in the token system first (see `docs/context/token-system.md`), then use the generated CSS vars. Never reach into `coreTokens` or `rawTokens` directly from a component file.

---

## Updating STORYBOOK_SYNC.md

After creating or modifying a component, append an entry to `packages/cre-web-ui/STORYBOOK_SYNC.md`. This is **required** and must be part of the task acceptance criteria.

- **New component** → full props list, purpose, usage example, Storybook notes
- **Modified component** → what changed, why, what the story should show differently
- **Token change** → what var was added/renamed/removed

The exact format is defined in `STORYBOOK_SYNC.md` itself. Follow it exactly.
