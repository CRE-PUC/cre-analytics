---
id: TASK-002
title: Strip Tailwind from backoffice and wire CreThemeProvider
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/web-ui.md
  - docs/context/token-system.md
doc-impact: []
---

## Description

**Prerequisite: TASK-001 must be complete** (workspace link and predev script must exist before starting).

The backoffice was scaffolded with Tailwind CSS v4 and the Geist font. Neither belongs in an app that delegates all styling to `@cre/web-ui`. This task removes those layers and wires the `CreThemeProvider` so the design system controls the visual baseline.

The goal is a backoffice that:
- Has no Tailwind classes or Tailwind configuration
- Has no Geist font — `@cre/web-ui` uses Poppins (headings) and Source Sans Pro (body)
- Has `CreThemeProvider` at the root, applying all `--cre-*` CSS vars globally
- Loads Poppins and Source Sans Pro via `next/font/google` so the web-ui's `--cre-font-family-*` vars resolve to real font files
- Has a clean placeholder page built with web-ui primitives

Do not build any real backoffice screens yet. The placeholder page just needs to demonstrate that the theme is active and the fonts are loading.

## Acceptance Criteria

- [ ] `tailwindcss` and `@tailwindcss/postcss` removed from `backoffice/package.json` devDependencies
- [ ] `backoffice/postcss.config.mjs` deleted
- [ ] `backoffice/src/app/globals.css` contains only a minimal CSS reset (no Tailwind imports, no conflicting CSS vars — see Relevant Data below)
- [ ] Geist font imports removed from `backoffice/src/app/layout.tsx`
- [ ] Poppins and Source Sans Pro loaded in `layout.tsx` via `next/font/google` and applied as CSS variables (`--font-poppins` and `--font-source-sans`) on the `<html>` element
- [ ] `CreThemeProvider` from `@cre/web-ui` wraps the body content in `layout.tsx` with `scope='global'` and `initialMode='light'`
- [ ] `backoffice/src/app/page.tsx` uses web-ui primitives (at minimum: `Stack`, `Heading`, `Text`) — no Tailwind classes, no raw CSS
- [ ] `pnpm --filter backoffice build` succeeds with no type errors
- [ ] Visual check: running `pnpm --filter backoffice dev`, the page loads with Poppins/Source Sans Pro fonts visible and no console errors about missing CSS vars or unresolved modules

## Relevant Data

**Target `globals.css`** — minimal modern reset, no Tailwind:
```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html, body { height: 100%; }
body { line-height: 1.5; -webkit-font-smoothing: antialiased; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
```

**Font setup in `layout.tsx`:**
`@cre/web-ui` injects CSS vars `--cre-font-family-heading` (Poppins) and `--cre-font-family-body` (Source Sans Pro), but the font files must be loaded by the consumer. Load both via `next/font/google` and apply their CSS variable names to `<html>` so the browser can resolve them.

**`CreThemeProvider` usage:**
```tsx
import { CreThemeProvider } from '@cre/web-ui';

// In layout.tsx, wrapping {children}:
<CreThemeProvider scope="global" initialMode="light">
  {children}
</CreThemeProvider>
```

`scope='global'` applies vars to `document.documentElement`. Do not use `scope='local'` here — it would limit the theme scope to a wrapper div rather than the full page.

**`@cre/web-ui` does not export any CSS files.** Do not attempt to import CSS from the package. Style injection happens automatically when components are rendered and the token vars are applied by the provider.

**Placeholder page example:**
```tsx
import { Stack, Heading, Text } from '@cre/web-ui';

export default function Home() {
  return (
    <Stack gap="medium" style={{ padding: 'var(--cre-space-large)' }}>
      <Heading level={1}>CRE Analytics</Heading>
      <Text variant="body" tone="muted">Backoffice dashboard — coming soon.</Text>
    </Stack>
  );
}
```

**Note on static export:** `next.config.ts` has `output: 'export'`. Do not remove it. `CreThemeProvider` is a client-side provider — if Next.js complains about server/client boundary, add `'use client'` to the layout or wrap the provider in a separate client component.
