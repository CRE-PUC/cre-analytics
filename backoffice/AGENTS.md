<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — backoffice

These rules apply to all tasks touching the `backoffice/` folder, on top of the root `AGENTS.md`.

## Package management
Use **pnpm** only. Never `npm install` or `yarn`.

## Static export — do not remove
`next.config.ts` has `output: 'export'`. This is required for Firebase Hosting deployment. Do not remove it or add any SSR patterns (`getServerSideProps`, server components that fetch at request time, API routes). All data fetching must be client-side.

## Firebase
Firebase is initialized once in `src/lib/firebase.ts` and exports `db` and `auth`. Import from there — do not call `initializeApp` or `getFirestore` anywhere else in the app.

## Web UI — Use @cre/web-ui, no standalone CSS

All UI in the backoffice must be built with `@cre/web-ui` components and primitives. Do not:
- Write CSS files, CSS modules, or inline styles for visual styling
- Use Tailwind CSS classes (Tailwind has been removed from this package)
- Import fonts or define CSS vars that duplicate what `@cre/web-ui` already provides

For layout and typography: use primitives (`Stack`, `Inline`, `Grid`, `Text`, `Heading`, etc.).
For interactive elements: use components (`Button`, `Input`, `Table`, `Modal`, etc.).
For spacing and color values in the rare case you need an inline style: use `var(--cre-*)` CSS custom properties.

`@cre/web-ui` does not export any CSS files. Do not attempt to import CSS from it — style injection is handled automatically when components render and `CreThemeProvider` is active.

## CreThemeProvider Must Be Present

The root layout wraps all content in `<CreThemeProvider scope="global" initialMode="light">`. This must remain in place — removing it causes all `--cre-*` CSS vars to be undefined and the entire UI breaks.

If Next.js raises a server/client boundary error for the provider, wrap it in a thin `'use client'` component rather than removing it.

## Build web-ui before running the backoffice

The backoffice imports from `@cre/web-ui`'s compiled `dist/`. The `predev` script handles this automatically:

```bash
pnpm --filter backoffice dev   # runs web-ui build first via predev, then starts Next.js
```

If you run the Next.js dev server directly without the predev script, you may get stale or missing module errors.

## No CLAUDE.md
Do not create a `CLAUDE.md` file in this folder.
