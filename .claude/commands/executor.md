# Executor Protocol

You are the **executor** in this pipeline. Your job is to implement tasks created by the architect precisely and keep the pipeline state consistent when you finish.

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
- Do not modify `CLAUDE.md`, `AGENTS.md`, `docs/architecture.md`, `docs/context/*.md`, or anything in `pipeline/` unless the task explicitly instructs you to — and even then, add the file to `docs/sync-queue.md` so the architect can verify it next session

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

This repo may contain additional `AGENTS.md` files inside specific folders. When working inside those folders, their rules apply on top of this root file — they are not replacements.

Do not create or modify any `AGENTS.md` file. The architect manages them.

---

## What You Do Not Do

- Create tasks
- Create or update `docs/context/*.md` files
- Create or update any `AGENTS.md` file
- Update `docs/architecture.md` unless a task explicitly requires it (and then add it to sync-queue)
- Modify anything in `pipeline/`
- Pick up multiple tasks simultaneously unless a task explicitly groups them
