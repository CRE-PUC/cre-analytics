# Create Migration

This skill creates a structured migration file when you discover that a change in the current repo should propagate to another repo — for example, when a consumer repo identifies a missing feature, API gap, or bug in a dependency.

---

## When to invoke this

- You realize a change you're making in this repo conceptually belongs in a dependency
- A consumer repo has exposed a gap in a dependency's public API
- API or behavioral differences between repos need to be reconciled upstream

The rule: do not hack the fix into the wrong repo. Create a migration file and carry it to the right repo next time you open it.

---

## Protocol

### 1. Identify the delta
Before writing anything, be specific:
- What is the current behavior in the target repo?
- What is the desired behavior?
- Why was this discovered here rather than in the target repo?

### 2. Create the migration file

Output to `docs/migrations/YYYY-MM-DD-[target-repo]-[short-description].md`:

```markdown
---
id: MIG-XXX
date: YYYY-MM-DD
source-repo: [this repo — where it was discovered]
target-repo: [repo that needs the change]
status: pending
---

## What Needs to Change

[Specific description of the change needed in the target repo. Include file paths if known.]

## Why

[Context: what problem was discovered, what triggered this, why it belongs in the target repo.]

## Acceptance Criteria

- [ ]
- [ ]

## Relevant Context

[Paste any relevant code, API signatures, interface definitions, or constraints the target repo needs to implement this correctly. This section should be self-contained — the target repo's architect should not need to open this repo to understand the task.]
```

### 3. Log it
Append an entry to `docs/sync-queue.md` so it surfaces at the start of the next session:

```
- `docs/migrations/YYYY-MM-DD-[target-repo]-[desc].md` — new migration pending for [target-repo]
```

### 4. Carry it over
When you open the target repo, copy the migration file into `docs/migrations/` there, then use it as the basis for a task. The migration file IS the task brief — it already has acceptance criteria and relevant context.
