# CRE Analytics — Unity SDK

Session-based analytics SDK for Unity. Collects, aggregates, and submits structured session data to the CRE Analytics backend.

## Installation

Install via Unity Package Manager using the git URL:

```
https://github.com/CRE-PUC/cre-analytics.git?path=packages/com.cre.analytics
```

Minimum Unity version: 6000.0.

## Setup

Three ScriptableObject assets are required. All are created and configured via `Edit > Project Settings > CRE Analytics`.

| Asset | Resource path | Contents | Source control |
|---|---|---|---|
| `AnalyticsConfig` | `Resources/CREAnalyticsConfig` | `baseUrl`, `projectId` | Committed |
| `AnalyticsSecrets` | `Resources/CREAnalyticsSecrets` | `projectKey` | **Gitignored** |
| `AnalyticsSchema` | `Resources/CREAnalyticsSchema` | Session field definitions | Committed |

Obtain `projectId` and `projectKey` from the CRE Analytics backoffice by creating a project there.

Add `CREAnalyticsSecrets.asset` to your project's `.gitignore`. The settings panel shows a reminder.

## Defining a Schema

Open `CRE Analytics > Bake Analytics`. Use the schema editor to define your session fields. Each field has:
- A column name (use `/` as a hierarchy separator, e.g. `Tutorial/Steps`)
- A type: `Int`, `Float`, `Bool`, `String`, or `Timestamp`

The `Session/` namespace is reserved — do not use it in your own field names.

Click **Bake Analytics** to:
1. Validate the schema
2. Increment the schema version
3. Generate typed C# accessors at `Assets/CREAnalytics/Generated/Analytics.cs`
4. Register the schema with the backend

Commit both the schema asset and the generated `Analytics.cs`.

## Session Lifecycle

```csharp
// Start a session (call once at the beginning of the experience)
CREAnalytics.StartSession();

// Set field values at any point during the session
CREAnalytics.Set("Tutorial/Steps", 5);
CREAnalytics.Set("Tutorial/Completed", true);

// End the session — finalizes timing fields and submits to Firebase
CREAnalytics.EndSession();
```

The SDK bootstraps automatically before any scene loads. `StartSession()` is safe to call from any `Awake()` or `Start()`.

## Typed Accessors (recommended)

After baking, use the generated `Analytics` class instead of raw string keys:

```csharp
Analytics.Tutorial.SetSteps(5);
Analytics.Tutorial.SetCompleted(true);
```

This turns schema drift and typos into compile-time errors.

## Session Recording

The SDK can record the session as a PNG image sequence saved to the device. Recording is opt-in — add the `CRESessionRecorder` prefab to your scene to enable it.

**Setup:**
1. Run `CRE Analytics > Create Session Recorder Prefab` from the Unity menu. This creates `CRESessionRecorder.prefab` in the package's `Runtime/Prefabs/` folder.
2. Drag the prefab into your scene.
3. Recording starts automatically when `CREAnalytics.StartSession()` is called and stops when `CREAnalytics.EndSession()` is called.

**Output:**
- Frames saved to: `Application.persistentDataPath/CRERecordings/{sessionId}/frame_000000.png` ...
- Manifest saved to: `Application.persistentDataPath/CRERecordings/{sessionId}/recording_manifest.json`

The manifest contains: `sessionId`, `captureFrameRate`, `frameCount`, `savedAt`.

**Inspector options on `SessionRecorder`:**
| Field | Default | Description |
|---|---|---|
| `Record On Session Start` | `true` | Automatically start recording when a session begins |
| `Capture Frame Rate` | `30` | Frames captured per second |
| `Session Id Display` | *(prefab-wired)* | `UnityEngine.UI.Text` showing the current session ID on screen |

The session ID text is shown on the Game view during recording. The recorded frames capture the main camera's world-space view; the on-screen text is displayed separately for developer reference.

## System Fields

These fields are automatically included in every session. Do not define them in your schema.

| Column | Type | Description |
|---|---|---|
| `Session/StartedAt` | string | UTC ISO 8601 timestamp |
| `Session/EndedAt` | string | UTC ISO 8601 timestamp |
| `Session/Duration` | float | Seconds |
| `Session/Platform` | string | `Application.platform` value |
| `Session/DeviceModel` | string | `SystemInfo.deviceModel` |

## Data flow

```
Unity project
  └── CREAnalytics.StartSession()
  └── CREAnalytics.Set(...)     ← repeated during session
  └── CREAnalytics.EndSession() → POST /sessions → Firestore
                                                      ↓
                                           Backoffice dashboard
```
