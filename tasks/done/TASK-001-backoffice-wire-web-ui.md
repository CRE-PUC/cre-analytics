---
id: TASK-001
title: Wire @cre/web-ui as a pnpm workspace dependency in backoffice
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/web-ui.md
doc-impact: []
---

## Description

The `@cre/web-ui` package lives at `packages/cre-web-ui/` in this monorepo, but it is not yet registered in the pnpm workspace and not yet a dependency of the backoffice. This task wires up the plumbing so the backoffice can import from `@cre/web-ui`.

**Do not change any application code or CSS in this task.** Only package configuration and workspace setup.

## Acceptance Criteria

- [ ] `pnpm-workspace.yaml` includes `'packages/cre-web-ui'` in its `packages` array
- [ ] `backoffice/package.json` lists `"@cre/web-ui": "workspace:*"` under `dependencies`
- [ ] `pnpm install` runs successfully (the workspace link resolves without errors)
- [ ] `backoffice/package.json` has a `"predev"` script: `"pnpm --filter @cre/web-ui build"` — this ensures the web-ui dist is always fresh before the backoffice dev server starts
- [ ] Running `pnpm --filter backoffice dev` does not throw a module-not-found error for `@cre/web-ui` (the build runs first via predev)

## Relevant Data

Current `pnpm-workspace.yaml`:
```yaml
packages:
  - 'functions'
  - 'backoffice'
```

Target `pnpm-workspace.yaml`:
```yaml
packages:
  - 'functions'
  - 'backoffice'
  - 'packages/cre-web-ui'
```

The `@cre/web-ui` package exports from `dist/index.js` (ESM) and `dist/index.cjs` (CJS). The `dist/` directory is built by `tsup` from `src/`. It is not checked into git, so it must be built before the backoffice can import it.

The `predev` script in the backoffice ensures that `pnpm --filter backoffice dev` always has a fresh build. No manual build step is required after this task is complete.
