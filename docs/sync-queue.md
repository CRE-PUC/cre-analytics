# Sync Queue

Claude reads this file at the start of every session. If there are pending entries, Claude updates the listed files and then removes the entries before creating new tasks.

**Windsurf writes here. Claude reads and clears.**

---

## Pending Updates

<!-- Format: - `path/to/file.md` — what changed and why (from TASK-XXX) -->
- `docs/context/unity-sdk.md` — added AnalyticsConfig, AnalyticsSecrets ScriptableObjects and Project Settings panel (from TASK-020)
- `docs/context/unity-sdk.md` — implemented Bake Analytics action with validation, version bump, code generation, and Firebase schema sync (from TASK-022)
