---
id: TASK-002
title: Add Increment() to AnalyticsSession and CREAnalytics public API
status: completed
model: medium
model-name: GPT-5.2
context:
  - docs/context/unity-sdk.md
  - docs/context/session-data-format.md
doc-impact: []
---

## Description

Add `Increment(string columnName, int amount = 1)` to the session layer and expose it on the public static API. This allows consumers to accumulate values on Counter-typed fields across the session without reading back the current value themselves.

**Files to change:**
- `packages/com.cre.analytics/Runtime/AnalyticsSession.cs` — add `Increment()` method
- `packages/com.cre.analytics/Runtime/CREAnalytics.cs` — expose `public static void Increment()`
- `packages/com.cre.analytics/Runtime/AnalyticsManager.cs` — wire the delegation

### `AnalyticsSession.cs`

Add alongside the existing `SetValue()` method:

```csharp
public void Increment(string columnName, int amount = 1)
{
    if (!_data.ContainsKey(columnName))
    {
        Debug.LogWarning($"[CRE Analytics] Increment called on unknown column '{columnName}'. Call discarded.");
        return;
    }
    if (_data[columnName] is int currentInt)
        _data[columnName] = currentInt + amount;
    else if (_data[columnName] is float currentFloat)
        _data[columnName] = (int)currentFloat + amount;
    else
        Debug.LogWarning($"[CRE Analytics] Increment called on non-numeric column '{columnName}'. Call discarded.");
}
```

- `_data` is the internal dictionary that `SetValue` writes to and `BuildPayload` reads from.
- Do not fire `OnValueSet` in this method — that event is for the overlay (handled separately in TASK-004).
- The `Session/` namespace guard already blocks writes via `SetValue`; apply the same guard here: discard with a warning if `columnName` starts with `"Session/"` (case-insensitive).

### `CREAnalytics.cs`

```csharp
public static void Increment(string columnName, int amount = 1)
    => AnalyticsManager.Instance?.CurrentSession?.Increment(columnName, amount);
```

### `AnalyticsManager.cs`

If `AnalyticsManager` wraps session calls rather than delegating directly, add the corresponding passthrough. Follow the same pattern as the existing `Set()` delegation.

## Acceptance Criteria

- [x] `CREAnalytics.Increment("Tutorial/Clicks/Button A")` accumulates correctly across multiple calls within one session
- [x] Calling `Increment` on a `Session/`-prefixed column discards with a warning (same guard as `Set`)
- [x] Calling `Increment` on an unknown column discards with a warning
- [x] Calling `Increment` on a non-numeric column discards with a warning
- [x] `EndSession()` submits the final accumulated value as a plain number — no payload format changes
- [x] Calling `Increment` before `StartSession()` is a no-op (Instance is null or CurrentSession is null)

## Relevant Data

The session pre-populates all schema fields to their zero value at `StartSession()`. Counter fields pre-populate to `0` (same as Number). The `Increment()` method reads the current value and adds `amount` — the SDK owns this state, consumers never need to read it back. The submitted payload is unchanged: `{ "columnName": "Tutorial/Clicks/Button A", "value": 5 }`.

> **Manual Step Required:** After `.cs` changes, open Unity and let it compile before testing.
