---
id: TASK-012
title: Save session JSON locally on every submission attempt
status: completed
model: cheap
model-name: SWE-1.6
context:
  - docs/context/unity-sdk.md
  - docs/context/session-data-format.md
doc-impact:
  - docs/context/unity-sdk.md
---

## Description

When `EndSession()` is called, the SDK builds a `SessionPayload` and passes it to `SessionSender.Send()`. Currently, `SessionSender` only attempts an HTTP POST to the Firebase backend. There is no local fallback.

We need `SessionSender` to **always save the session data to disk** at the moment of submission, regardless of whether the HTTP request succeeds. This gives consumers a local copy they can inspect or resubmit manually if the backend is unavailable.

### Save location

```
Application.persistentDataPath/CRERecordings/{sessionId}/session.json
```

This is the same root folder that `SessionRecorder` already uses for video frames. If recording was active for the session, the folder already exists. If not, `SessionSender` must create it.

### What to save

Save only the `sessionData` object (not `projectKey` — it is a secret). The JSON shape must match the Firestore document shape:

```json
{
  "metaData": {
    "projectId": "...",
    "schemaVersion": "...",
    "sessionId": "...",
    "platform": "...",
    "startedAt": "...",
    "endedAt": "..."
  },
  "data": [
    { "columnName": "...", "value": ... },
    ...
  ]
}
```

### Implementation steps

1. In `SessionSender.cs`, add a `private void SaveLocally(SessionPayload payload)` method that:
   - Computes `folderPath = Path.Combine(Application.persistentDataPath, "CRERecordings", payload.sessionData.metaData.sessionId)`
   - Calls `Directory.CreateDirectory(folderPath)` (safe to call when directory already exists)
   - Extracts a JSON string for `sessionData` only using a new `private string SerializeSessionData(SessionData data)` method
   - Writes it to `Path.Combine(folderPath, "session.json")` using `File.WriteAllText`
   - Logs: `[CRE Analytics] Session saved locally — {filePath}`

2. Extract `SerializeSessionData(SessionData data)` from the existing `SerializePayload` method by pulling out the `sessionData` subtree. `SerializePayload` should call `SerializeSessionData` internally to avoid duplication.

3. In `PostSession`, call `SaveLocally(payload)` **before** `yield return request.SendWebRequest()` so the data is on disk even if the process is killed mid-request.

4. Add `using System.IO;` at the top of the file (it is not currently imported).

## Acceptance Criteria

- [ ] `session.json` is written to `Application.persistentDataPath/CRERecordings/{sessionId}/` every time `EndSession()` is called, regardless of backend response
- [ ] The JSON contains only `sessionData` (no `projectKey`)
- [ ] The JSON shape matches the structure above (metaData + data array)
- [ ] If a `CRERecordings/{sessionId}/` folder already exists (from video recording), the file is added to it without error
- [ ] If no recording folder exists, the folder is created by `SaveLocally`
- [ ] `SaveLocally` is called before the HTTP request is sent
- [ ] A success log line is emitted: `[CRE Analytics] Session saved locally — <path>`
- [ ] No `projectKey` appears in `session.json`

## Relevant Data

### Current `SessionSender.cs` structure

File: `packages/com.cre.analytics/Runtime/SessionSender.cs`

```csharp
public void Send(SessionPayload payload, string baseUrl)
{
    StartCoroutine(PostSession(payload, baseUrl));
}

private IEnumerator PostSession(SessionPayload payload, string baseUrl)
{
    string json = SerializePayload(payload);
    // ... UnityWebRequest POST
}

private string SerializePayload(SessionPayload payload)
{
    // builds full JSON including projectKey + sessionData
}
```

### `SessionPayload` structure (from `AnalyticsSession.cs`)

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

### `SessionRecorder.cs` save path (for reference)

```csharp
_recordingPath = Path.Combine(Application.persistentDataPath, "CRERecordings", sessionId);
Directory.CreateDirectory(_recordingPath);
```

## Manual Step Required

After Windsurf completes this task, open Unity and let it compile. No new `.asmdef` files are added — recompilation only.
