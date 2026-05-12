---
id: TASK-024
title: Session lifecycle — StartSession, Set, EndSession, pre-population, schema-gating
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
  - docs/context/session-data-format.md
doc-impact: []
---

## Description

Implement the full session lifecycle. This replaces the stubs left by TASK-023 and completes the TODO in the existing `AnalyticsSession.cs`.

Core behaviors:
- `StartSession()` pre-populates all schema fields + Session/ system fields to zero values
- `Set()` is schema-gated — writes to unknown fields are discarded with a warning
- `EndSession()` auto-finalizes system fields and builds the submission payload
- The payload is passed to `SessionSender` for HTTP dispatch

**Depends on TASK-023** — `AnalyticsManager` and `CREAnalytics` must exist.

## Files to Modify

- `packages/com.cre.analytics/Runtime/AnalyticsSession.cs` — full implementation (replace current stub)
- `packages/com.cre.analytics/Runtime/AnalyticsManager.cs` — replace the stub methods from TASK-023 with real logic; add `SessionSender` component

## Acceptance Criteria

### AnalyticsSession

- [ ] Constructor: `public AnalyticsSession(AnalyticsSchema schema, string projectId, string schemaVersion, string projectKey)`
- [ ] Constructor calls `Initialize()` immediately
- [ ] `Initialize()` pre-populates `_values` (a `Dictionary<string, object>`) with every field in `schema.fields` at its zero value: `Int` → `0`, `Float` → `0f`, `Bool` → `false`, `String` → `""`, `Timestamp` → `null`
- [ ] `Initialize()` also pre-populates the five Session/ system fields (see list below) — these are added to `_values` like regular fields so `Set()` sees them as valid keys
- [ ] `Initialize()` records `_startedAt = DateTime.UtcNow` and generates `SessionId = Guid.NewGuid().ToString()`
- [ ] `Initialize()` immediately sets `_values["Session/StartedAt"]` = `_startedAt.ToString("o")`, `_values["Session/Platform"]` = `Application.platform.ToString()`, `_values["Session/DeviceModel"]` = `SystemInfo.deviceModel`
- [ ] `public void Set(string columnName, object value)`:
  - If `_values.ContainsKey(columnName)` is false: `Debug.LogWarning($"[CRE Analytics] Field '{columnName}' not in schema — discarded. Did you rebake?")` and return
  - If `columnName` starts with `"Session/"` (case-insensitive): `Debug.LogWarning("[CRE Analytics] Session/ fields are managed by the SDK and cannot be set manually.")` and return
  - Otherwise: `_values[columnName] = value`
- [ ] `public void Finalize()` sets `_values["Session/EndedAt"]` = `DateTime.UtcNow.ToString("o")` and computes `_values["Session/Duration"]` = `(float)(DateTime.UtcNow - _startedAt).TotalSeconds`; sets `IsActive = false`
- [ ] `public SessionPayload BuildPayload()` builds and returns a `SessionPayload` (see shape below)
- [ ] `public string SessionId { get; private set; }`
- [ ] `public bool IsActive { get; private set; }` — true after Initialize, false after Finalize

### SessionPayload types (define in AnalyticsSession.cs or a sibling file)

```csharp
public class SessionPayload
{
    public string projectKey;
    public SessionData sessionData;
}

public class SessionData
{
    public SessionMetaData metaData;
    public List<SessionField> data;
}

public class SessionMetaData
{
    public string projectId;
    public string schemaVersion;
    public string sessionId;
    public string platform;
    public string startedAt;
    public string endedAt;
}

public class SessionField
{
    public string columnName;
    public object value;
}
```

`BuildPayload()` populates `metaData` from the session fields (`projectId`, `schemaVersion` from constructor args; `sessionId` from `SessionId`; `platform` from `Application.platform.ToString()`; `startedAt`/`endedAt` from `_values["Session/StartedAt"]` and `_values["Session/EndedAt"]`). The `data` list contains every entry in `_values` as a `SessionField`.

### AnalyticsManager

- [ ] Replace the `StartSession()` stub: instantiate a new `AnalyticsSession` using `Config.projectId`, `Schema.schemaVersion`, `Secrets?.projectKey ?? ""`, store as `_currentSession`. If a session is already active, log `Debug.LogWarning("[CRE Analytics] StartSession called while a session is already active — replacing.")` before creating the new one
- [ ] Replace the `SetValue(string columnName, object value)` stub: if `_currentSession == null`, log `Debug.LogWarning("[CRE Analytics] Set called with no active session — ignored.")` and return; otherwise delegate to `_currentSession.Set(columnName, value)`
- [ ] Replace the `EndSession()` stub: if `_currentSession == null`, log warning and return; call `_currentSession.Finalize()`, retrieve `payload = _currentSession.BuildPayload()`, call `GetComponent<SessionSender>().Send(payload, Config.baseUrl)`, then set `_currentSession = null`
- [ ] Add `SessionSender` component in `Bootstrap()` alongside `AnalyticsManager` (or add it in `Awake()` via `gameObject.AddComponent<SessionSender>()`)

## Relevant Data

**Session/ system fields — pre-populated in Initialize(), written in Finalize():**

| Key | Pre-populated value | Finalized value |
|---|---|---|
| `Session/StartedAt` | `DateTime.UtcNow.ToString("o")` | (unchanged) |
| `Session/EndedAt` | `""` | `DateTime.UtcNow.ToString("o")` |
| `Session/Duration` | `0f` | `(float)(UtcNow - _startedAt).TotalSeconds` |
| `Session/Platform` | `Application.platform.ToString()` | (unchanged) |
| `Session/DeviceModel` | `SystemInfo.deviceModel` | (unchanged) |

`schema` may be null (if developer hasn't placed the asset in Resources yet). Guard: if `schema == null`, log an error in `Initialize()` and set `IsActive = false` without populating any fields.

`Secrets` may be null (warned in TASK-023). Pass `projectKey = ""` and let the HTTP layer fail gracefully — do not throw here.

**Manual step required:** After Windsurf completes, open Unity to compile and verify no errors.
