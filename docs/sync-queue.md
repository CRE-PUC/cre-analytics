# Sync Queue

Claude reads this file at the start of every session. If there are pending entries, Claude updates the listed files and then removes the entries before creating new tasks.

**Windsurf writes here. Claude reads and clears.**

---

## Pending Updates

<!-- Format: - `path/to/file.md` — what changed and why (from TASK-XXX) -->

- `docs/context/firebase.md` — added bakeSchema function documentation (from TASK-012)
- `docs/context/session-data-format.md` — updated schema storage section with bakeSchema details (from TASK-012)
- `docs/context/firebase.md` — updated submitSession with projectKey auth and schema validation (from TASK-013)
- `docs/context/session-data-format.md` — updated validation section with schema validation details (from TASK-013)
- `docs/architecture.md` — added sessions inspect page at /projects/inspect (from TASK-014)
