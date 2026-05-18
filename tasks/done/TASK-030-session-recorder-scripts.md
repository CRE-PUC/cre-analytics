---
id: TASK-030
title: Implement SessionRecorder core C# scripts
status: completed
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
doc-impact:
  - docs/context/unity-sdk.md
---

## Description

Add a camera-based session recording system to the Unity SDK. When a session starts, the recorder optionally spawns a dedicated "recorder camera" that mirrors `Camera.main`'s world transform every frame, renders to a `RenderTexture`, and saves frames as PNG images to local device storage. The recording is entirely local — it is never sent to Firebase.

Three files are modified or created:

1. **`packages/com.cre.analytics/Runtime/AnalyticsManager.cs`** — add two internal static events fired at session lifecycle points
2. **`packages/com.cre.analytics/Runtime/RecorderCameraFollower.cs`** — new internal MonoBehaviour that mirrors `Camera.main` every `LateUpdate`
3. **`packages/com.cre.analytics/Runtime/SessionRecorder.cs`** — new public MonoBehaviour that manages the full recording lifecycle

Do not create any prefab files or editor scripts — those are in TASK-031.

---

## AnalyticsManager.cs changes

Add two internal static events to `AnalyticsManager`. Fire them at the correct points in `StartSession()` and `EndSession()`.

```csharp
// New declarations (internal, same file)
internal static event Action<string> OnSessionStarted;
internal static event Action OnSessionEnded;
```

Fire `OnSessionStarted` at the end of `StartSession()`, after `_currentSession` is assigned:
```csharp
OnSessionStarted?.Invoke(_currentSession.SessionId);
```

Fire `OnSessionEnded` inside `EndSession()`, after `_currentSession.Complete()` is called and before the payload is built:
```csharp
OnSessionEnded?.Invoke();
```

The existing `EndSession()` body is:
```csharp
_currentSession.Complete();
SessionPayload payload = _currentSession.BuildPayload();
GetComponent<SessionSender>().Send(payload, Config.baseUrl);
_currentSession = null;
```

Insert `OnSessionEnded?.Invoke();` between `Complete()` and `BuildPayload()`.

---

## RecorderCameraFollower.cs

New file at `packages/com.cre.analytics/Runtime/RecorderCameraFollower.cs`.

```csharp
using UnityEngine;

namespace CRE.Analytics
{
    [RequireComponent(typeof(Camera))]
    internal class RecorderCameraFollower : MonoBehaviour
    {
        void LateUpdate()
        {
            if (Camera.main == null) return;
            transform.SetPositionAndRotation(
                Camera.main.transform.position,
                Camera.main.transform.rotation);
        }
    }
}
```

---

## SessionRecorder.cs

New file at `packages/com.cre.analytics/Runtime/SessionRecorder.cs`.

Namespace: `CRE.Analytics`  
Access: `public`  
Inherits: `MonoBehaviour`

### Fields

```csharp
[SerializeField] private bool recordOnSessionStart = true;
[SerializeField] private int captureFrameRate = 30;
[SerializeField] private UnityEngine.UI.Text sessionIdDisplay; // optional, assigned in prefab

private Camera _recorderCamera;
private RenderTexture _renderTexture;
private Coroutine _captureCoroutine;
private string _sessionId;
private int _frameIndex;
private string _recordingPath;
```

### Lifecycle

`Awake`: Subscribe to `AnalyticsManager.OnSessionStarted` and `AnalyticsManager.OnSessionEnded`.  
`OnDestroy`: Unsubscribe from both events. If currently recording, call `StopRecording()`.

```csharp
void Awake()
{
    AnalyticsManager.OnSessionStarted += HandleSessionStarted;
    AnalyticsManager.OnSessionEnded += HandleSessionEnded;
}

void OnDestroy()
{
    AnalyticsManager.OnSessionStarted -= HandleSessionStarted;
    AnalyticsManager.OnSessionEnded -= HandleSessionEnded;
    if (_captureCoroutine != null) StopRecording();
}

private void HandleSessionStarted(string sessionId)
{
    if (recordOnSessionStart) StartRecording(sessionId);
}

private void HandleSessionEnded() => StopRecording();
```

### StartRecording(string sessionId)

```
public void StartRecording(string sessionId)
```

Steps:
1. Store `sessionId` and reset `_frameIndex = 0`
2. Build `_recordingPath = Path.Combine(Application.persistentDataPath, "CRERecordings", sessionId)` and call `Directory.CreateDirectory(_recordingPath)`
3. Spawn recorder camera:
   - `var go = new GameObject("[CRE Recorder Camera]");`
   - `DontDestroyOnLoad(go);`
   - `_recorderCamera = go.AddComponent<Camera>();`
   - `go.AddComponent<RecorderCameraFollower>();`
   - Copy from `Camera.main` if non-null: `fieldOfView`, `nearClipPlane`, `farClipPlane`, `backgroundColor`, `clearFlags`
   - Set `_recorderCamera.depth = -10;` so it renders before any other camera
4. Create render texture: `_renderTexture = new RenderTexture(Screen.width, Screen.height, 24, RenderTextureFormat.ARGB32);`
5. Assign: `_recorderCamera.targetTexture = _renderTexture;`
6. If `sessionIdDisplay != null`: `sessionIdDisplay.text = $"Session: {sessionId}";`
7. Start coroutine: `_captureCoroutine = StartCoroutine(CaptureLoop());`
8. Log: `Debug.Log($"[CRE Recorder] Recording started — {_recordingPath}");`

### StopRecording()

```
public void StopRecording()
```

Guard: if `_captureCoroutine == null` return early (already stopped).

Steps:
1. `StopCoroutine(_captureCoroutine); _captureCoroutine = null;`
2. Call `WriteManifest()`
3. Destroy recorder camera: `Destroy(_recorderCamera.gameObject); _recorderCamera = null;`
4. Release render texture: `_renderTexture.Release(); Destroy(_renderTexture); _renderTexture = null;`
5. If `sessionIdDisplay != null`: `sessionIdDisplay.text = string.Empty;`
6. Log: `Debug.Log($"[CRE Recorder] Recording stopped — {_frameIndex} frames saved to {_recordingPath}");`

### CaptureLoop() coroutine

```csharp
private IEnumerator CaptureLoop()
{
    var waitForEndOfFrame = new WaitForEndOfFrame();
    float nextCapture = Time.time;

    while (true)
    {
        yield return waitForEndOfFrame;

        if (Time.time >= nextCapture)
        {
            CaptureFrame();
            nextCapture += 1f / Mathf.Max(1, captureFrameRate);
        }
    }
}
```

### CaptureFrame()

```csharp
private void CaptureFrame()
{
    var prevActive = RenderTexture.active;
    RenderTexture.active = _renderTexture;

    var tex = new Texture2D(_renderTexture.width, _renderTexture.height, TextureFormat.RGB24, false);
    tex.ReadPixels(new Rect(0, 0, _renderTexture.width, _renderTexture.height), 0, 0);
    tex.Apply();

    RenderTexture.active = prevActive;

    byte[] bytes = tex.EncodeToPNG();
    Destroy(tex);

    string path = Path.Combine(_recordingPath, $"frame_{_frameIndex:D6}.png");
    File.WriteAllBytes(path, bytes);
    _frameIndex++;
}
```

### WriteManifest()

Write a `recording_manifest.json` to `_recordingPath`:

```json
{
  "sessionId": "<_sessionId>",
  "captureFrameRate": <captureFrameRate>,
  "frameCount": <_frameIndex>,
  "savedAt": "<DateTime.UtcNow in ISO 8601>"
}
```

Use `File.WriteAllText` with a simple string — no JSON serialization library needed.

---

## Required using directives (SessionRecorder.cs)

```csharp
using System;
using System.Collections;
using System.IO;
using UnityEngine;
```

---

## asmdef note

`UnityEngine.UI` is used for the `Text` component field. The Runtime asmdef has `"overrideReferences": false` and `"autoReferenced": true` — Unity should resolve `UnityEngine.UI` automatically. If compilation fails with a missing type for `UnityEngine.UI.Text`, add `"Unity.ugui"` to the `"references"` array in `packages/com.cre.analytics/Runtime/com.cre.analytics.Runtime.asmdef`.

---

## Acceptance Criteria

- [x] `AnalyticsManager.cs` declares `internal static event Action<string> OnSessionStarted` and `internal static event Action OnSessionEnded`
- [x] `OnSessionStarted` is invoked with the new `SessionId` at the end of `StartSession()`
- [x] `OnSessionEnded` is invoked after `Complete()` and before `BuildPayload()` in `EndSession()`
- [x] `RecorderCameraFollower.cs` exists in `Runtime/`, copies `Camera.main` position and rotation every `LateUpdate`, and is marked `internal`
- [x] `SessionRecorder.cs` exists in `Runtime/`, is marked `public`
- [x] Placing `SessionRecorder` on a scene GameObject and calling `CREAnalytics.StartSession()` causes a `[CRE Recorder Camera]` GameObject to be spawned and a `CRERecordings/{sessionId}/` folder to appear in `Application.persistentDataPath`
- [x] Calling `CREAnalytics.EndSession()` stops the coroutine, destroys the recorder camera, and writes `recording_manifest.json`
- [x] No compilation errors

## Manual Step Required

After Windsurf completes this task, open Unity and let it compile. The new `.cs` files require Unity to import and compile them. Check the Console for any errors. If `UnityEngine.UI.Text` fails to resolve, add `"Unity.ugui"` to `com.cre.analytics.Runtime.asmdef` references as described above.
