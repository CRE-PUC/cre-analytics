---
id: TASK-002
title: Scaffold Firebase Functions
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/session-data-format.md
doc-impact: []
---

## Description

Create the `functions/` directory with a TypeScript Firebase Functions setup and a stub `submitSession` endpoint. No business logic yet — just the skeleton that builds cleanly.

## Acceptance Criteria

- [ ] `functions/package.json` exists with TypeScript, `firebase-functions`, and `firebase-admin` dependencies (pnpm)
- [ ] `functions/tsconfig.json` exists, compiles to `lib/`, targets ES2020, `module: commonjs`
- [ ] `functions/.eslintrc.js` exists with basic TypeScript + Firebase rules
- [ ] `functions/src/index.ts` exports a stub `submitSession` HTTPS callable function (see Relevant Data)
- [ ] `functions/src/types.ts` exports the `SessionData` TypeScript type matching the session format
- [ ] Running `pnpm build` inside `functions/` compiles without errors
- [ ] `functions/lib/` is added to `.gitignore` (or the root `.gitignore` already covers `dist/` — add `functions/lib/` explicitly if not)

## Relevant Data

### functions/package.json (key fields)
```json
{
  "name": "cre-analytics-functions",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "lint": "eslint --ext .ts ."
  },
  "engines": { "node": "20" },
  "main": "lib/index.js"
}
```

Dependencies: `firebase-functions@^6`, `firebase-admin@^13`
DevDependencies: `typescript@^5`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint`, `eslint-plugin-import`

### functions/src/types.ts
```typescript
export interface AnalyticsDataEntry {
  columnName: string;
  value: string | number | boolean | null;
}

export interface SessionMetaData {
  projectId: string;
  schemaVersion: string;
  sessionId: string;
  platform: string;
  startedAt: string;
  endedAt: string;
}

export interface SessionData {
  metaData: SessionMetaData;
  data: AnalyticsDataEntry[];
}

export interface SubmitSessionRequest {
  sessionData: SessionData;
}
```

### functions/src/index.ts (stub)
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SubmitSessionRequest } from './types';

admin.initializeApp();

export const submitSession = functions.https.onCall(
  async (request: functions.https.CallableRequest<SubmitSessionRequest>) => {
    const { sessionData } = request.data;

    if (!sessionData?.metaData?.projectId || !sessionData?.metaData?.sessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required metaData fields');
    }

    const { projectId, sessionId } = sessionData.metaData;

    await admin
      .firestore()
      .collection('projects')
      .doc(projectId)
      .collection('sessions')
      .doc(sessionId)
      .set({ sessionData });

    return { success: true };
  }
);
```
