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

## No CLAUDE.md
Do not create a `CLAUDE.md` file in this folder.
