---
id: TASK-027
title: Add CORS middleware to Firebase Functions Express app
status: pending
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/firebase.md
doc-impact: []
---

## Description

The Firebase Functions Express app (`functions/src/app.ts`) has no CORS middleware. This is not blocking current Editor bakes or standalone runtime session submissions — `System.Net.Http.HttpClient` (used by the Bake window) and `UnityWebRequest` (used by `SessionSender`) are not browsers and do not enforce CORS. However, CORS **is** required for:

- Unity **WebGL** builds — WebGL runs inside the browser and uses the browser's fetch/XHR, which enforces CORS
- Any future browser-based client calling the API directly (e.g., a dashboard that bakes schemas)

Add the `cors` npm package and wire it up in `app.ts` before any routes.

**CORS config for this API:**

Because Unity games can be hosted on any origin (itch.io, a custom CDN, a publisher domain), it is not possible to whitelist specific origins for the Unity SDK. The API uses projectKey-based authentication (not cookies), so there is no CSRF risk — all-origins (`*`) is safe here. Use `cors()` with default options, which allows all origins.

**Files to change:**

1. `functions/package.json` — add `cors` and `@types/cors` as dependencies
2. `functions/src/app.ts` — import and apply `cors()` middleware before `express.json()` and the router

## Acceptance Criteria

- [ ] `cors` is listed in `functions/package.json` dependencies (not devDependencies)
- [ ] `@types/cors` is listed in `functions/package.json` devDependencies
- [ ] `app.ts` applies `app.use(cors())` before `app.use(express.json())`
- [ ] A preflight OPTIONS request to `http://127.0.0.1:5001/demo-cre-analytics/southamerica-east1/api/schemas/bake` returns HTTP 204 with `Access-Control-Allow-Origin: *`
- [ ] Existing POST routes still work after the change

## Relevant Data

**Current `functions/src/app.ts`:**
```ts
import express from 'express';
import * as admin from 'firebase-admin';
import { router } from './routes';

admin.initializeApp();

const app = express();
app.use(express.json());
app.use('/', router);

export { app };
```

**Target `functions/src/app.ts`:**
```ts
import cors from 'cors';
import express from 'express';
import * as admin from 'firebase-admin';
import { router } from './routes';

admin.initializeApp();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/', router);

export { app };
```

Install with:
```
pnpm --filter functions add cors
pnpm --filter functions add -D @types/cors
```

> **Dependency note:** Run the pnpm install commands before editing `app.ts`, so the import resolves.
