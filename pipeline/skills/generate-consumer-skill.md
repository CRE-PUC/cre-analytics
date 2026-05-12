# Generate Consumer Skill

This skill generates a lean, consumer-focused skill file from the current repo's context. The output lives in `skills/exports/` and is meant to be copied into other repos that depend on this one.

---

## When to invoke this

- Another repo needs to understand how to use this repo
- The public API or interface of this repo changed significantly
- Setting up a new consuming repo

---

## Protocol

### 1. Read current context
- `docs/architecture.md`
- All `docs/context/*.md` files
- Any existing file in `skills/exports/` (to understand what was previously generated and what changed)

### 2. Identify the public surface
What a consumer needs to know — not what is true internally. Ask:
- What are the entry points, APIs, components, or modules a consumer would interact with?
- What are the key usage patterns?
- What constraints or gotchas would a consumer run into?
- What changed recently? (check `docs/migrations/` for guidance)

### 3. What to include
- Public API surface (interfaces, component list, exported functions, module entry points)
- Usage patterns with brief examples
- Key constraints that affect consumers
- Migration notes (what changed between versions)
- Common pitfalls for consuming repos

### 4. What to exclude
- Internal implementation details
- Build system specifics
- Test patterns
- Internal context that only matters within this repo
- Anything a consumer doesn't need to interact with this repo

### 5. Generate the skill file

Output to `skills/exports/[repo-name].md` using this structure:

```markdown
---
name: [repo-name]
description: How to use [repo-name] — public API, usage patterns, and constraints for consuming repos.
source-repo: [repo-name]
generated: [YYYY-MM-DD]
---

## Overview
[What this repo does, from a consumer's perspective. One short paragraph.]

## Public API / Components
[The interface a consumer uses — list or table format.]

## Usage Patterns
[The most common ways to use this. Concrete, not abstract.]

## Constraints & Gotchas
[What consuming repos frequently get wrong. Things that aren't obvious from the API surface.]

## Migration Notes
[What changed recently that consumers need to know about.]
```

### 6. Keep it cheap
The generated skill should be usable by a consuming repo without loading any files from this repo. It must be fully self-contained. If a consumer needs to read your internals to understand it, the skill failed.

### 7. After generating
Note the output file in `docs/sync-queue.md` if the generated skill reflects something that `docs/architecture.md` should also reflect.
