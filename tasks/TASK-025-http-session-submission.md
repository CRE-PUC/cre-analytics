---
id: TASK-025
title: HTTP session submission — complete SessionSender
status: pending
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/firebase.md
  - docs/context/session-data-format.md
doc-impact: []
---

## Description

Complete `SessionSender.cs` to POST a session payload to the Firebase Functions endpoint. Called by `AnalyticsManager.EndSession()` after TASK-024 wires it up.

The sender is fire-and-forget — `AnalyticsManager` does not wait for the result.

**Depends on TASK-024** — `SessionPayload` type must exist.

## Files to Modify

- `packages/com.cre.analytics/Runtime/SessionSender.cs` — implement the full class (replace current stub)

## Acceptance Criteria

- [ ] `SessionSender` remains a `MonoBehaviour` in namespace `CRE.Analytics`
- [ ] `public void Send(SessionPayload payload, string baseUrl)` starts a coroutine via `StartCoroutine(PostSession(payload, baseUrl))`
- [ ] JSON serialization uses `System.Text.Json.JsonSerializer.Serialize(payload)` — Unity 6 (.NET 6+) includes this. The `value` field in `SessionField` (which is `object`) must serialize as its actual runtime type (int → JSON number, float → JSON number, bool → JSON boolean, string → JSON string, null → JSON null), not wrapped in quotes
- [ ] POST URL: `{baseUrl}/sessions`
- [ ] Request sets `Content-Type: application/json`
- [ ] On HTTP 2xx: `Debug.Log($"[CRE Analytics] Session {payload.sessionData.metaData.sessionId} submitted.")`
- [ ] On non-2xx: `Debug.LogError($"[CRE Analytics] Session submission failed — HTTP {request.responseCode}: {request.downloadHandler.text}")`
- [ ] On network error (`request.result == UnityWebRequest.Result.ConnectionError`): `Debug.LogError("[CRE Analytics] Session submission failed — network error.")`
- [ ] The existing `[SerializeField] private string endpointUrl` and `projectId` fields from the stub are removed — the sender receives all it needs via the `Send` method parameters

## Relevant Data

**`POST /sessions` endpoint body:**
```json
{
  "projectKey": "...",
  "sessionData": {
    "metaData": {
      "projectId": "...",
      "schemaVersion": "1.0.0",
      "sessionId": "uuid-v4",
      "platform": "...",
      "startedAt": "2025-10-15T12:00:00.000Z",
      "endedAt": "2025-10-15T12:05:00.000Z"
    },
    "data": [
      { "columnName": "Tutorial/Steps", "value": 3 },
      { "columnName": "Session/Duration", "value": 300.5 },
      { "columnName": "Session/Platform", "value": "WindowsEditor" }
    ]
  }
}
```

**UnityWebRequest POST with JSON body:**
```csharp
private IEnumerator PostSession(SessionPayload payload, string baseUrl)
{
    string json = System.Text.Json.JsonSerializer.Serialize(payload);
    byte[] bytes = System.Text.Encoding.UTF8.GetBytes(json);
    string url = $"{baseUrl.TrimEnd('/')}/sessions";

    using var request = new UnityWebRequest(url, "POST");
    request.uploadHandler = new UploadHandlerRaw(bytes);
    request.downloadHandler = new DownloadHandlerBuffer();
    request.SetRequestHeader("Content-Type", "application/json");

    yield return request.SendWebRequest();
    // check result here
}
```

**Important:** `System.Text.Json` serializes `object` fields using the actual runtime type. If a `SessionField.value` is boxed as `object` containing an `int`, it serializes as a JSON number. This is the correct behavior. No custom converters needed.

**Manual step required:** After Windsurf completes, open Unity to compile. Test the full flow: start the Firebase emulator, enter Play mode, call `CREAnalytics.StartSession()`, set a few values, call `CREAnalytics.EndSession()`, and verify the session document appears in the Firestore emulator at `projects/{projectId}/sessions/{sessionId}`.
