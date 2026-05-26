# Bootstrap

This skill sets up a new repo with the pipeline, or migrates an existing repo that has a monolithic CLAUDE.md/AGENTS.md into the skills-based structure.

---

## Mode 1 — New repo

### Step 1: Detect tools
Ask the user which AI tools they will use in this repo:
- Claude Code
- Windsurf
- Cursor
- Other (ask which)

They may use multiple. Generate bootstrap files for all selected tools.

### Step 2: Create folder structure

```
pipeline/
  skills/             ← copy all files from this repo's pipeline/skills/
docs/
  architecture.md     ← initialize from template
  sync-queue.md       ← empty
  context/
  migrations/
tasks/
  _template.md        ← copy from this repo's tasks/_template.md
  done/
skills/
  exports/
```

### Step 3: Generate bootstrap files

**Claude Code** (`CLAUDE.md`):
```markdown
# Claude — Architect

Your role is **architect** in this pipeline. Your full protocol is in `pipeline/skills/architect.md`.

Read it now before starting any session.
```

Also create `.claude/commands/` — copy each file from this repo's `.claude/commands/`.

**Windsurf** (`AGENTS.md`):
```markdown
# Windsurf — Executor

Your role is **executor** in this pipeline. Your full protocol is in `pipeline/skills/executor.md`.

Read it now before starting any task.

---

> **Switching to architect mode?** Change your role to **architect** and read `pipeline/skills/architect.md` instead.
```

Also create `.windsurf/skills/` — copy each folder from this repo's `.windsurf/skills/`.

**Cursor** (`.cursorrules`):
```
You are the executor in this pipeline. Your full protocol is in pipeline/skills/executor.md. Read it before starting any task.
```

**Other tools**: Create a `PIPELINE.md` at root containing the full executor protocol. Instruct the user to point their tool at it.

### Step 4: Initialize architecture.md
Ask the user for a brief description of the repo's purpose, tech stack, and any known constraints. Populate `docs/architecture.md` with that information.

### Step 5: Confirm
List all created files and folders. Ask if anything needs adjustment before the first session.

---

## Mode 2 — Migrate existing repo

Use this when a repo already has a working pipeline with a monolithic CLAUDE.md or AGENTS.md that has grown to include project-specific content mixed in with pipeline protocol.

### Step 1: Read existing files
Read `CLAUDE.md` and `AGENTS.md` in full.

### Step 2: Separate concerns
Identify two categories of content:

**Pipeline protocol** — generic rules about how the architect/executor behave (session order, task creation rules, model tiers, doc sync). This content belongs in `pipeline/skills/` and should be discarded from CLAUDE.md.

**Project-specific content** — architecture decisions, domain rules, module descriptions, constraints unique to this project. This content belongs in `docs/context/` or `docs/architecture.md`.

### Step 3: Migrate project-specific content
For each project-specific topic found:
- Create a `docs/context/[topic].md` file with the extracted content
- Move architecture-level content (tech stack, project structure, key decisions) into `docs/architecture.md`

### Step 4: Create pipeline structure
- Copy `pipeline/skills/` files from this pipeline repo
- Create `.claude/commands/`, `.windsurf/skills/`, or other tool dirs as needed (same as Mode 1, Step 3)

### Step 5: Replace bootstrap files
Replace `CLAUDE.md` and `AGENTS.md` with the thin stubs from Mode 1, Step 3.

### Step 6: Verify nothing was lost
Before finishing:
- Every piece of project-specific content from the old CLAUDE.md is preserved in `docs/`
- CLAUDE.md and AGENTS.md are now thin stubs
- `pipeline/skills/` is fully populated
- `docs/architecture.md` and `docs/context/` contain the migrated knowledge

### Step 7: First sync
Run the normal session protocol (Step 1 of architect.md) to verify the migrated docs are coherent and up to date.
