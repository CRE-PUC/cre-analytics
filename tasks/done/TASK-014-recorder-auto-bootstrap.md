---
id: TASK-014
title: Auto-bootstrap SessionRecorder from AnalyticsConfig; remove prefab
status: completed
model: medium
model-name: GPT-5.2
context:
  - docs/context/unity-sdk.md
doc-impact:
  - docs/context/unity-sdk.md
depends-on: TASK-013
---

## Description

Currently `SessionRecorder` is a MonoBehaviour placed in a scene via a prefab (`CRESessionRecorder.prefab`). This means:
- Recording only works in scenes where the prefab is placed
- Scene transitions destroy the component, stopping the recording mid-session
- Configuration is per-prefab-instance rather than per-project

Replace this with auto-bootstrap: `AnalyticsManager` conditionally adds `SessionRecorder` to its own `DontDestroyOnLoad` GameObject at startup, driven by new fields on `AnalyticsConfig`. Recording configuration moves entirely to `AnalyticsConfig` and is edited in **Edit > Project Settings > CRE Analytics**. No scene setup required.

The prefab, the prefab creator editor script, and the menu item are all removed.

---

## Files to modify

| File | Action |
|------|--------|
| `packages/com.cre.analytics/Runtime/AnalyticsConfig.cs` | Add recording config fields |
| `packages/com.cre.analytics/Runtime/SessionRecorder.cs` | Remove serialized fields; read from config |
| `packages/com.cre.analytics/Runtime/AnalyticsManager.cs` | Auto-add SessionRecorder on Awake |
| `packages/com.cre.analytics/Editor/AnalyticsSettingsProvider.cs` | Add recording section to Project Settings UI |
| `packages/com.cre.analytics/Editor/RecorderPrefabCreator.cs` | **Delete** |
| `packages/com.cre.analytics/Runtime/Prefabs/CRESessionRecorder.prefab` | **Delete** |
| `packages/com.cre.analytics/Runtime/Prefabs/CRESessionRecorder.prefab.meta` | **Delete** |

---

## AnalyticsConfig.cs — new fields

Add these fields to the existing `AnalyticsConfig` ScriptableObject:

```csharp
[Header("Recording")]
public bool enableRecording = false;
public int captureFrameRate = 15;
[Range(0.1f, 1f)]
public float captureResolutionScale = 0.5f;
[Range(1, 100)]
public int captureJpegQuality = 75;
```

`enableRecording` defaults to `false` — consumers opt in explicitly.

---

## SessionRecorder.cs — remove serialized fields, read from config

Remove all `[SerializeField]` fields that were added in TASK-013 (`captureFrameRate`, `captureResolutionScale`, `captureJpegQuality`) and the `recordOnSessionStart` field. Replace them with reads from `AnalyticsManager.Instance.Config` at the point of use.

`SessionRecorder` should have no `[SerializeField]` fields after this task. It is no longer a scene-placed component and has no inspector.

Replace field reads:
```csharp
// Before (serialized fields):
captureFrameRate
captureResolutionScale
captureJpegQuality

// After (read from config):
AnalyticsManager.Instance.Config.captureFrameRate
AnalyticsManager.Instance.Config.captureResolutionScale
AnalyticsManager.Instance.Config.captureJpegQuality
```

`HandleSessionStarted` previously checked `recordOnSessionStart` — remove that guard. When `SessionRecorder` is present it always records.

---

## AnalyticsManager.cs — conditionally add SessionRecorder

In `Awake()`, after `LoadConfig()`, add:

```csharp
if (Config != null && Config.enableRecording)
{
    gameObject.AddComponent<SessionRecorder>();
}
```

`SessionRecorder` is added to the same GameObject as `AnalyticsManager`, which is already `DontDestroyOnLoad`. No separate DontDestroyOnLoad call is needed.

Current `Awake` already adds `SessionSender` the same way — follow that pattern.

---

## AnalyticsSettingsProvider.cs — recording section

After the existing secrets section, add a **Recording** section that appears only when `config != null`:

```
[ Recording ]
─────────────────────────────
Enable Recording      [ toggle ]

(if enabled, show:)
  Capture Frame Rate  [ int field ]   default 15
  Resolution Scale    [ 0.1–1.0 slider ]   default 0.5
  JPEG Quality        [ 1–100 int field ]   default 75
  
  HelpBox (Info): "Recording saves a recording.avi file to 
  Application.persistentDataPath/CRERecordings/{sessionId}/.
  Resolution scale 0.5 = half screen resolution."
```

Follow the existing `EditorGUI.BeginChangeCheck` / `EditorUtility.SetDirty` / `AssetDatabase.SaveAssets` pattern used for the existing fields.

---

## Remove the prefab and creator

Delete these files:
- `packages/com.cre.analytics/Editor/RecorderPrefabCreator.cs`
- `packages/com.cre.analytics/Editor/RecorderPrefabCreator.cs.meta`
- `packages/com.cre.analytics/Runtime/Prefabs/CRESessionRecorder.prefab`
- `packages/com.cre.analytics/Runtime/Prefabs/CRESessionRecorder.prefab.meta`

The `Prefabs/` folder may be left (it will contain only `.gitkeep` if nothing else is there) or removed if empty. The `.meta` for the folder should be removed along with the folder if it becomes empty.

---

## Acceptance Criteria

- [ ] `AnalyticsConfig` has `enableRecording`, `captureFrameRate`, `captureResolutionScale`, `captureJpegQuality` fields
- [ ] Project Settings > CRE Analytics shows a Recording section with all four fields; the frame rate / scale / quality fields are only visible when `enableRecording` is true
- [ ] With `enableRecording = true`, recording starts and stops correctly across scene transitions without any scene-placed prefab
- [ ] With `enableRecording = false` (default), no `SessionRecorder` component is added and no `CRERecordings/` folder is created
- [ ] `SessionRecorder` has no `[SerializeField]` fields — all config is read from `AnalyticsManager.Instance.Config`
- [ ] `RecorderPrefabCreator.cs` and `CRESessionRecorder.prefab` are deleted (including `.meta` files)
- [ ] No `CRE Analytics > Create Session Recorder Prefab` menu item exists after this task

## Manual Step Required

After Windsurf completes this task, open Unity and let it compile. Unity will also need to re-import assets since prefab files are deleted — this happens automatically on editor focus.
