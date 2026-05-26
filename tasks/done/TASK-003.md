---
id: TASK-003
title: Update code generator and Bake Analytics window to support Counter type
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/context/unity-sdk.md
doc-impact:
  - docs/context/unity-sdk.md
---

## Description

Two editor-side changes are needed for the Counter type:

1. **`BakeAnalyticsWindow.cs`** — show `Counter` as a selectable type in the schema editor field UI (alongside String, Number, Boolean). No other behavioral change needed in the window — the bake action already iterates fields generically.

2. **`AnalyticsCodeGenerator.cs`** — for `Counter`-typed fields, emit an `IncrementX()` method instead of (or in addition to) `SetX()` in the generated `Analytics.cs` file.

### Code generator output for a Counter field

Given a Counter field named `Tutorial/Clicks/Button A`, the generated accessor class currently emits:
```csharp
// (currently — Number field)
public static void SetButtonA(float value) => CREAnalytics.Set("Tutorial/Clicks/Button A", value);
```

For a Counter field, emit instead:
```csharp
public static void IncrementButtonA(int amount = 1) => CREAnalytics.Increment("Tutorial/Clicks/Button A", amount);
```

Do not emit `SetButtonA` for Counter fields — the compile-time type should prevent consumers from accidentally overwriting counters.

### Name mangling rules (same as existing Set generation)

- Strip the group path prefix, use only the leaf name.
- PascalCase the leaf name (strip spaces and special characters, capitalize each word).
- Prefix with `Increment` instead of `Set`.

### Bake window type selector

The field type dropdown/enum popup in `BakeAnalyticsWindow.cs` must include `Counter`. Follow the same pattern as how `String`, `Number`, and `Boolean` are currently rendered. No special validation needed beyond what already exists.

## Acceptance Criteria

- [ ] `BakeAnalyticsWindow` shows `Counter` as a type option for schema fields
- [ ] After baking a schema with a Counter field, the generated `Analytics.cs` contains `IncrementX()` (not `SetX()`) for that field
- [ ] The generated `IncrementX()` method delegates to `CREAnalytics.Increment()`
- [ ] Non-Counter fields are unaffected — their `SetX()` methods are unchanged
- [ ] Baking a schema with mixed Counter and non-Counter fields produces both `SetX()` and `IncrementX()` methods in the correct nested class

## Relevant Data

**Files:**
- `packages/com.cre.analytics/Editor/BakeAnalyticsWindow.cs`
- `packages/com.cre.analytics/Editor/AnalyticsCodeGenerator.cs`

Generated output lives in the **consumer project's** `Assets/CREAnalytics/Generated/Analytics.cs` — not inside the package. The generator writes this file when "Bake Analytics" is clicked; the consumer commits it to their version control.

The generated class structure (example):
```csharp
public static class Analytics
{
    public static class Tutorial
    {
        public static class Clicks
        {
            // Counter field:
            public static void IncrementButtonA(int amount = 1)
                => CREAnalytics.Increment("Tutorial/Clicks/Button A", amount);
        }
    }
}
```

> **Manual Step Required:** After `.cs` changes, open Unity and let it compile. Then open the Bake Analytics window to verify Counter appears as a type option.
