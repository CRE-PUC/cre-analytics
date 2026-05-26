---
id: TASK-006
title: Local dev environment — emulators + unified dev script
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/firebase.md
doc-impact:
  - docs/context/firebase.md
---

## Description

Set up a single `pnpm dev` command at the repo root that starts both Firebase Emulators and the Next.js backoffice dev server in parallel. The backoffice must automatically connect to the local emulators (Firestore + Auth) when `NEXT_PUBLIC_USE_EMULATOR=true`.

Currently there is no root `package.json`, and the backoffice's `firebase.ts` always points to the real Firebase project. A developer has no one-command way to run the full local stack.

## Acceptance Criteria

- [ ] Root `package.json` is created (private, no version) with a `dev` script that runs `firebase emulators:start` and `pnpm --filter backoffice dev` concurrently via `concurrently`
- [ ] `firebase.json` has an `auth` emulator entry at port 9099
- [ ] `backoffice/src/lib/firebase.ts` conditionally calls `connectFirestoreEmulator(db, 'localhost', 8080)` and `connectAuthEmulator(auth, 'http://localhost:9099')` when `process.env.NEXT_PUBLIC_USE_EMULATOR === 'true'`
- [ ] `backoffice/.env.local.example` is created with all required env vars documented
- [ ] `backoffice/.env.local` is created with emulator-safe values (no real credentials — emulator accepts `demo-*` project IDs)
- [ ] `backoffice/.env.local` is listed in `.gitignore` (root-level or backoffice-level — add it if missing)
- [ ] Running `pnpm install && pnpm dev` from the repo root starts both the Firebase Emulator UI (localhost:4000) and the Next.js app (localhost:3000)

## Relevant Data

**Root `package.json` to create at `/package.json`:**
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
After creating this file, run `pnpm install` from the root to install `concurrently`.

**`firebase.json` emulators section — add `auth` entry:**
```json
"emulators": {
  "auth": { "port": 9099 },
  "functions": { "port": 5001 },
  "firestore": { "port": 8080 },
  "hosting": { "port": 5000 },
  "ui": { "enabled": true }
}
```

**`backoffice/src/lib/firebase.ts` — add emulator connection after SDK init:**
```ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

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

if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```
Note: `connectFirestoreEmulator` and `connectAuthEmulator` must only be called once per app lifetime. The `getApps().length === 0` guard above already ensures a single app instance, so repeated HMR reloads won't double-connect.

**`backoffice/.env.local.example` to create:**
```
# Copy this file to .env.local for local development with Firebase Emulators

NEXT_PUBLIC_FIREBASE_API_KEY=fake-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-cre-analytics
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_USE_EMULATOR=true
```

**`backoffice/.env.local` to create (same values as example).**

The project ID `demo-cre-analytics` is intentional — Firebase Emulators accept any `demo-*` project ID without requiring a real Firebase project to exist.
