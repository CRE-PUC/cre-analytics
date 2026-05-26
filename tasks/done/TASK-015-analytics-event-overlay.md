---
id: TASK-015
title: Real-time analytics event overlay on recording camera
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/context/unity-sdk.md
doc-impact:
  - docs/context/unity-sdk.md
depends-on: TASK-014
---

## Description

When reviewing a session recording, it's useful to see which analytics fields were set and when. Add an optional overlay to the recording camera that briefly displays each `CREAnalytics.Set()` call as it happens — field name and value — as a text log in the corner of the video.

This overlay is only visible in the `recording.avi` output. It is not visible to the player during the game. It is opt-in via a new `showAnalyticsOverlay` field on `AnalyticsConfig`.

---

## Files to create / modify

| File | Action |
|------|--------|
| `packages/com.cre.analytics/Runtime/RecorderOverlay.cs` | **Create** — overlay component |
| `packages/com.cre.analytics/Runtime/AnalyticsManager.cs` | Fire `OnValueSet` event; add `RecorderOverlay` conditionally |
| `packages/com.cre.analytics/Runtime/AnalyticsConfig.cs` | Add `showAnalyticsOverlay` field |
| `packages/com.cre.analytics/Editor/AnalyticsSettingsProvider.cs` | Add overlay toggle to recording section |

---

## AnalyticsConfig.cs — new field

Add inside the `[Header("Recording")]` block (after `captureJpegQuality`):

```csharp
public bool showAnalyticsOverlay = true;
```

Defaults to `true` — when recording is enabled, the overlay is on by default.

---

## AnalyticsManager.cs — two changes

### 1. New internal event

Add alongside the existing session events:

```csharp
internal static event Action<string, object> OnValueSet;
```

### 2. Fire the event in SetValue

In `SetValue(string columnName, object value)`, after `_currentSession.Set(columnName, value)` succeeds (i.e., not in the early-return paths), add:

```csharp
OnValueSet?.Invoke(columnName, value);
```

### 3. Conditionally add RecorderOverlay

In `Awake()`, after adding `SessionRecorder`:

```csharp
if (Config != null && Config.enableRecording && Config.showAnalyticsOverlay)
{
    gameObject.AddComponent<RecorderOverlay>();
}
```

---

## RecorderOverlay.cs

`RecorderOverlay` is an `internal MonoBehaviour`. It:
1. Waits for `SessionRecorder` to start recording (subscribes to `AnalyticsManager.OnSessionStarted`)
2. On recording start, locates the `[CRE Recorder Camera]` GameObject and gets its `Camera` component
3. Creates a `Canvas` targeting that camera with `RenderMode.ScreenSpaceCamera`
4. Subscribes to `AnalyticsManager.OnValueSet` and displays each event as a text entry

### Canvas setup (called once per session start)

```csharp
private void CreateOverlayCanvas(Camera recorderCamera)
{
    var canvasGO = new GameObject("[CRE Overlay Canvas]");
    DontDestroyOnLoad(canvasGO);

    var canvas = canvasGO.AddComponent<Canvas>();
    canvas.renderMode = RenderMode.ScreenSpaceCamera;
    canvas.worldCamera = recorderCamera;
    canvas.planeDistance = 1f;
    canvas.sortingOrder = 100;

    var scaler = canvasGO.AddComponent<CanvasScaler>();
    scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
    scaler.referenceResolution = new Vector2(1920, 1080);

    // Create a vertical layout group anchored to bottom-left
    var logGO = new GameObject("[CRE Overlay Log]");
    logGO.transform.SetParent(canvasGO.transform, false);
    var logRect = logGO.AddComponent<RectTransform>();
    logRect.anchorMin = new Vector2(0, 0);
    logRect.anchorMax = new Vector2(0, 0);
    logRect.pivot = new Vector2(0, 0);
    logRect.anchoredPosition = new Vector2(16, 16);
    logRect.sizeDelta = new Vector2(700, 300);
    var vlg = logGO.AddComponent<VerticalLayoutGroup>();
    vlg.childAlignment = TextAnchor.LowerLeft;
    vlg.spacing = 2;
    vlg.childForceExpandWidth = false;
    vlg.childForceExpandHeight = false;

    _logParent = logRect;
    _overlayCanvas = canvasGO;
}
```

### Displaying events

Keep a queue of at most **4 active entries**. When `OnValueSet` fires:
1. If there are already 4 entries, destroy the oldest immediately
2. Create a new `Text` entry in `_logParent` using `UnityEngine.UI.Text`:
   - Text: `[ColumnName]: value` (truncate `ColumnName` to last segment after final `/`, e.g. `Tutorial/Clicks/Button A` → `Button A`)
   - FontSize: 22
   - Color: `new Color(1f, 1f, 0.3f, 1f)` (yellow-ish)
   - FontStyle: `FontStyle.Bold`
   - `ContentSizeFitter` with `HorizontalFit = PreferredSize`
3. Start a coroutine that fades the entry's alpha from 1 to 0 over **2 seconds**, then destroys the GameObject

### Value display

Format the value for display:
- `null` → `"—"`
- `string` → the string value (truncate to 30 chars if longer, append `…`)
- `float` / `double` → `value.ToString("F2")`
- All others → `value.ToString()`

### Cleanup on session end

Subscribe to `AnalyticsManager.OnSessionEnded`. When fired:
- Destroy `_overlayCanvas` if it exists
- Clear the entry queue
- Set `_overlayCanvas = null` and `_logParent = null`

The overlay will be recreated on the next `OnSessionStarted`.

### Finding the recorder camera

The recorder camera lives on a GameObject named `[CRE Recorder Camera]` (created by `SessionRecorder.StartRecording`). Finding it:

```csharp
private Camera FindRecorderCamera()
{
    var go = GameObject.Find("[CRE Recorder Camera]");
    return go != null ? go.GetComponent<Camera>() : null;
}
```

Call this in `HandleSessionStarted`. If it returns null, log a warning and skip overlay creation for that session.

### Full field list

```csharp
private Canvas _overlayCanvas;
private RectTransform _logParent;
private readonly List<GameObject> _activeEntries = new();

void Awake()
{
    AnalyticsManager.OnSessionStarted += HandleSessionStarted;
    AnalyticsManager.OnSessionEnded  += HandleSessionEnded;
    AnalyticsManager.OnValueSet      += HandleValueSet;
}

void OnDestroy()
{
    AnalyticsManager.OnSessionStarted -= HandleSessionStarted;
    AnalyticsManager.OnSessionEnded  -= HandleSessionEnded;
    AnalyticsManager.OnValueSet      -= HandleValueSet;
}
```

---

## AnalyticsSettingsProvider.cs — overlay toggle

Inside the recording section added in TASK-014, after the resolution/quality fields, add:

```
Show Analytics Overlay  [ toggle ]   (only visible when enableRecording = true)
```

Follow the existing `EditorGUI.BeginChangeCheck` pattern.

---

## Acceptance Criteria

- [ ] `showAnalyticsOverlay` field exists on `AnalyticsConfig`, defaults to `true`
- [ ] Project Settings > CRE Analytics shows a "Show Analytics Overlay" toggle inside the Recording section (only when `enableRecording` is true)
- [ ] `AnalyticsManager.OnValueSet` event fires whenever `SetValue` is called with a valid column (i.e., not in the early-return warning paths)
- [ ] When recording + overlay are enabled, each `Set()` call causes a text entry to appear in the bottom-left of the recorded video
- [ ] Entries display the last path segment of the column name and the formatted value
- [ ] At most 4 entries are visible at once; the oldest is removed when a 5th arrives
- [ ] Each entry fades to transparent over 2 seconds, then its GameObject is destroyed
- [ ] The overlay canvas is destroyed at session end and recreated at the next session start
- [ ] With `showAnalyticsOverlay = false`, no canvas is created and no `RecorderOverlay` component is added
- [ ] The overlay is **not** visible on `Camera.main` during gameplay — only on the recorder camera
- [ ] `RecorderOverlay` is `internal` — not part of the public SDK surface

## Manual Step Required

After Windsurf completes this task, open Unity and let it compile.
