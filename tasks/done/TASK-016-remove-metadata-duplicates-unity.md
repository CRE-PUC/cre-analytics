---
id: TASK-016
title: Remove duplicate fields from metaData payload (Unity)
status: completed
model: cheap
model-name: SWE-1.6
context:
  - docs/context/session-data-format.md
  - docs/context/unity-sdk.md
doc-impact:
  - docs/context/session-data-format.md
---

## Description

`SessionMetaData` currently includes `platform`, `startedAt`, and `endedAt`. These three values are also present in the `data` array as `Session/Platform`, `Session/StartedAt`, and `Session/EndedAt`. The duplication is intentional on neither side — the `Session/` data group is the authoritative source.

Remove `platform`, `startedAt`, and `endedAt` from `SessionMetaData`. After this change `metaData` contains only the three routing/schema fields: `projectId`, `schemaVersion`, `sessionId`.

The `Session/` entries in the `data` array are **not touched** — they remain the sole source of this data.

---

## Files to modify

| File | Change |
|------|--------|
| `packages/com.cre.analytics/Runtime/AnalyticsSession.cs` | Remove fields from `SessionMetaData` class and from `BuildPayload()` |
| `packages/com.cre.analytics/Runtime/SessionSender.cs` | Remove the three fields from `SerializePayload()` and from `SerializeSessionData()` (added in TASK-013 if completed, otherwise from `SerializePayload`) |

---

## AnalyticsSession.cs

### `SessionMetaData` class — remove three fields

```csharp
// Before
public class SessionMetaData
{
    public string projectId;
    public string schemaVersion;
    public string sessionId;
    public string platform;   // ← REMOVE
    public string startedAt;  // ← REMOVE
    public string endedAt;    // ← REMOVE
}

// After
public class SessionMetaData
{
    public string projectId;
    public string schemaVersion;
    public string sessionId;
}
```

### `BuildPayload()` — remove the three field assignments

```csharp
// Before
var metaData = new SessionMetaData
{
    projectId = _projectId,
    schemaVersion = _schemaVersion,
    sessionId = SessionId,
    platform = Application.platform.ToString(),   // ← REMOVE
    startedAt = _values["Session/StartedAt"] as string, // ← REMOVE
    endedAt = _values["Session/EndedAt"] as string      // ← REMOVE
};

// After
var metaData = new SessionMetaData
{
    projectId = _projectId,
    schemaVersion = _schemaVersion,
    sessionId = SessionId,
};
```

---

## SessionSender.cs

Remove the three corresponding lines from the metaData section of the JSON serializer. The exact method name depends on whether TASK-013 has been completed:
- If TASK-013 is done: remove from `SerializeSessionData()`
- If TASK-013 is not done: remove from `SerializePayload()`

Lines to remove:
```csharp
sb.Append($"\"platform\":\"{EscapeJson(payload.sessionData.metaData.platform)}\",");
sb.Append($"\"startedAt\":\"{EscapeJson(payload.sessionData.metaData.startedAt)}\",");
sb.Append($"\"endedAt\":\"{EscapeJson(payload.sessionData.metaData.endedAt)}\"");
```

After removing, the last field in the metaData JSON object will be `sessionId`. Make sure there is no trailing comma after it.

---

## Acceptance Criteria

- [ ] `SessionMetaData` class has exactly three fields: `projectId`, `schemaVersion`, `sessionId`
- [ ] `BuildPayload()` does not assign `platform`, `startedAt`, or `endedAt` on the metaData object
- [ ] The serialized JSON metaData object contains only `projectId`, `schemaVersion`, `sessionId` — no trailing comma
- [ ] `Session/Platform`, `Session/StartedAt`, `Session/EndedAt` entries in the `data` array are unchanged
- [ ] No other files are modified

## Manual Step Required

After Windsurf completes this task, open Unity and let it compile.
