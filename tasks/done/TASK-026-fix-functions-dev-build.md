---
id: TASK-026
title: Fix functions dev build pipeline — compile TypeScript before emulator starts
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/firebase.md
doc-impact: []
---

## Description

The Firebase Functions emulator starts but reports no registered functions because `functions/lib/` is empty — the TypeScript source has never been compiled. The emulator loads from `functions/lib/index.js` (set as `"main"` in `functions/package.json`), but the root `package.json` dev script starts the emulator directly without building first:

```json
"dev": "concurrently \"firebase emulators:start\" \"pnpm --filter backoffice dev\""
```

This causes any request to the emulator to return HTTP 404 with "Function southamerica-east1-api does not exist, valid functions are: " (empty list).

Two things need fixing:

**1. Root dev script** — Build functions once before starting the emulator, then run `tsc --watch` in parallel so changes hot-reload into the emulator:

```json
"dev": "pnpm --filter functions build && concurrently \"pnpm --filter functions build:watch\" \"firebase emulators:start\" \"pnpm --filter backoffice dev\""
```

**2. `firebase.json` predeploy hook** — The functions block has no `predeploy` entry, so `firebase deploy` would also try to deploy uncompiled code in CI. Add it:

```json
"functions": {
  "source": "functions",
  "runtime": "nodejs20",
  "predeploy": ["pnpm --prefix functions build"]
}
```

Note: `functions/package.json` already has `"build": "tsc"` and `"build:watch": "tsc --watch"` scripts. No changes needed inside `functions/`.

## Acceptance Criteria

- [ ] Running `pnpm dev` from repo root successfully starts the emulator with the `api` function registered (visible in emulator UI at http://localhost:4000)
- [ ] `functions/lib/index.js` exists and exports the `api` function after dev script runs
- [ ] Hitting `POST http://127.0.0.1:5001/demo-cre-analytics/southamerica-east1/api/schemas/bake` returns something other than 404 (even a 4xx error about missing body/auth is fine — 404 means no function)
- [ ] `firebase.json` functions block has a `predeploy` entry that runs `pnpm --prefix functions build`
- [ ] Changes to `functions/src/` while dev is running cause `lib/` to update automatically (tsc --watch)

## Relevant Data

**Root `package.json` (current):**
```json
{
  "name": "cre-analytics",
  "private": true,
  "scripts": {
    "dev": "concurrently \"firebase emulators:start\" \"pnpm --filter backoffice dev\""
  },
  "devDependencies": {
    "concurrently": "^9"
  }
}
```

**`functions/package.json` (relevant parts):**
```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch"
  },
  "main": "lib/index.js"
}
```

**`firebase.json` (current functions block):**
```json
"functions": {
  "source": "functions",
  "runtime": "nodejs20"
}
```

Files to edit:
- `package.json` (repo root) — update `dev` script
- `firebase.json` — add `predeploy` to functions block
