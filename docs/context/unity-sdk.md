# Context: Unity SDK

## What this is

`packages/com.cre.analytics/` is a Unity UPM package distributed via Git URL. It provides the analytics SDK that Unity projects use to define a session schema, populate it at runtime, and submit the completed session to the Firebase backend.

The `unity-project/` folder at repo root is a Unity 6000.0.74f1 project used to develop and test the package. It references the package locally. This project is **not a sample** — it's the development environment for the package.

---

## UPM Distribution

Users install the package in Unity Package Manager using:
```
https://github.com/{org}/cre-analytics.git?path=packages/com.cre.analytics
```

The `?path=` suffix points UPM to the package subfolder within the monorepo. No separate package repo needed.

Minimum Unity version declared in `package.json`: `"unity": "6000.0"`.

---

## Package Structure

```
packages/com.cre.analytics/
├── package.json
├── Runtime/
│   ├── com.cre.analytics.Runtime.asmdef
│   ├── AnalyticsSchema.cs          # ScriptableObject — defines session fields
│   ├── AnalyticsConfig.cs          # ScriptableObject — baseUrl, projectId (committed to git)
│   ├── AnalyticsSecrets.cs         # ScriptableObject — projectKey (gitignored)
│   ├── AnalyticsSession.cs         # Session state, pre-population, payload builder
│   ├── AnalyticsManager.cs         # Internal MonoBehaviour — auto-bootstrap singleton
│   ├── CREAnalytics.cs             # Public static API — StartSession, Set, EndSession
│   ├── SessionSender.cs            # HTTP submission coroutine + local session.json save
│   ├── SessionRecorder.cs          # Internal MonoBehaviour — auto-bootstrapped video recording
│   ├── MjpegAviWriter.cs           # Internal — pure C# MJPEG AVI file writer
│   ├── RecorderCameraFollower.cs   # Internal — copies Camera.main transform each LateUpdate
│   └── RecorderOverlay.cs          # Internal — analytics event overlay on recorder camera
├── Editor/
│   ├── com.cre.analytics.Editor.asmdef
│   ├── BakeAnalyticsWindow.cs      # Schema editor UI + Bake action
│   ├── AnalyticsCodeGenerator.cs   # Generates Assets/CREAnalytics/Generated/Analytics.cs
│   └── AnalyticsSettingsProvider.cs # Project Settings > CRE Analytics panel (includes recording config)
├── Tests/
│   ├── Runtime/
│   │   └── com.cre.analytics.Tests.asmdef
│   └── Editor/
│       └── com.cre.analytics.Editor.Tests.asmdef
└── AGENTS.md
```

The generated file `Assets/CREAnalytics/Generated/Analytics.cs` is written into the **consumer project's** Assets folder, not inside the package. Developers should commit it to their version control.

---

## Runtime Architecture

### Bootstrap

`AnalyticsManager` is an `internal MonoBehaviour` that auto-instantiates before any scene loads using `[RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]`. It creates a `[CRE Analytics]` GameObject and marks it `DontDestroyOnLoad` — no init scene or scene-placed prefab needed.

On bootstrap, the manager loads three assets from `Resources/`:
- `CREAnalyticsConfig` (`AnalyticsConfig`) — required; disables SDK if missing
- `CREAnalyticsSecrets` (`AnalyticsSecrets`) — optional; warns if missing (submission will fail)
- `CREAnalyticsSchema` (`AnalyticsSchema`) — optional; warns if missing (Set calls discarded)

### Public API

`CREAnalytics` is a `public static class` that delegates all calls to `AnalyticsManager.Instance`. It is the only public entry point — developers never interact with `AnalyticsManager` directly.

```csharp
CREAnalytics.StartSession();
CREAnalytics.Set("Tutorial/Steps", 3);
CREAnalytics.Increment("Tutorial/Clicks/Button A");      // +1
CREAnalytics.Increment("Tutorial/Clicks/Button A", 3);   // +3
CREAnalytics.EndSession();
```

`Increment(columnName, amount = 1)` adds `amount` to the current value of a Counter-typed field. It discards with a warning if the column is unknown, non-numeric, or uses the reserved `Session/` prefix.

### Generated typed accessors

After baking a schema, the Bake Analytics tool generates `Assets/CREAnalytics/Generated/Analytics.cs` — a static class with one nested class per schema group and one typed accessor per field:

- **Number/String/Boolean fields** → `SetX()` method
- **Counter fields** → `IncrementX(int amount = 1)` method (no `SetX` — prevents accidental overwrites)

```csharp
Analytics.Tutorial.SetSteps(3);
Analytics.MainExperience.SetDuration(45.2f);
Analytics.Tutorial.Clicks.IncrementButtonA();     // +1
Analytics.Tutorial.Clicks.IncrementButtonA(3);    // +3
```

This is the preferred calling convention — avoids raw column name strings and turns schema drift into compile errors.

### Session lifecycle

- `StartSession()` — generates `sessionId`, records `startedAt`, pre-populates all schema fields (user + `Session/` system fields) to zero values in memory
- `Set(columnName, value)` — schema-gated: logs a warning and discards if `columnName` is not in the schema
- `EndSession()` — finalizes `Session/EndedAt` and `Session/Duration`, builds the payload, sends via `SessionSender`, clears session state

---

## Configuration

Configuration is split into two ScriptableObject assets in `Resources/`:

| Asset | Load path | Contents | Source control |
|---|---|---|---|
| `AnalyticsConfig` | `Resources/CREAnalyticsConfig` | `baseUrl`, `projectId` | Committed |
| `AnalyticsSecrets` | `Resources/CREAnalyticsSecrets` | `projectKey` | **Gitignored** |

Configure both via `Edit > Project Settings > CRE Analytics`. The panel creates the assets if they don't exist and shows a persistent warning to add `CREAnalyticsSecrets.asset` to `.gitignore`.

---

## Schema & Bake Analytics

### SessionSchema ScriptableObject

Defined in `Runtime/AnalyticsSchema.cs`. Each Unity project creates one instance. Fields:
- `schemaVersion` — string, bumped by the Bake tool on each bake
- `fields` — list of `AnalyticsField`, each with `columnName` (supports `/` hierarchy), `type` (enum: `String | Number | Boolean | Counter`), `description` (optional)

`Counter` fields pre-populate to `0` at session start (same as Number) and are mutated exclusively via `CREAnalytics.Increment()`. They are submitted as plain numbers in the session payload — no backend or Firestore changes needed.

Developers place their schema asset at `Assets/Resources/CREAnalyticsSchema.asset` so the runtime can load it.

### Bake Analytics Editor Window

`Editor/BakeAnalyticsWindow.cs` — accessible via `CRE Analytics > Bake Analytics`. The window has two responsibilities:

**Schema editor UI:**
- Fields rendered as a recursive tree matching the full column path hierarchy (e.g., `Tutorial/Cliques/Botao A` shows as Tutorial → Cliques → Botao A, each level a nested foldout)
- Each group node has: editable name (rename propagates to all child field paths), ↑/↓ reorder within siblings, ⧉ duplicate group, "+ Add Field" and "+ Add Sub-Group" context buttons
- Inline validation: reserved names (`Session/` prefix), duplicates, empty names
- Rename = move: renaming a group header changes the prefix of all fields under it, so renaming `Tutorial/Cliques` to `Tutorial/Actions` effectively moves that sub-tree

**Bake action (clicking "Bake Analytics"):**
1. Validates schema — aborts with a dialog on any error
2. Increments `schemaVersion` (semver patch bump)
3. Generates `Assets/CREAnalytics/Generated/Analytics.cs` via `AnalyticsCodeGenerator`
4. POSTs schema (user fields + Session/ system fields) to `{baseUrl}/schemas/bake`
5. Saves schema asset and refreshes AssetDatabase

### Session/ system fields

The Bake tool always appends these five columns to every schema POST. They are SDK-managed and never appear in the schema editor:

| Column Name | Type |
|---|---|
| `Session/StartedAt` | string |
| `Session/EndedAt` | string |
| `Session/Duration` | number |
| `Session/Platform` | string |
| `Session/DeviceModel` | string |

The `Session/` namespace is reserved. The bake window shows a validation error and blocks baking if any user field starts with `Session/`.

---

## Session Recording

Recording is opt-in via `AnalyticsConfig.enableRecording` (default `false`). When enabled, `AnalyticsManager` adds `SessionRecorder` to its own `DontDestroyOnLoad` GameObject at startup — no scene-placed prefab needed. Recording is active across all scenes and scene transitions.

### How it works

- `AnalyticsManager` fires `internal static event Action<string> OnSessionStarted` (passes `sessionId`) and `internal static event Action OnSessionEnded` when sessions begin and end
- `SessionRecorder` subscribes to these events in `Awake` / unsubscribes in `OnDestroy`
- On session start: spawns a `[CRE Recorder Camera]` GameObject (`DontDestroyOnLoad`) with a `Camera` + `RecorderCameraFollower` component
- `RecorderCameraFollower` copies `Camera.main` position+rotation every `LateUpdate`
- The recorder camera renders to a `RenderTexture`; a coroutine captures frames via `Texture2D.ReadPixels`, encodes as JPEG, and passes to `MjpegAviWriter`
- On session end: coroutine stops, `MjpegAviWriter.Close()` finalises the AVI file, recorder camera is destroyed

### Output location

```
Application.persistentDataPath/CRERecordings/{sessionId}/
    session.json       ← always present (written by SessionSender on every EndSession)
    recording.avi      ← present when enableRecording = true
```

`session.json` contains the `sessionData` object (no `projectKey`) matching the Firestore document shape. Written by `SessionSender` before the HTTP request, so it is available locally even if the backend is unreachable.

`recording.avi` is MJPEG encoded. Resolution defaults to 0.5× screen resolution; frame rate defaults to 15fps. Both are configurable in Project Settings.

### Recording configuration (all in AnalyticsConfig, via Project Settings)

| Field | Type | Default | Description |
|---|---|---|---|
| `enableRecording` | bool | `false` | Opt-in; adds `SessionRecorder` at startup when true |
| `captureFrameRate` | int | `15` | Frames per second captured |
| `captureResolutionScale` | float | `0.5` | Multiplier on `Screen.width/height` for RenderTexture; range [0.1, 1.0] |
| `captureJpegQuality` | int | `75` | JPEG quality for each frame; range [1, 100] |
| `showAnalyticsOverlay` | bool | `true` | Renders Set() calls as fading text in the recording; only applies when `enableRecording` is true |

### Analytics event overlay

When `showAnalyticsOverlay` is true, `AnalyticsManager` also adds `RecorderOverlay` to its GameObject. This component subscribes to `internal static event Action<string, object> OnValueSet` (fired on every valid `SetValue` call) and renders a fading text entry (last path segment + value) in the bottom-left of the recording. Up to 4 entries visible at once, each fading over 2 seconds. The overlay canvas targets the recorder camera — invisible during gameplay.

### No prefab

`RecorderPrefabCreator.cs` and `CRESessionRecorder.prefab` have been removed. There is no `CRE Analytics > Create Session Recorder Prefab` menu item.

### Not sent to Firebase

Recording data is purely local. It is not part of the session payload and is never submitted to the backend.

---

## Local Package Reference (unity-project/)

The `unity-project/Packages/manifest.json` references the package locally:
```json
{
  "dependencies": {
    "com.cre.analytics": "file:../../packages/com.cre.analytics"
  }
}
```

---

## Manual Steps (Human Required)

These actions **cannot be performed by Windsurf** and require the user to act:

| Situation | Action required |
|-----------|----------------|
| First setup | Create the Unity project at `unity-project/` using Unity 6000.0.74f1 |
| After Unity project created | Add the local package reference to `unity-project/Packages/manifest.json` |
| After any `.cs`, `.asmdef`, or `package.json` change | Open Unity and let it compile |
| After adding a new `.asmdef` | Open Unity — it needs to import the assembly definition |
| When adding new Unity packages as dependencies | Add them via Unity Package Manager in the editor |
| After config setup | Add `Assets/Resources/CREAnalyticsSecrets.asset` to `.gitignore` |
| After schema creation | Place schema asset at `Assets/Resources/CREAnalyticsSchema.asset` for runtime loading |

Windsurf must **flag all of these to the user** before ending a task that triggers them.

---

## Compilation Errors

If Windsurf sees Unity compilation errors (CS-prefixed errors, missing namespace/type errors), they are almost always caused by Unity **not having compiled yet** after file changes — not a code bug. Windsurf must **not attempt to fix compilation errors** without first telling the user to open Unity and compile. Only investigate further if the user confirms the error persists after compilation.

---

## `.meta` Files

Unity generates `.meta` files for every asset and script. These must be committed to git. Windsurf should not delete or modify `.meta` files unless explicitly asked.

---

## Architect Notes

When creating tasks that touch `packages/com.cre.analytics/`, always include a **Manual Step Required** notice in the task body telling the user to open Unity after Windsurf completes. Reference the "Manual Steps" table above for specifics.

Never create a task asking Windsurf to create a Unity project — that must be done by the user in the Unity editor.
