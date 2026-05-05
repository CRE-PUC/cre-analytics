---
id: TASK-016
title: Refactor functions to Express REST API (South America, Zod validation)
status: done
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/session-data-format.md
doc-impact:
  - docs/context/firebase.md
---

## Description

The current functions use `firebase-functions` `onCall` (Firebase callable protocol), which requires the Firebase client SDK to call correctly and doesn't work as a plain HTTP REST endpoint from Postman or Unity's `UnityWebRequest`. Replace the entire functions backend with a single Express app served via Firebase Functions Gen 2 `onRequest`, deployed to the `southamerica-east1` (São Paulo) region.

Goals:
- **Plain REST** — standard `POST` requests with JSON bodies, no callable envelope. Works from Postman, Unity, or any HTTP client.
- **South America region** — reduces latency for the primary user base.
- **Zod validation** — structured, typed validation with clear error messages for all request bodies.
- **Controller structure** — separate files per domain so the code is easy to extend.

Also update `postman/CRE Analytics.postman_collection.json` to use the new routes and remove the callable-format body wrapper.

## File Structure

Delete `functions/src/index.ts` content and replace with the structure below. Do not leave the old `onCall` functions.

```
functions/src/
├── index.ts                         # Single export: api = onRequest(...)
├── app.ts                           # Express app, middleware, route registration
├── middleware/
│   └── validateProjectKey.ts        # Auth middleware
├── controllers/
│   ├── schemas.controller.ts        # POST /schemas/bake handler
│   └── sessions.controller.ts       # POST /sessions handler
├── routes/
│   └── index.ts                     # Registers all routes on Express Router
└── types.ts                         # Keep existing, add Zod schemas alongside TS types
```

## Acceptance Criteria

- [ ] `express` and `zod` added to `functions/package.json` dependencies; `@types/express` added to devDependencies
- [ ] `functions/src/index.ts` exports a single `api` function using `onRequest` from `firebase-functions/v2/https` with `{ region: 'southamerica-east1' }`
- [ ] Express app in `functions/src/app.ts` uses `express.json()` middleware and mounts routes from `routes/index.ts`
- [ ] `validateProjectKey` middleware reads `projectId` and `projectKey` from `req.body`, fetches the project document, returns HTTP 404 if not found, HTTP 403 if key mismatch, attaches `req.project` (the Firestore document data) on success
- [ ] Zod schemas validate request bodies before the middleware runs; invalid bodies return HTTP 400 with `{ error: 'Validation error', details: [...zod issues] }`
- [ ] `POST /schemas/bake` — validates body, runs auth middleware, writes `projects/{projectId}/schemas/{schemaVersion}`, returns `{ success: true }`
- [ ] `POST /sessions` — validates body, runs auth middleware, checks schema if exists (HTTP 422 with missing column list if columns missing), writes session, returns `{ success: true }`
- [ ] `functions/src/types.ts` keeps existing TypeScript interfaces (they remain useful); Zod schemas are exported from the same file or from route files — no duplication of shape definitions
- [ ] `postman/CRE Analytics.postman_collection.json` updated: new URLs, plain JSON bodies (no `{"data": ...}` wrapper), region `southamerica-east1` in baseUrl
- [ ] `functions/` builds without TypeScript errors (`pnpm build` in `functions/`)

## Relevant Data

**New dependencies to add (`functions/package.json`):**
```json
"dependencies": {
  "express": "^4",
  "firebase-admin": "^13",
  "firebase-functions": "^6",
  "zod": "^3"
},
"devDependencies": {
  "@types/express": "^4",
  ...existing devDependencies...
}
```

**`functions/src/index.ts`:**
```ts
import { onRequest } from 'firebase-functions/v2/https';
import { app } from './app';

export const api = onRequest({ region: 'southamerica-east1' }, app);
```

**`functions/src/app.ts`:**
```ts
import express from 'express';
import { router } from './routes';

const app = express();
app.use(express.json());
app.use('/', router);

export { app };
```

**`functions/src/middleware/validateProjectKey.ts`:**
```ts
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  project?: FirebaseFirestore.DocumentData;
}

export async function validateProjectKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const projectId: string = req.body?.projectId ?? req.body?.sessionData?.metaData?.projectId;
  const projectKey: string = req.body?.projectKey;

  if (!projectId || !projectKey) {
    res.status(400).json({ error: 'projectId and projectKey are required' });
    return;
  }

  const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
  if (!projectDoc.exists) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  if (projectDoc.data()?.projectKey !== projectKey) {
    res.status(403).json({ error: 'Invalid project key' });
    return;
  }

  req.project = projectDoc.data();
  next();
}
```

Note: `projectId` is read from `req.body.projectId` for `/schemas/bake`, and from `req.body.sessionData.metaData.projectId` for `/sessions`. The middleware handles both locations.

**`functions/src/routes/index.ts`:**
```ts
import { Router } from 'express';
import { bakeSchema } from '../controllers/schemas.controller';
import { submitSession } from '../controllers/sessions.controller';
import { validateProjectKey } from '../middleware/validateProjectKey';

export const router = Router();

router.post('/schemas/bake', validateProjectKey, bakeSchema);
router.post('/sessions', validateProjectKey, submitSession);
```

**Zod schemas (put in `functions/src/types.ts` or alongside controllers):**
```ts
import { z } from 'zod';

export const SchemaColumnZod = z.object({
  columnName: z.string().min(1),
  dataType: z.enum(['string', 'number', 'boolean']).nullable().optional(),
});

export const BakeSchemaBodyZod = z.object({
  projectId: z.string().min(1),
  projectKey: z.string().min(1),
  schemaVersion: z.string().min(1),
  columns: z.array(SchemaColumnZod).min(1),
});

export const SubmitSessionBodyZod = z.object({
  projectKey: z.string().min(1),
  sessionData: z.object({
    metaData: z.object({
      projectId: z.string().min(1),
      schemaVersion: z.string().min(1),
      sessionId: z.string().min(1),
      platform: z.string().min(1),
      startedAt: z.string().datetime({ offset: true }),
      endedAt: z.string().datetime({ offset: true }),
    }),
    data: z.array(z.object({
      columnName: z.string().min(1),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    })),
  }),
});
```

Use a shared `validate(schema)` helper to avoid repeating `.safeParse` in each controller:
```ts
export function validate<T>(schema: z.ZodSchema<T>, body: unknown, res: Response): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation error', details: result.error.issues });
    return null;
  }
  return result.data;
}
```

**Schema validation in sessions controller (HTTP 422 for missing columns):**
```ts
const schemaDoc = await admin.firestore()
  .collection('projects').doc(projectId)
  .collection('schemas').doc(schemaVersion)
  .get();

if (schemaDoc.exists) {
  const schema = schemaDoc.data() as ProjectSchema;
  const submitted = new Set(sessionData.data.map(d => d.columnName));
  const missing = schema.columns.map(c => c.columnName).filter(n => !submitted.has(n));
  if (missing.length > 0) {
    res.status(422).json({ error: 'Missing required columns', missingColumns: missing });
    return;
  }
}
```

**Updated Postman collection** — replace the existing `postman/CRE Analytics.postman_collection.json` with new URLs and plain JSON bodies:

Collection variables:
- `baseUrl` (local): `http://127.0.0.1:5001/demo-cre-analytics/southamerica-east1/api`
- `baseUrl` (prod): `https://southamerica-east1-YOUR_PROJECT.cloudfunctions.net/api`

Bake Schema request:
- URL: `{{baseUrl}}/schemas/bake`
- Body (no `{"data": ...}` wrapper):
```json
{
  "projectId": "{{projectId}}",
  "projectKey": "{{projectKey}}",
  "schemaVersion": "1.0.0",
  "columns": [
    { "columnName": "Tutorial Diegetico/Começou em" },
    { "columnName": "Tutorial Diegetico/Cliques/Botão A" },
    { "columnName": "Experiência Principal/Começou em" },
    { "columnName": "Experiência Principal/Cliques/Botão A" }
  ]
}
```

Submit Session request:
- URL: `{{baseUrl}}/sessions`
- Body:
```json
{
  "projectKey": "{{projectKey}}",
  "sessionData": {
    "metaData": {
      "projectId": "{{projectId}}",
      "schemaVersion": "1.0.0",
      "sessionId": "test-session-001",
      "platform": "quest_3",
      "startedAt": "2026-05-05T10:00:00.000Z",
      "endedAt": "2026-05-05T10:05:00.000Z"
    },
    "data": [
      { "columnName": "Tutorial Diegetico/Começou em", "value": "2026-05-05T10:00:00Z" },
      { "columnName": "Tutorial Diegetico/Cliques/Botão A", "value": 40 },
      { "columnName": "Experiência Principal/Começou em", "value": "2026-05-05T10:05:00Z" },
      { "columnName": "Experiência Principal/Cliques/Botão A", "value": 30 }
    ]
  }
}
```

## Important Notes

- `admin.initializeApp()` must remain called once before any Firestore access. Keep it in `app.ts` or `index.ts`.
- The old `onCall` exports (`submitSession`, `bakeSchema`) must be removed — they no longer exist after this refactor.
- The emulator needs to be restarted (`pnpm dev` from repo root) after rebuilding for the new export to be picked up.
- Do not add CORS middleware — the Unity SDK and Postman both call directly, not from a browser.
