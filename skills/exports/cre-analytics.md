---
name: cre-analytics
description: How to use the CRE Analytics Unity SDK — installation, configuration, public API, session recording, and local save.
source-repo: cre-analytics
generated: 2026-05-26
---

## Overview

`com.cre.analytics` is a Unity UPM package that instruments session-based analytics. Each play session aggregates data locally and submits one JSON document to a Firebase backend at session end. The SDK auto-bootstraps with no scene setup required. Session data is also always saved locally on disk alongside an optional local video recording.

---

## Installation

In Unity Package Manager, add via **Git URL**:

```
https://github.com/{org}/cre-analytics.git?path=packages/com.cre.analytics
```

Minimum Unity version: **6000.0.74f1**

---

## Configuration

All config is done in **Edit > Project Settings > CRE Analytics**. The panel creates the required ScriptableObject assets automatically.

| Asset | Load path | Contents | Source control |
|---|---|---|---|
| `AnalyticsConfig` | `Resources/CREAnalyticsConfig` | `baseUrl`, `projectId`, recording settings | ✅ Commit |
| `AnalyticsSecrets` | `Resources/CREAnalyticsSecrets` | `projectKey` | 🚫 **Gitignore** |

After creating `AnalyticsSecrets.asset`, add it to `.gitignore`:
```
Assets/Resources/CREAnalyticsSecrets.asset
Assets/Resources/CREAnalyticsSecrets.asset.meta
```

### Recording config (in AnalyticsConfig, via Project Settings)

| Field | Default | Description |
|---|---|---|
| `enableRecording` | `false` | Opt-in; enables local video recording |
| `captureFrameRate` | `15` | Frames per second |
| `captureResolutionScale` | `0.5` | Multiplier on screen resolution; range [0.1, 1.0] |
| `captureJpegQuality` | `75` | JPEG quality per frame; range [1, 100] |
| `showAnalyticsOverlay` | `true` | Shows Set() events as fading text in the recording |

---

## Schema Setup (required before Set() calls work)

1. Open **CRE Analytics > Bake Analytics** in the Unity menu
2. Define your session fields (column name, type, optional description)
   - Column names use `/` as a hierarchy separator: `Tutorial/Clicks/Button A`
   - The `Session/` prefix is reserved — do not use it for your fields
3. Click **Bake Analytics**
   - Bumps `schemaVersion` in the ScriptableObject
   - Generates `Assets/CREAnalytics/Generated/Analytics.cs` (typed accessors)
   - POSTs the schema to the backend

Place your schema asset at `Assets/Resources/CREAnalyticsSchema.asset` so the runtime can load it.

Commit both `Analytics.cs` and its `.meta` file to your version control.

---

## Public API

`CREAnalytics` is the only public entry point. The SDK auto-bootstraps — no scene setup needed.

```csharp
// Start a session (call once per play session)
CREAnalytics.StartSession();

// Set field values during the session
CREAnalytics.Set("Tutorial/Clicks/Button A", 5);   // raw string key
Analytics.Tutorial.Clicks.SetButtonA(5);            // generated typed accessor (preferred)

// End the session — finalizes timing, saves JSON locally, and submits to backend
CREAnalytics.EndSession();
```

### Generated typed accessors

After baking, `Analytics.cs` provides compile-time safety. Use these instead of raw strings:

```csharp
Analytics.Tutorial.SetStartedAt(DateTime.UtcNow.ToString("o"));
Analytics.MainExperience.SetDuration(45.2f);
```

Typos in column names become **build errors**, not silent runtime warnings.

### System fields (auto-managed, do not set)

The SDK automatically populates these in every session's `data` array:

| Column | Set by | Value |
|---|---|---|
| `Session/StartedAt` | `StartSession()` | UTC timestamp |
| `Session/EndedAt` | `EndSession()` | UTC timestamp |
| `Session/Duration` | `EndSession()` | Elapsed seconds (float) |
| `Session/Platform` | `StartSession()` | `Application.platform.ToString()` |
| `Session/DeviceModel` | `StartSession()` | `SystemInfo.deviceModel` |

---

## Session Document Shape

The document submitted to Firebase (and saved locally as `session.json`) has this shape:

```json
{
  "sessionData": {
    "metaData": {
      "projectId": "...",
      "schemaVersion": "1.0.0",
      "sessionId": "uuid-v4"
    },
    "data": [
      { "columnName": "Session/StartedAt",   "value": "2025-10-15T12:00:00.000Z" },
      { "columnName": "Session/EndedAt",     "value": "2025-10-15T12:05:00.000Z" },
      { "columnName": "Session/Duration",    "value": 300.0 },
      { "columnName": "Session/Platform",    "value": "Quest3" },
      { "columnName": "Session/DeviceModel", "value": "Oculus Quest 3" },
      { "columnName": "Tutorial/Clicks/Button A", "value": 40 }
    ]
  }
}
```

`metaData` is a lean routing envelope — only `projectId`, `schemaVersion`, `sessionId`. All timing and device data lives in the `Session/` entries of the `data` array.

---

## Local Session Save

Every time `EndSession()` is called, the SDK writes the session data to disk **before** attempting the network request:

```
Application.persistentDataPath/CRERecordings/{sessionId}/session.json
```

`session.json` contains the full `sessionData` object (no `projectKey`). Session data is always available locally regardless of backend availability.

---

## Session Recording (opt-in)

Enable recording in **Project Settings > CRE Analytics** by setting `Enable Recording = true`. No prefab or scene setup required — the recorder auto-bootstraps as a `DontDestroyOnLoad` component and records across all scene transitions.

Output per session:
```
Application.persistentDataPath/CRERecordings/{sessionId}/
    session.json      ← always present
    recording.avi     ← present when enableRecording = true (MJPEG, ~180MB per 5-min session at defaults)
```

When `showAnalyticsOverlay` is enabled (default), each `Set()` call appears briefly as a fading text entry in the bottom-left of the recording. Visible only in the video — not during gameplay.

---

## Constraints & Gotchas

- **`AnalyticsSecrets.asset` must be gitignored** — it contains the `projectKey` secret. The Project Settings panel reminds you, but you must add it to `.gitignore` yourself.
- **Bake before first run** — `Set()` calls are silently discarded if no schema is loaded. Bake the schema and place it at `Assets/Resources/CREAnalyticsSchema.asset` before entering play mode.
- **Commit `Analytics.cs` and its `.meta`** — the generated file belongs in your version control. Without it, other team members lose typed accessors.
- **`Session/` prefix is reserved** — the bake tool blocks baking if any user field starts with `Session/` (case-insensitive). `Set()` also silently discards writes to `Session/` keys.
- **All schema fields are always present in submitted data** — the SDK pre-populates every field at session start (int/float → 0, bool → false, string → "", timestamp → null). A session never has missing columns.
- **One session at a time** — calling `StartSession()` while a session is already active replaces it with a warning.
- **Auto-bootstrap** — no init scene, no scene-placed GameObject needed. The SDK creates `[CRE Analytics]` (DontDestroyOnLoad) before any scene loads via `RuntimeInitializeOnLoadMethod`.
- **`metaData` is routing-only** — do not read `platform`, `startedAt`, or `endedAt` from `metaData`. Those fields do not exist. Read them from the `Session/` entries in the `data` array.
- **Recording storage** — at defaults (15fps, 0.5× resolution), a 5-minute session produces a ~180MB AVI file on-device. Adjust `captureResolutionScale` and `captureFrameRate` if storage is a concern.

---

## Migration Notes

**v[current] — metaData simplified; `platform`, `startedAt`, `endedAt` removed**

`metaData` now contains only `projectId`, `schemaVersion`, `sessionId`. Platform and timing data is available exclusively in the `Session/` data group (`Session/Platform`, `Session/StartedAt`, `Session/EndedAt`). If your consuming code reads these from `metaData`, update it to read from the `data` array.

**v[current] — Local session save added**

`EndSession()` always writes `session.json` to `Application.persistentDataPath/CRERecordings/{sessionId}/` before submitting. No API changes.

**v[current] — Recording upgraded to MJPEG AVI; prefab removed**

Recording now outputs `recording.avi` (MJPEG, pure C#) instead of individual PNG frames. Configured entirely in Project Settings — no scene prefab needed. `CRESessionRecorder.prefab` and the `Create Session Recorder Prefab` menu item no longer exist.
