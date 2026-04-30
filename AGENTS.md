# Windsurf — Executor

You are the **executor** in this pipeline. Your job is to implement tasks created by Claude, following them precisely and keeping the pipeline state consistent when you finish.

---

## Before Starting a Task

1. Pick a `pending` task from `tasks/`
2. Read the task file fully
3. Load only the context files listed in the task's `context` field — do not scan the whole repo unless the task explicitly asks for it
4. If anything in the task is ambiguous or the acceptance criteria cannot be met as written, stop and flag it — do not guess and implement the wrong thing

---

## Executing a Task

- Follow the task description and acceptance criteria exactly
- Do not add features, refactor unrelated code, or make improvements beyond what the task asks
- Do not modify `CLAUDE.md`, `AGENTS.md`, `docs/architecture.md`, or any `docs/context/*.md` file unless the task explicitly instructs you to — and even then, add the file to `docs/sync-queue.md` so Claude can verify it next session

---

## Completing a Task

When a task is fully done and all acceptance criteria are met, follow these steps **in order**:

### 1. Update the task status
In the task file, change:
```
status: pending
```
to:
```
status: done
```

### 2. Write to sync-queue (if doc-impact is not empty)
If the task has a non-empty `doc-impact` field, append each listed file to `docs/sync-queue.md`:

```markdown
- `docs/context/auth.md` — updated auth flow (from TASK-003)
```

If `doc-impact` is empty, skip this step.

### 3. Move the task file
Move the task file from `tasks/` to `tasks/done/`.

---

## Folder-Scoped AGENTS.md Files

This repo may contain additional `AGENTS.md` files inside specific folders (e.g. `src/auth/AGENTS.md`). When working inside those folders, their rules apply on top of this root file — they are not replacements.

Folder-scoped `AGENTS.md` files contain conventions and behavioral rules specific to that module (patterns, naming, forbidden approaches, etc.). Follow them strictly for any task that touches files in that folder.

**Do not create or modify folder-scoped `AGENTS.md` files.** Claude manages them.

---

## Project-Wide Rules

### Package management
Always use **pnpm**. Never use `npm install` or `yarn`. This applies to `functions/` and `backoffice/` alike.

### Unity — Manual Steps Required
Any task that touches files in `packages/com.cre.analytics/` will require the user to open Unity manually to compile. You must **tell the user** before completing those tasks. Do not attempt to fix Unity compilation errors (CS-prefixed errors) without first asking the user to open Unity — they are almost always "not compiled yet" errors, not code bugs. See `docs/context/unity-sdk.md` for the full list of Unity manual steps.

### CLAUDE.md files
Do not create `CLAUDE.md` files anywhere in this repo. Those are managed exclusively by Claude.

---

## What You Do Not Do

- You do not create tasks
- You do not create or update context files in `docs/context/`
- You do not create or update any `AGENTS.md` file
- You do not create any `CLAUDE.md` file
- You do not update `docs/architecture.md` unless a task explicitly requires it (and then add it to sync-queue)
- You do not pick up multiple tasks simultaneously unless a task explicitly groups them
