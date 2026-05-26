---
id: TASK-004
title: Fire OnValueSet from Increment() for overlay support
status: completed
model: cheap
model-name: SWE-1.6
context:
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

The recording overlay (`RecorderOverlay.cs`) subscribes to `internal static event Action<string, object> OnValueSet` (fired in `AnalyticsManager` on every valid `Set()` call) to display fading text entries in the recording. `Increment()` (added in TASK-002) must also fire this event so increments appear in the overlay.

**File to change:** `packages/com.cre.analytics/Runtime/AnalyticsManager.cs` (or wherever `OnValueSet` is fired — check the `Set()` flow).

After calling `CurrentSession.Increment()`, fire `OnValueSet` with the column name and the **new accumulated value** (not the `amount` argument). This matches what the overlay expects: the current field value, not a delta.

Pseudocode:
```csharp
public void Increment(string columnName, int amount = 1)
{
    CurrentSession?.Increment(columnName, amount);
    var newValue = CurrentSession?.GetValue(columnName); // read back after increment
    if (newValue != null)
        OnValueSet?.Invoke(columnName, newValue);
}
```

If `AnalyticsSession` doesn't have a `GetValue()` method, add a minimal one:
```csharp
public object GetValue(string columnName)
    => _data.TryGetValue(columnName, out var v) ? v : null;
```

The overlay text format is `{leafName}: {value}` — no changes to `RecorderOverlay.cs` are needed; it already handles numeric values.

## Acceptance Criteria

- [ ] When `CREAnalytics.Increment()` is called and recording + overlay is enabled, a fading overlay entry appears showing the new accumulated value
- [ ] `OnValueSet` is not fired if the `Increment` call was discarded (unknown column, non-numeric, Session/ prefix)
- [ ] `Set()` overlay behavior is unchanged

## Relevant Data

**Files:**
- `packages/com.cre.analytics/Runtime/AnalyticsManager.cs` — fires `OnValueSet` after `Set()` calls
- `packages/com.cre.analytics/Runtime/RecorderOverlay.cs` — subscribes to `OnValueSet`, renders overlay text
- `packages/com.cre.analytics/Runtime/AnalyticsSession.cs` — session state dictionary (may need `GetValue`)

> **Manual Step Required:** After `.cs` changes, open Unity and let it compile.
