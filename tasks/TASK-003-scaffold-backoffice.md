---
id: TASK-003
title: Scaffold Next.js backoffice
status: pending
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/session-data-format.md
doc-impact: []
---

## Description

Initialize the `backoffice/` Next.js application using pnpm. This is a skeleton only — no dashboard logic, no real Firebase queries. The goal is a project that builds cleanly and is wired to Firebase.

## Acceptance Criteria

- [ ] `backoffice/` is a Next.js 15 app with TypeScript, using the App Router
- [ ] Package manager is pnpm
- [ ] Tailwind CSS is configured
- [ ] `backoffice/package.json` exists with scripts: `dev`, `build`, `start`, `lint`
- [ ] `backoffice/src/app/page.tsx` renders a placeholder "CRE Analytics" heading — no real content
- [ ] Firebase is configured: `backoffice/src/lib/firebase.ts` initialises the Firebase app using environment variables (see Relevant Data)
- [ ] `backoffice/.env.local.example` exists listing all required env vars (see Relevant Data)
- [ ] `backoffice/.env.local` is NOT committed (already covered by root `.gitignore` — verify)
- [ ] `pnpm build` inside `backoffice/` completes without errors (static export `output: 'export'` configured in `next.config.ts`)
- [ ] `backoffice/out/` is added to root `.gitignore` if not already present

## Relevant Data

### next.config.ts
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
```

### backoffice/src/lib/firebase.ts
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
```

### .env.local.example
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Key dependencies
- `firebase@^11`
- `next@^15`
- `react@^19`
- `react-dom@^19`
- Dev: `typescript@^5`, `@types/react`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint`, `eslint-config-next`
