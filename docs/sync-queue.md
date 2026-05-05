# Sync Queue

Claude reads this file at the start of every session. If there are pending entries, Claude updates the listed files and then removes the entries before creating new tasks.

**Windsurf writes here. Claude reads and clears.**

---

## Pending Updates

<!-- Format: - `path/to/file.md` — what changed and why (from TASK-XXX) -->

- `docs/context/firebase.md` — updated to reflect Express REST API structure, southamerica-east1 region, Zod validation, and new route paths (from TASK-016)
