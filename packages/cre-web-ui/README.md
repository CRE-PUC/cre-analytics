# @cre/web-ui

Token-based React component library for the CRE design system. Ships dual ESM + CJS bundles with full TypeScript declarations.

For a more detailed, AI-friendly guide intended for teams consuming this package from other repositories, see: `./USAGE.md`.

## Installation

```bash
pnpm add @cre/web-ui
```

React 18+ is a peer dependency.

## Quick start

Wrap your app (or any subtree) in `CreThemeProvider`. All components inside will inherit the theme.

```tsx
import { CreThemeProvider, Button, Stack, Text } from '@cre/web-ui';

export default function App() {
  return (
    <CreThemeProvider initialMode="light">
      <Stack gap="micro">
        <Text>Hello from the CRE design system</Text>
        <Button>Click me</Button>
      </Stack>
    </CreThemeProvider>
  );
}
```

### Theme toggle

```tsx
import { CreThemeProvider, useCreTheme, Button } from '@cre/web-ui';

function ThemeToggle() {
  const { mode, setMode } = useCreTheme();
  return (
    <Button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      Switch to {mode === 'light' ? 'dark' : 'light'} mode
    </Button>
  );
}

// Controlled from outside
<CreThemeProvider mode={mode} onModeChange={setMode}>
  <ThemeToggle />
</CreThemeProvider>
```

## Component overview

### Primitives — layout & typography

| Component | Purpose |
|-----------|---------|
| `Box` | Generic polymorphic wrapper |
| `Stack` | Vertical flex column with token gap |
| `Inline` | Horizontal flex row with token gap |
| `Cluster` | Wrapping horizontal flex (auto-wrap) |
| `Grid` | CSS Grid — fixed columns or auto-fit by min width |
| `Container` | Max-width page wrapper (5 sizes) |
| `Surface` | Elevated surface with border and radius variants |
| `Divider` | Horizontal or vertical separator |
| `Text` | Body copy with variant (body/caption/label) and tone |
| `Heading` | Semantic h1–h6 with automatic sizing |
| `ScrollArea` | Scrollable container with iOS momentum scroll |
| `IconSlot` | Fixed-size icon wrapper (aria-hidden) |

### Components

| Component | Purpose |
|-----------|---------|
| `Button` | Primary action button (regular / large / vr sizes) |
| `Input` | Text input with optional leading/trailing slots |
| `Select` | Custom select with keyboard navigation |
| `Checkbox` | Checkbox with indeterminate state support |
| `Field` | Form field wrapper — label, description, error |
| `Badge` | Inline status label (neutral/success/warning/error/accent) |
| `Card` | Surface with optional header and footer sections |
| `Modal` | Centered overlay dialog |
| `Drawer` | Side panel overlay (left/right, slide/pop motion) |
| `Table` | Data table with sorting and row selection |
| `Pagination` | Previous / page count / Next navigation |
| `EmptyState` | Placeholder for empty content areas |
| `ControlsRow` | Toolbar layout — left group and right group |

## Token system

All components consume `var(--cre-*)` CSS custom properties set by `CreThemeProvider`. Tokens come from Figma JSON exports and are layered:

```
DsTokens/*.tokens.json   (Figma)
  → rawTokens.ts         (normalised palette)
  → tokens.ts            (semantic mapping: bg, text, border, accent …)
  → cssVars.ts           (CSS custom properties)
  → CreThemeProvider     (injects vars + exposes useCreTheme)
```

Advanced consumers can import raw values directly:

```ts
import { coreTokens, lightColorTokens, darkColorTokens } from '@cre/web-ui';
```

## CSS variables reference

```
--cre-color-bg            Page background
--cre-color-surface       Elevated surface (card, panel)
--cre-color-surface-raised Higher elevation (modal, tooltip)
--cre-color-text          Primary text
--cre-color-text-muted    Secondary text
--cre-color-text-subtle   Placeholder / hint text
--cre-color-border        Default border
--cre-color-border-strong Stronger border
--cre-color-focus         Keyboard focus ring

--cre-accent-bg / -fg / -border         Primary action color + states
--cre-feedback-success/alert/error-*    Semantic feedback colors

--cre-space-{name}        Spacing tokens
--cre-radius-{name}       Border radius tokens
--cre-font-family-{name}  Font family tokens
--cre-font-size-{name}    Font size tokens
```

See the **Design Tokens** story in Storybook for a live visual reference.
