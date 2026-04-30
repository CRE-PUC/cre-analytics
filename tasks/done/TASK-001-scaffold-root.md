---
id: TASK-001
title: Scaffold root project files
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
doc-impact: []
---

## Description

Create the root-level configuration files for the monorepo. This is purely mechanical scaffolding — no logic, no implementation.

## Acceptance Criteria

- [ ] `pnpm-workspace.yaml` exists at repo root, listing `functions` and `backoffice` as packages
- [ ] `firebase.json` exists with stubs for `functions`, `hosting`, and `firestore` sections (see Relevant Data)
- [ ] `.firebaserc` exists with a placeholder project alias
- [ ] `.gitignore` at repo root covers: Unity artifacts, Node artifacts, Firebase emulator data, OS files (see Relevant Data)
- [ ] No new folders created — only these config files

## Relevant Data

### pnpm-workspace.yaml
```yaml
packages:
  - 'functions'
  - 'backoffice'
```

### firebase.json
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "hosting": {
    "public": "backoffice/out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true }
  }
}
```

### .firebaserc
```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

### .gitignore sections to include

**Unity:**
```
# Unity
unity-project/Library/
unity-project/Temp/
unity-project/obj/
unity-project/Logs/
unity-project/UserSettings/
unity-project/MemoryCaptures/
unity-project/.vsconfig
*.csproj
*.sln
*.suo
*.user
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.VC.db
```

**Node / pnpm:**
```
# Node
node_modules/
.pnpm-store/
dist/
.next/
out/
.env
.env.local
.env.*.local
```

**Firebase:**
```
# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log
```

**OS:**
```
# OS
.DS_Store
Thumbs.db
```

Also create these two empty stubs (required by firebase.json):
- `firestore.rules` — with content:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
- `firestore.indexes.json` — with content: `{ "indexes": [], "fieldOverrides": [] }`
