# Context: @cre/web-ui Package

> For behavioral rules (what Windsurf should do when working here), see `packages/cre-web-ui/AGENTS.md`.

## Overview

`@cre/web-ui` is the internal React component library for CRE products. It lives at `packages/cre-web-ui/` in this monorepo and is consumed by `backoffice/` via pnpm workspace linking.

The package will eventually migrate to a dedicated `web-ui` repo where a Storybook documents all components. Until then, it lives here for velocity — changes can be made locally and the consumer (backoffice) picks them up after a rebuild.

---

## Architecture: The Token Layer Cake

Design values never appear as hardcoded literals anywhere in the package. They travel through four layers:

1. **Figma JSON** (`src/DsTokens/*.tokens.json`) — Source of truth. Exported from Figma. Three files: Core (mode-independent), Light, Dark. **Read-only.**

2. **Raw tokens** (`src/theme/rawTokens.ts`) — Normalizes Figma JSON into strongly-typed TypeScript objects. `coreTokens` for spacing/radius/typography; `lightColorTokens`/`darkColorTokens` for color palettes. Only update this file when the Figma JSON changes and types need to reflect it.

3. **Semantic tokens** (`src/theme/tokens.ts`) — Maps raw palette values to semantic roles (`bg`, `text`, `accent`, `feedback`, etc.). `buildSemanticTokens(mode)` returns the full `CreThemeTokens` object. This is where palette → meaning happens.

4. **CSS custom properties** (`src/theme/cssVars.ts`) — Converts semantic tokens to `--cre-*` CSS variables. Two groups:
   - `coreTokensToCssVars()` — structural vars (spacing, radius, borders, opacity, fonts, layout). Static across themes.
   - `themeTokensToCssVars(tokens)` — color vars (semantic colors, accent, feedback, button colors + states). Change per theme.

The `CreThemeProvider` injects both groups and re-injects the theme group when mode toggles. All component CSS reads from these vars.

**See `docs/context/token-system.md`** for how to add or modify tokens.

---

## CSS Injection Pattern

Each component injects its own CSS once at module load:

```ts
// At the top of Button.tsx, outside the component function
injectStyles('cre-button-styles', BUTTON_CSS);
```

`injectStyles` creates a `<style id="cre-button-styles">` tag in `document.head` if one doesn't already exist. This is a singleton — multiple renders of Button do not duplicate styles. Component CSS uses only `--cre-*` vars, never hardcoded values.

---

## Package Structure

```
packages/cre-web-ui/
├── src/
│   ├── index.ts                    # Public API — all exports
│   ├── components/                 # Interactive UI components (documented in Storybook)
│   │   └── undocumented/           # New components not yet in Storybook
│   ├── primitives/                 # Layout & typography primitives
│   ├── theme/                      # Token system & CSS vars
│   │   ├── CreThemeProvider.tsx
│   │   ├── tokens.ts
│   │   ├── cssVars.ts
│   │   └── rawTokens.ts
│   ├── internal/                   # Not exported — internal utilities
│   │   ├── injectStyles.ts
│   │   └── fieldUtils.ts
│   └── DsTokens/                   # Figma JSON exports (READ-ONLY)
│       ├── Core.tokens.json
│       ├── Light.tokens.json
│       └── Dark.tokens.json
├── dist/                           # Compiled output (ESM + CJS + d.ts)
├── AGENTS.md                       # Windsurf behavioral rules
├── STORYBOOK_SYNC.md               # Cross-repo change log (see below)
├── tsup.config.ts
└── package.json
```

---

## Undocumented Components Convention

New components built for this repo's needs that haven't been documented in the Storybook repo go in:

```
src/components/undocumented/
```

They are still:
- Exported from `src/index.ts` (available to consumers, production-ready)
- Built with the same token-first, data-attribute, forwardRef conventions as all other components
- Recorded in `STORYBOOK_SYNC.md` so they can be handed off to the Storybook repo later

The `undocumented/` folder is a migration queue, not a lower-quality area. Components move out of it when they land in Storybook.

---

## Storybook Sync Pipeline

`STORYBOOK_SYNC.md` is the handoff artifact between this repo and the Storybook repo. It records every change made to the package so the AI in the other repo can pick up context without scanning git history.

**Who writes it:** Windsurf, as part of every task that touches the web-ui package.
**When:** Any time a component is added, modified, or a token is changed.
**Format:** Each entry is a self-contained AI briefing. The format is defined in the file itself.

When ready to migrate to the Storybook repo:
1. Hand `STORYBOOK_SYNC.md` to the Storybook Claude as context
2. Ask it to create stories, prop tables, and documentation for each undocumented component
3. Ask it to update the DesignTokens story for any token changes
4. After a successful sync, clear the migrated entries and commit

---

## Consuming the Package (Backoffice)

The backoffice imports from `@cre/web-ui` via pnpm workspace:

```ts
import { Button, Stack, CreThemeProvider } from '@cre/web-ui';
```

The `CreThemeProvider` must wrap the app root. In the Next.js backoffice it uses `scope='global'`, which applies CSS vars to `document.documentElement`. Consumers do **not** import any CSS files from `@cre/web-ui` — the provider handles all style injection.

---

## Build Requirement

The backoffice imports from `dist/`, not `src/`. After any change to the web-ui package:

```bash
pnpm --filter @cre/web-ui build
```

The backoffice has a `predev` script that runs this build automatically, so `pnpm --filter backoffice dev` is always safe to run cold.

---

## Current Component Inventory

**Components (14):** Button, Card, Field, Input, Select, Checkbox, Badge, Modal, Drawer, DateRangeFilter, Table, FieldSelector, Pagination, EmptyState, ControlsRow

**Primitives (12):** Box, Stack, Inline, Cluster, Container, Grid, Surface, Divider, Text, Heading, IconSlot, ScrollArea

**Theme exports:** CreThemeProvider, useCreTheme, createThemeTokens, coreTokensToCssVars, themeTokensToCssVars

See `docs/context/component-patterns.md` for how to add new ones.
