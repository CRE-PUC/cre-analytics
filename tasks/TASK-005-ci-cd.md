---
id: TASK-005
title: Scaffold CI/CD GitHub Actions workflows
status: pending
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

Create two GitHub Actions workflows: one for deploying to Firebase (functions + hosting), one for validating the UPM package structure. These are scaffolds — they should be correct and runnable but will need secrets configured manually in GitHub.

## Acceptance Criteria

- [ ] `.github/workflows/firebase-deploy.yml` exists (see Relevant Data)
  - [ ] Triggers on push to `main`
  - [ ] Separate jobs for Functions build and Hosting build
  - [ ] Uses `FIREBASE_TOKEN` secret for deployment
- [ ] `.github/workflows/upm-validate.yml` exists (see Relevant Data)
  - [ ] Triggers on push to `main` and on PRs
  - [ ] Validates that `packages/com.cre.analytics/package.json` is valid JSON
  - [ ] Validates that required fields (`name`, `version`, `unity`) are present
- [ ] Neither workflow references the Unity project or attempts to compile Unity — see constraint below

## Constraints

The UPM validate workflow must **not** attempt to compile Unity or run Unity tests. Unity compilation requires the editor to be open and is not suitable for CI at this stage. The validate step is purely structural (package.json validity, required files present).

## Relevant Data

### .github/workflows/firebase-deploy.yml
```yaml
name: Firebase Deploy

on:
  push:
    branches: [main]

jobs:
  build-functions:
    name: Build & Deploy Functions
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: functions/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: functions
        run: pnpm install --frozen-lockfile

      - name: Build
        working-directory: functions
        run: pnpm build

  build-backoffice:
    name: Build & Deploy Backoffice
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: backoffice/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: backoffice
        run: pnpm install --frozen-lockfile

      - name: Build
        working-directory: backoffice
        run: pnpm build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}

  deploy:
    name: Firebase Deploy
    runs-on: ubuntu-latest
    needs: [build-functions, build-backoffice]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Install and build all
        run: |
          cd functions && pnpm install --frozen-lockfile && pnpm build && cd ..
          cd backoffice && pnpm install --frozen-lockfile && pnpm build && cd ..
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}

      - name: Deploy to Firebase
        run: firebase deploy --non-interactive
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

### .github/workflows/upm-validate.yml
```yaml
name: UPM Package Validate

on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    name: Validate UPM Package
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate package.json is valid JSON
        run: |
          python3 -c "import json; json.load(open('packages/com.cre.analytics/package.json'))"
          echo "package.json is valid JSON"

      - name: Validate required package fields
        run: |
          python3 - <<'EOF'
          import json, sys
          with open('packages/com.cre.analytics/package.json') as f:
              pkg = json.load(f)
          required = ['name', 'version', 'unity', 'displayName']
          missing = [k for k in required if k not in pkg]
          if missing:
              print(f"Missing required fields: {missing}")
              sys.exit(1)
          print(f"Package: {pkg['name']}@{pkg['version']} (Unity {pkg['unity']})")
          EOF

      - name: Check required folders exist
        run: |
          test -d packages/com.cre.analytics/Runtime || (echo "Missing Runtime/" && exit 1)
          test -d packages/com.cre.analytics/Editor  || (echo "Missing Editor/" && exit 1)
          echo "Required folders present"
```
