---
id: TASK-008
title: Firebase Auth — AuthProvider, auth guard, and login page
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/web-ui.md
  - docs/context/component-patterns.md
doc-impact: []
---

## Description

Implement Firebase Authentication for the backoffice. Three pieces:

1. **`AuthProvider`** — React context wrapping `onAuthStateChanged`, gives the entire app access to the current user and loading state.
2. **`AuthGuard`** — Client component that protects any route: redirects to `/login?redirect=<pathname>` if unauthenticated, renders children if authenticated.
3. **`/login` page** — Email + password sign-in form built entirely with `@cre/web-ui` components. Redirects to the `?redirect` param after success, or to `/projects` if none.

The backoffice currently has no auth layer. `backoffice/src/lib/firebase.ts` already exports `auth` from the Firebase SDK.

Do **not** modify anything in `packages/cre-web-ui/` — all needed components are already built.

## Acceptance Criteria

- [ ] `backoffice/src/lib/AuthProvider.tsx` exports `AuthProvider` (component) and `useAuth` hook; provides `{ user: User | null, loading: boolean }`
- [ ] `backoffice/src/app/layout.tsx` wraps the app in `<AuthProvider>` (inside `<CreThemeProvider>`)
- [ ] `backoffice/src/components/AuthGuard.tsx` exports `AuthGuard`; redirects when unauthenticated, renders `children` when authenticated, renders `null` while loading
- [ ] `backoffice/src/app/login/page.tsx` has an email + password form using only `@cre/web-ui` components
- [ ] Successful login redirects to `searchParams.get('redirect')` decoded, or `/projects` if absent
- [ ] Failed login shows an inline error message using `<Text tone="danger">`
- [ ] The login page itself is not wrapped in `AuthGuard` (it must be accessible when unauthenticated)

## Relevant Data

**`backoffice/src/lib/AuthProvider.tsx`:**
```tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextValue { user: User | null; loading: boolean; }
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}
```

**`backoffice/src/app/layout.tsx` — updated wrapping order:**
```tsx
<CreThemeProvider scope="global" initialMode="light">
  <AuthProvider>
    {children}
  </AuthProvider>
</CreThemeProvider>
```

**`backoffice/src/components/AuthGuard.tsx`:**
```tsx
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) return null;
  return <>{children}</>;
}
```

**`backoffice/src/app/login/page.tsx` — available `@cre/web-ui` components:**
```ts
import { Surface, Stack, Heading, Text, Field, Input, Button } from '@cre/web-ui';
```
- `Surface` — card container; use `variant="raised"` with `padding="medium"`
- `Stack` — vertical flex layout; use `gap="small"`
- `Heading` — `level={3}` for "Sign in"
- `Field` — wraps a label + input; accepts `label` prop
- `Input` — text input; `type="email"` and `type="password"`
- `Button` — `variant="primary"` for the submit button; set `disabled` while submitting
- `Text` — `tone="danger"` for the error message

**Firebase sign-in:**
```ts
import { signInWithEmailAndPassword } from 'firebase/auth';
await signInWithEmailAndPassword(auth, email, password);
```

**Redirect after login:**
```ts
import { useSearchParams, useRouter } from 'next/navigation';
const searchParams = useSearchParams();
const redirect = searchParams.get('redirect') ?? '/projects';
router.replace(redirect);
```

**Error handling — map common Firebase error codes to friendly messages:**
- `auth/invalid-credential` or `auth/wrong-password` → "Incorrect email or password."
- `auth/user-not-found` → "No account found with that email."
- `auth/too-many-requests` → "Too many attempts. Try again later."
- All others → "Something went wrong. Please try again."
