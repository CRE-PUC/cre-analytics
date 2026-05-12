---
id: TASK-029
title: Guard EndSession against uninitialized session to prevent KeyNotFoundException crash
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

When `AnalyticsSession.Initialize()` fails (e.g., schema is null), it sets `IsActive = false` and returns early — leaving `_values` as an empty dictionary. However, `AnalyticsManager.EndSession()` does not check `IsActive` before calling `Complete()` and `BuildPayload()`.

`Complete()` accesses `_values["Session/EndedAt"]` directly, which throws `KeyNotFoundException` on an empty dictionary. The full crash log:

```
KeyNotFoundException: The given key 'Session/StartedAt' was not present in the dictionary.
CRE.Analytics.AnalyticsSession.BuildPayload()
CRE.Analytics.AnalyticsManager.EndSession()
```

The fix is in `AnalyticsManager.EndSession()`: check `_currentSession.IsActive` after null check, warn, and return without attempting to complete or send.

This is a defensive fix. The primary cause (schema not loading) is addressed in TASK-028. This guard ensures that if initialization fails for any reason in a deployed build, the SDK degrades gracefully instead of crashing.

## Acceptance Criteria

- [ ] `AnalyticsManager.EndSession()` checks `_currentSession.IsActive` before calling `Complete()` or `BuildPayload()`
- [ ] If session is not active, a `LogWarning` is emitted and the method returns without throwing
- [ ] `_currentSession` is set to null after the early return so a new session can start
- [ ] No other changes to `AnalyticsSession.cs` — the guard belongs in the manager, not the session

## Relevant Data

**`packages/com.cre.analytics/Runtime/AnalyticsManager.cs` — `EndSession()` (current):**
```csharp
internal void EndSession()
{
    if (_currentSession == null)
    {
        Debug.LogWarning("[CRE Analytics] EndSession called with no active session — ignored.");
        return;
    }

    _currentSession.Complete();
    SessionPayload payload = _currentSession.BuildPayload();
    GetComponent<SessionSender>().Send(payload, Config.baseUrl);
    _currentSession = null;
}
```

**Target:**
```csharp
internal void EndSession()
{
    if (_currentSession == null)
    {
        Debug.LogWarning("[CRE Analytics] EndSession called with no active session — ignored.");
        return;
    }

    if (!_currentSession.IsActive)
    {
        Debug.LogWarning("[CRE Analytics] EndSession called but session failed to initialize — ignoring.");
        _currentSession = null;
        return;
    }

    _currentSession.Complete();
    SessionPayload payload = _currentSession.BuildPayload();
    GetComponent<SessionSender>().Send(payload, Config.baseUrl);
    _currentSession = null;
}
```

File to change:
- `packages/com.cre.analytics/Runtime/AnalyticsManager.cs`
