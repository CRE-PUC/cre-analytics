---
id: TASK-032
title: Write Unity SDK README for package consumers
status: pending
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

There is currently no `README.md` inside `packages/com.cre.analytics/`. Unity Package Manager displays this file in the package inspector when a consumer installs the package. Create it as the primary reference for developers integrating the SDK into their Unity project.

Also add a brief "Unity SDK" section to the root `README.md` pointing consumers to the package README and documenting the installation URL.

---

## File 1: `packages/com.cre.analytics/README.md`

Write a complete, practical README covering all of the following sections. No marketing language. No emoji. Direct and technical.

### Sections required

**1. Title + one-liner**
```
# CRE Analytics — Unity SDK

Session-based analytics SDK for Unity. Collects, aggregates, and submits structured session data to the CRE Analytics backend.
```

**2. Installation**

Install via Unity Package Manager using the git URL:
```
https://github.com/{org}/cre-analytics.git?path=packages/com.cre.analytics
```
Replace `{org}` with the GitHub organization name.  
Minimum Unity version: 6000.0.

**3. Setup**

Three ScriptableObject assets are required. All are created and configured via `Edit > Project Settings > CRE Analytics`.

| Asset | Resource path | Contents | Source control |
|---|---|---|---|
| `AnalyticsConfig` | `Resources/CREAnalyticsConfig` | `baseUrl`, `projectId` | Committed |
| `AnalyticsSecrets` | `Resources/CREAnalyticsSecrets` | `projectKey` | **Gitignored** |
| `AnalyticsSchema` | `Resources/CREAnalyticsSchema` | Session field definitions | Committed |

Obtain `projectId` and `projectKey` from the CRE Analytics backoffice by creating a project there.

Add `CREAnalyticsSecrets.asset` to your project's `.gitignore`. The settings panel shows a reminder.

**4. Defining a Schema**

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

**5. Session Lifecycle**

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

**6. Typed Accessors (recommended)**

After baking, use the generated `Analytics` class instead of raw string keys:

```csharp
Analytics.Tutorial.SetSteps(5);
Analytics.Tutorial.SetCompleted(true);
```

This turns schema drift and typos into compile-time errors.

**7. Session Recording**

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

**8. System Fields**

These fields are automatically included in every session. Do not define them in your schema.

| Column | Type | Description |
|---|---|---|
| `Session/StartedAt` | string | UTC ISO 8601 timestamp |
| `Session/EndedAt` | string | UTC ISO 8601 timestamp |
| `Session/Duration` | float | Seconds |
| `Session/Platform` | string | `Application.platform` value |
| `Session/DeviceModel` | string | `SystemInfo.deviceModel` |

**9. Data flow**

```
Unity project
  └── CREAnalytics.StartSession()
  └── CREAnalytics.Set(...)     ← repeated during session
  └── CREAnalytics.EndSession() → POST /sessions → Firestore
                                                      ↓
                                           Backoffice dashboard
```

---

## File 2: Root `README.md` update

In the root `README.md`, after the "Creating a Project" section and before the "Contributing" section, insert a new section:

```markdown
## Unity SDK

Install the SDK in Unity Package Manager using the git URL:

```
https://github.com/{org}/cre-analytics.git?path=packages/com.cre.analytics
```

See `packages/com.cre.analytics/README.md` for full SDK documentation: setup, schema definition, session lifecycle, typed accessors, and session recording.
```

Replace `{org}` with the actual GitHub organization name — check the existing git remote (`git remote get-url origin`) to find it. If it cannot be determined, use `{org}` as a placeholder and add a TODO comment.

---

## Acceptance Criteria

- [ ] `packages/com.cre.analytics/README.md` exists and covers all 9 sections listed above
- [ ] The recording section correctly describes the `CRESessionRecorder` prefab workflow from TASK-031
- [ ] Root `README.md` has a "Unity SDK" section with the installation URL and a link to the package README
- [ ] No section contradicts the current SDK behavior as described in `docs/context/unity-sdk.md`
- [ ] Tone is direct and technical — no marketing language, no emoji
