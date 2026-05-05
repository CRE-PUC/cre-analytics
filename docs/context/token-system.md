# Context: Token System

How the @cre/web-ui token system works and how to extend it. Read before touching any file in `packages/cre-web-ui/src/theme/`.

---

## Layer Overview

```
Figma JSON  (src/DsTokens/*.tokens.json)   ← READ-ONLY
      ↓  rawTokens.ts normalizes into typed objects
Raw Tokens  (coreTokens, lightColorTokens, darkColorTokens)
      ↓  tokens.ts maps palette → semantic roles
Semantic Tokens  (CreThemeTokens)
      ↓  cssVars.ts generates CSS custom properties
CSS Variables  (--cre-*)
      ↓  component CSS reads from vars
UI
```

The key invariant: **nothing below the token system has a hardcoded design value.** Only `rawTokens.ts` references numbers and colors; everything above references CSS vars.

---

## Files & Responsibilities

| File | Responsibility | Edit when |
|------|---------------|-----------|
| `src/DsTokens/Core.tokens.json` | Figma export — spacing, radius, typography | **Never** (Figma-owned) |
| `src/DsTokens/Light.tokens.json` | Figma export — light palette | **Never** (Figma-owned) |
| `src/DsTokens/Dark.tokens.json` | Figma export — dark palette | **Never** (Figma-owned) |
| `src/theme/rawTokens.ts` | Normalizes JSON into typed TS objects | Only when Figma JSON updates require type changes |
| `src/theme/tokens.ts` | Maps palette → semantic roles | Adding or changing semantic meaning |
| `src/theme/cssVars.ts` | Generates `--cre-*` CSS variable maps | Adding new CSS vars or renaming existing ones |

---

## Adding a New Semantic Color

Example: adding `--cre-color-surface-overlay`.

**Step 1 — Add to `tokens.ts`** (inside `buildSemanticTokens()`)
```ts
semantic: {
  // ...existing tokens
  surfaceOverlay: mode === 'light'
    ? tokens.neutral[100].alpha(0.72)
    : tokens.neutral[900].alpha(0.72),
}
```

**Step 2 — Add to `cssVars.ts`** (inside `themeTokensToCssVars()`)
```ts
'--cre-color-surface-overlay': t.semantic.surfaceOverlay,
```

**Step 3 — Update Storybook** (deferred if Storybook repo is not being updated this session)
Add a row to the Semantic Colors section of `DesignTokens.stories.tsx` in the Storybook repo, and record the change in `STORYBOOK_SYNC.md`.

**Step 4 — Use in component CSS**
```css
.cre-overlay { background: var(--cre-color-surface-overlay); }
```

---

## Adding a New Component Token Group

Component-specific tokens allow structural properties (padding, radius, font size) to be overridden per size/variant without duplicating CSS declarations.

Example: adding tokens for a new `Tag` component.

**Step 1 — Define in `tokens.ts`**
```ts
components: {
  // ...existing components
  tag: {
    paddingY: coreTokens.spacing.nano,   // 8px
    paddingX: coreTokens.spacing.pico,   // 12px
    radius: coreTokens.radius.pill,
    fontSize: coreTokens.fontSize.nano,  // 11px
  }
}
```

**Step 2 — Add structural CSS vars in `cssVars.ts`** (in `coreTokensToCssVars()` — mode-independent)
```ts
'--cre-tag-padding-y': t.components.tag.paddingY,
'--cre-tag-padding-x': t.components.tag.paddingX,
'--cre-tag-radius':    t.components.tag.radius,
'--cre-tag-font-size': t.components.tag.fontSize,
```

Color tokens that vary per mode go in `themeTokensToCssVars()` instead.

**Step 3 — Use in the component CSS**
```css
.cre-tag {
  padding: var(--cre-tag-padding-y) var(--cre-tag-padding-x);
  border-radius: var(--cre-tag-radius);
  font-size: var(--cre-tag-font-size);
}
```

---

## CSS Variable Naming Convention

| Category | Pattern | Example |
|----------|---------|---------|
| Semantic color | `--cre-color-{role}` | `--cre-color-bg`, `--cre-color-text-muted` |
| Accent (action) | `--cre-accent-{state}-{prop}` | `--cre-accent-hover-bg` |
| Feedback | `--cre-feedback-{type}-{prop}` | `--cre-feedback-error-border` |
| Component structural | `--cre-{component}-{prop}` | `--cre-button-padding-y` |
| Component state | `--cre-{component}-{state}-{prop}` | `--cre-button-hover-bg` |
| Spacing | `--cre-space-{name}` | `--cre-space-small`, `--cre-space-medium` |
| Radius | `--cre-radius-{name}` | `--cre-radius-medium`, `--cre-radius-pill` |
| Border width | `--cre-border-width-{name}` | `--cre-border-width-small` |
| Opacity | `--cre-opacity-{name}` | `--cre-opacity-light` |
| Font family | `--cre-font-family-{role}` | `--cre-font-family-heading` |
| Font size | `--cre-font-size-{name}` | `--cre-font-size-small` |
| Layout | `--cre-layout-{name}` | `--cre-layout-main` |

---

## Spacing Scale

| Name | Value | CSS Var |
|------|-------|---------|
| none | 0px | `--cre-space-none` |
| quark | 4px | `--cre-space-quark` |
| nano | 8px | `--cre-space-nano` |
| pico | 12px | `--cre-space-pico` |
| micro | 16px | `--cre-space-micro` |
| tiny | 20px | `--cre-space-tiny` |
| xxxsmall | 24px | `--cre-space-xxxsmall` |
| xxsmall | 28px | `--cre-space-xxsmall` |
| xsmall | 32px | `--cre-space-xsmall` |
| small | 36px | `--cre-space-small` |
| medium | 40px | `--cre-space-medium` |
| large | 48px | `--cre-space-large` |
| xlarge | 56px | `--cre-space-xlarge` |
| xxlarge | 64px | `--cre-space-xxlarge` |
| xxxlarge | 80px | `--cre-space-xxxlarge` |
| huge | 120px | `--cre-space-huge` |
| giant | 160px | `--cre-space-giant` |
| titan | 200px | `--cre-space-titan` |

---

## Border Radius Scale

| Name | Value |
|------|-------|
| none | 0px |
| xxsmall | 4px |
| xsmall | 8px |
| small | 12px |
| medium | 16px |
| large | 20px |
| xlarge | 24px |
| xxlarge | 28px |
| xxxlarge | 32px |
| huge | 36px |
| giant | 40px |
| titan | 48px |
| pill | 9999px |

---

## Typography

**Font Families (via CSS vars):**
- `--cre-font-family-heading` — Poppins (headings, subtitles, buttons)
- `--cre-font-family-body` — Source Sans Pro (body, captions, overlines)

These vars set the font-family names, but the font files must be loaded by the consumer application (e.g., via `next/font/google` in the backoffice).

**Font Sizes** — 15 steps from 11px (quark) to 48px (huge). Access via `--cre-font-size-{name}`.
