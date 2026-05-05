# AGENTS.md — packages/cre-web-ui

Rules that apply to every task touching files in this package. Read this before implementing anything here.

---

## Token-First: The Non-Negotiable Rule

**Every design value (color, spacing, radius, typography) must come from a CSS custom property.**

```css
/* ✅ */
background: var(--cre-button-bg);
gap: var(--cre-space-small);
border-radius: var(--cre-radius-medium);
font-size: var(--cre-font-size-body);

/* ❌ Never do this */
background: #8A0538;
gap: 8px;
border-radius: 6px;
```

If the needed CSS var does not exist yet, **add it to the token system** — do not hardcode the value. See [docs/context/token-system.md](../../docs/context/token-system.md) for how to add tokens.

---

## Component Style Injection

All component CSS is injected via `injectStyles` from `src/internal/injectStyles.ts`.

- Call `injectStyles('cre-<component-name>', css)` at **module level**, outside the component function.
- The `id` must be unique per component and match the pattern `cre-<kebab-name>`.
- No CSS modules, styled-components, emotion, Tailwind, or any other CSS system.

---

## Variant & State Pattern

Use `data-*` HTML attributes for all variant and state selectors. Never use JS-driven className toggling for variants.

```tsx
// In JSX
<button data-size={size} data-variant={variant} />

// In CSS
.cre-button[data-size="large"] { --cre-button-padding-y: var(--cre-space-medium); }
.cre-button[data-variant="ghost"] { background: transparent; }
```

Override CSS vars locally on the element for size/variant changes, rather than duplicating all property declarations.

---

## forwardRef for DOM-Wrapping Components

Any component that renders a native HTML element as its root must use `React.forwardRef` and set `displayName`.

```tsx
export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} {...props} />
));
Input.displayName = 'Input';
```

---

## Public API

When adding a new component or primitive, **always add it to `src/index.ts`**:
```ts
export { MyComponent } from './components/MyComponent';
export type { MyComponentProps } from './components/MyComponent';
```

---

## Build After Every Change

Storybook imports `@cre/web-ui` from the compiled output in `dist/`, **not** from `src/`. After modifying any file in this package you must rebuild before Storybook will reflect the change:

```bash
# From the repo root
pnpm --filter @cre/web-ui build

# Or from inside packages/cre-web-ui
pnpm build
```

**Do not interpret a missing component or stale type error in Storybook as a source code bug.** If the build succeeds cleanly, the problem is that the last build predates your change. Rebuild and verify before diagnosing further.

---

## Token Changes Must Update the Story

**Any time you add, rename, or remove a CSS var in `src/theme/cssVars.ts`, you must also update the token reference story:**

```
apps/storybook/src/stories/web/Tokens/DesignTokens.stories.tsx
```

This story is the visual catalogue of every CSS var in the system. A var that exists in `cssVars.ts` but is absent from the story is invisible to designers and developers.

- New semantic color → add a row to the Semantic Colors or Semantic Accent section
- New component token group → add a new `<Section>` for that component
- New structural token (spacing, radius, etc.) → the existing loops pick these up automatically from `coreTokens`, so no story change is needed unless you add an entirely new category

---

## What Not to Touch

- `src/DsTokens/*.tokens.json` — Figma-owned. Do not hand-edit.
- `src/theme/rawTokens.ts` — Only update when token JSON is updated and types need to change.
- `src/internal/` — Only Claude-scoped refactors touch these; do not add new files here without a task that specifically asks for it.

---

## Reference

- Full token system: [docs/context/token-system.md](../../docs/context/token-system.md)
- Full component patterns: [docs/context/component-patterns.md](../../docs/context/component-patterns.md)
