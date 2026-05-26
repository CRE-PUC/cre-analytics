---
id: TASK-001
title: Add Counter field type to SessionSchema
status: completed
model: medium
model-name: GPT-5.2
context:
  - docs/context/unity-sdk.md
  - docs/context/session-data-format.md
doc-impact:
  - docs/context/unity-sdk.md
  - docs/context/session-data-format.md
---

## Description

Add `Counter` as a new value to the `AnalyticsFieldType` enum in `AnalyticsSchema.cs`. Counter fields behave like number fields at the data level (stored and submitted as a plain `number`) but signal to the SDK that the field should be incremented rather than set outright. No Firestore or backend changes are needed — the value in the session payload is still a number.

**File:** `packages/com.cre.analytics/Runtime/AnalyticsSchema.cs`

Currently the `AnalyticsFieldType` enum looks like:
```csharp
public enum AnalyticsFieldType { String, Number, Boolean }
```

Add `Counter` to it:
```csharp
public enum AnalyticsFieldType { String, Number, Boolean, Counter }
```

The `AnalyticsField` struct/class that holds `columnName`, `type`, and `description` does not need changes.

## Acceptance Criteria

- [x] `AnalyticsFieldType.Counter` exists in `AnalyticsSchema.cs`
- [x] Existing `String`, `Number`, `Boolean` values are unchanged
- [x] No other files are modified in this task (handled in subsequent tasks)

## Relevant Data

`AnalyticsSchema.cs` is a `ScriptableObject` defining the session schema. The `AnalyticsField` list in it drives both the Bake Analytics editor window and the session pre-population at runtime. The `type` field on each field is an `AnalyticsFieldType` enum. Counter fields will pre-populate to `0` exactly like Number fields — the distinction only matters at call-site (Increment vs Set).

> **Manual Step Required:** After this file changes, open Unity and let it compile before proceeding with dependent tasks.
