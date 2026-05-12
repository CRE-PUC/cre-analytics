# Bootstrap

This skill sets up a new repo with the pipeline, or migrates an existing repo that has a monolithic CLAUDE.md/AGENTS.md into the skills-based structure.

---

## How the pipeline files relate to each other

Before executing, understand the three-layer structure so you create the right thing:

```
CLAUDE.md / AGENTS.md          ← thin stubs, auto-loaded by the tool, never grow
      │
      └── references pipeline/skills/*.md   ← full protocol content, edit here to update
                                                (this is the single source of truth)

.claude/commands/*.md          ← one-liner slash commands for Claude Code
.windsurf/skills/*/SKILL.md    ← Windsurf skill wrappers (frontmatter + one-liner)
      │
      └── both reference pipeline/skills/*.md as well
```

**Critical**: `.claude/commands/` and `.windsurf/skills/` are thin wrappers that point at `pipeline/skills/`. They do NOT contain the full protocol. Only `pipeline/skills/` contains the full content. When you update the protocol, you edit `pipeline/skills/` only.

---

## Mode 1 — New repo

### Step 1: Detect tools
Ask the user which AI tools they will use in this repo:
- Claude Code
- Windsurf
- Cursor
- Other (ask which)

They may use multiple. Generate files for all selected tools.

### Step 2: Create folder structure

Create these directories:
```
pipeline/skills/
docs/context/
docs/migrations/
tasks/done/
skills/exports/
```

Copy the entire `pipeline/skills/` directory from the pipeline template repo into this repo. These files are the full protocol content — copy them as-is, preserving all content.

Copy `tasks/_template.md` from the pipeline template repo into `tasks/_template.md`.

Create empty files to track the new folders:
- `docs/sync-queue.md` — see exact content below
- `docs/architecture.md` — see Step 4

### Step 3: Create bootstrap and tool files

**Always create — `CLAUDE.md`:**
```
# Claude — Architect

Your role is **architect** in this pipeline. Your full protocol is in `pipeline/skills/architect.md`.

Read it now before starting any session.
```

**If user selected Windsurf — `AGENTS.md`:**
```
# Windsurf — Executor

Your role is **executor** in this pipeline. Your full protocol is in `pipeline/skills/executor.md`.

Read it now before starting any task.

---

> **Switching to architect mode?** Change your role to **architect** and read `pipeline/skills/architect.md` instead.
```

**If user selected Claude Code — create `.claude/commands/` with these exact files:**

`.claude/commands/bootstrap.md`:
```
Read `pipeline/skills/bootstrap.md` for the full protocol, then execute it now. Ask whether this is a new repo setup or a migration of an existing repo.
```

`.claude/commands/generate-consumer-skill.md`:
```
Read `pipeline/skills/generate-consumer-skill.md` for the full protocol, then execute it now against this repo.
```

`.claude/commands/create-migration.md`:
```
Read `pipeline/skills/create-migration.md` for the full protocol, then execute it now to create a migration file for the change we discussed.
```

**If user selected Windsurf — create `.windsurf/skills/` with these exact files:**

`.windsurf/skills/architect/SKILL.md`:
```
---
name: architect
description: Architect protocol for this pipeline. Load when acting as the architect — session start, doc sync, task creation, context management, and skills maintenance.
---

Read `pipeline/skills/architect.md` for the full protocol. Load it now before doing anything else.
```

`.windsurf/skills/executor/SKILL.md`:
```
---
name: executor
description: Executor protocol for this pipeline. Defines how to pick up, execute, and complete tasks created by the architect.
---

Read `pipeline/skills/executor.md` for the full protocol. Load it now before picking up any task.
```

`.windsurf/skills/generate-consumer-skill/SKILL.md`:
```
---
name: generate-consumer-skill
description: Generates a lean, self-contained skill file for consuming repos. Invoke when another repo needs to understand this repo's public API, usage patterns, or constraints.
---

Read `pipeline/skills/generate-consumer-skill.md` for the full protocol, then execute it against this repo.
```

`.windsurf/skills/create-migration/SKILL.md`:
```
---
name: create-migration
description: Creates a structured migration file when a change in this repo needs to propagate to another repo.
---

Read `pipeline/skills/create-migration.md` for the full protocol, then execute it for the change we just discussed.
```

`.windsurf/skills/bootstrap/SKILL.md`:
```
---
name: bootstrap
description: Sets up a new repo with this pipeline, or migrates an existing repo from a monolithic CLAUDE.md/AGENTS.md into the skills-based structure.
---

Read `pipeline/skills/bootstrap.md` for the full protocol, then execute it. Ask whether this is a new repo setup or a migration of an existing repo.
```

**If user selected Cursor — `.cursorrules`:**
```
You are the executor in this pipeline. Your full protocol is in pipeline/skills/executor.md. Read it before starting any task.
```

**If user selected other tool**: Create `PIPELINE.md` at root, copy the full content of `pipeline/skills/executor.md` into it, and instruct the user to point their tool at that file.

### Step 4: Initialize docs/sync-queue.md

Create `docs/sync-queue.md` with this content:
```
# Sync Queue

The architect reads this file at the start of every session. If there are pending entries, update the listed files and remove the entries before creating new tasks.

**Executor writes here. Architect reads and clears.**

---

## Pending Updates

<!-- Format: - `path/to/file.md` — what changed and why (from TASK-XXX) -->
```

### Step 5: Initialize docs/architecture.md

Ask the user for:
- What does this repo do? (one paragraph)
- What is the tech stack?
- Any known constraints or non-negotiables?

Populate `docs/architecture.md` with that information using the standard template sections: Overview, Tech Stack, Project Structure, Key Architectural Decisions, Modules & Domains, External Dependencies, Known Constraints.

### Step 6: Confirm

List all created files. Ask if anything needs adjustment before the first architect session.

---

## Mode 2 — Migrate existing repo

Use this when a repo already has a pipeline with a monolithic CLAUDE.md or AGENTS.md that has grown to mix pipeline protocol with project-specific content.

### Step 1: Read existing files
Read `CLAUDE.md` and `AGENTS.md` in full.

### Step 2: Separate concerns
Identify two categories of content:

**Pipeline protocol** — generic rules about how architect/executor behave (session order, task creation rules, model tiers, doc sync). Discard this from CLAUDE.md — the new pipeline/skills/ files replace it.

**Project-specific content** — architecture decisions, domain rules, module descriptions, constraints unique to this project. This must be preserved in `docs/context/` or `docs/architecture.md`.

### Step 3: Preserve project-specific content
For each project-specific topic:
- Create `docs/context/[topic].md` with the extracted content
- Move architecture-level content (tech stack, structure, decisions) into `docs/architecture.md`

### Step 4: Create pipeline structure
Follow Mode 1 Steps 2 and 3 exactly — create `pipeline/skills/`, the tool-specific wrapper files, and the docs structure.

### Step 5: Replace bootstrap files
Replace CLAUDE.md and AGENTS.md with the thin stubs from Mode 1 Step 3.

### Step 6: Verify nothing was lost
Before finishing:
- Every piece of project-specific content from the old CLAUDE.md exists in `docs/`
- CLAUDE.md and AGENTS.md are now thin stubs (under 10 lines each)
- `pipeline/skills/` contains all five protocol files with their full content
- `docs/architecture.md` and `docs/context/` contain the migrated knowledge

### Step 7: First sync
Run the normal session protocol (doc sync → orient → act) to verify the migrated docs are coherent.
