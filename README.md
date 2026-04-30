# Claude → Windsurf Pipeline

A reference repo that enforces a structured AI collaboration pipeline between **Claude** (architect) and **Windsurf** (executor). Clone this as a base for any new project to get the pipeline wired up from day one.

---

## How it works

```
Claude session
  ├── 1. Sync docs from completed tasks (reads sync-queue.md)
  ├── 2. Orient using architecture.md + context files
  └── 3. Create tasks in tasks/

Windsurf session
  ├── 1. Pick up a pending task
  ├── 2. Load only the context listed in the task
  ├── 3. Implement to acceptance criteria
  └── 4. Mark done → write to sync-queue.md → move to tasks/done/

Repeat
```

No expensive post-execution reviews. Doc freshness is maintained through a lightweight sync queue that Claude processes at the start of each session.

---

## Roles

| | Claude | Windsurf |
|---|---|---|
| **Role** | Architect & context maintainer | Executor |
| **Creates tasks** | ✅ | ❌ |
| **Executes tasks** | ❌ | ✅ |
| **Updates architecture/context docs** | ✅ | ❌ (flags via sync-queue) |
| **Writes to sync-queue** | ❌ (clears it) | ✅ (appends to it) |

---

## Model Tiers

Claude selects the cheapest model that can handle the task. Tasks are broken down to avoid escalating unnecessarily.

| Tier | Model | Used for |
|------|-------|----------|
| cheap | SWE-1.6 | Mechanical, well-defined work — boilerplate, simple fixes, CRUD |
| medium | GPT-5.2 | Feature implementation, refactoring, moderate ambiguity |
| strong | claude-sonnet-4-5 / claude-opus-4-6 | Complex architecture, security-sensitive, deep reasoning |

---

## Repo Structure

```
CLAUDE.md                  # Claude's role, session protocol, task creation rules
AGENTS.md                  # Windsurf's execution protocol
docs/
  architecture.md          # System architecture (keep current)
  sync-queue.md            # Pending doc updates for Claude to process
  context/                 # Domain-specific context files (Claude-managed)
tasks/
  _template.md             # Task template
  TASK-XXX.md              # Pending tasks
  done/                    # Completed tasks
```

---

## Using this as a base

1. Clone or copy this repo into your new project
2. Have Claude read the repo and fill out `docs/architecture.md`
3. Let Claude create initial context files for any complex domains
4. Start creating tasks — Claude architects, Windsurf executes

Read [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md) for the full protocol.
