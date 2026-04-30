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

The `?path=` suffix points UPM to the package subfolder within the monorepo. No separate package repo is needed.

Minimum Unity version declared in `package.json`: `"unity": "6000.0"`.

---

## Package Structure

```
packages/com.cre.analytics/
├── package.json                              # Unity package manifest
├── Runtime/
│   ├── com.cre.analytics.Runtime.asmdef
│   ├── AnalyticsSchema.cs                    # ScriptableObject — defines session fields
│   ├── AnalyticsSession.cs                   # Runtime session data builder
│   └── SessionSender.cs                      # HTTP submission to Firebase Function
├── Editor/
│   ├── com.cre.analytics.Editor.asmdef       # references Runtime asmdef
│   └── BakeAnalyticsWindow.cs                # "Bake Analytics" editor tool
├── Tests/
│   ├── Runtime/
│   │   └── com.cre.analytics.Tests.asmdef
│   └── Editor/
│       └── com.cre.analytics.Editor.Tests.asmdef
└── AGENTS.md
```

---

## Schema & Bake Analytics

### SessionSchema ScriptableObject
Defined in `Runtime/AnalyticsSchema.cs`. Each Unity project creates one instance of this asset. It contains:
- `schemaVersion` — string, bumped by the Bake tool
- `fields` — list of `AnalyticsField` entries, each with:
  - `columnName` — string key used in the `data` array (supports `/` hierarchy separator)
  - `type` — enum: `Int`, `Float`, `String`, `Bool`, `Timestamp`
  - `description` — optional human-readable label

### Bake Analytics Editor Tool
`Editor/BakeAnalyticsWindow.cs` — Unity Editor Window accessible via menu. When "baked":
1. Validates the schema (no duplicate column names, no empty names)
2. Bumps `schemaVersion`
3. Marks the asset dirty so Unity saves it

The SDK serializes all fields from the schema into the `data` array on every session submission — **every field is always present**, even if the value is empty/default. This keeps all sessions of the same schema version structurally identical.

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
| After any `.cs`, `.asmdef`, or `package.json` change | Open Unity and let it compile — compilation is not automatic |
| After adding a new `.asmdef` | Open Unity — it needs to import the assembly definition |
| When adding new Unity packages as dependencies | Add them via Unity Package Manager in the editor |

Windsurf must **flag all of these to the user** before ending a task that triggers them.

---

## Compilation Errors

If Windsurf sees Unity compilation errors (CS-prefixed errors, missing namespace/type errors), they are almost always caused by Unity **not having compiled yet** after file changes — not a code bug. Windsurf must **not attempt to fix compilation errors** without first telling the user to open Unity and compile. Only investigate further if the user confirms the error persists after compilation.

---

## `.meta` Files

Unity generates `.meta` files for every asset and script. These must be committed to git. Windsurf should not delete or modify `.meta` files unless explicitly asked.
