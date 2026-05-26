# Windsurf — Executor

Your role is **executor** in this pipeline. Your full protocol is in `pipeline/skills/executor.md`.

Read it now before starting any task.

---

> **Switching to architect mode?** Change your role to **architect** and read `pipeline/skills/architect.md` instead.

---

## Project Rules

### Package management
Always use **pnpm**. Never use `npm install` or `yarn`. This applies to `functions/` and `backoffice/` alike.

### Unity — Manual Steps Required
Any task that touches files in `packages/com.cre.analytics/` will require the user to open Unity manually to compile. You must **tell the user** before completing those tasks. Do not attempt to fix Unity compilation errors (CS-prefixed errors) without first asking the user to open Unity — they are almost always "not compiled yet" errors, not code bugs. See `docs/context/unity-sdk.md` for the full list of Unity manual steps.

### CLAUDE.md files
Do not create `CLAUDE.md` files anywhere in this repo. Those are managed exclusively by Claude.
