---
id: TASK-004
title: Scaffold Unity UPM package structure
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
  - docs/context/session-data-format.md
doc-impact: []
---

## Description

Create the `packages/com.cre.analytics/` folder structure for the Unity UPM package. This includes the Unity package manifest, assembly definition files, stub C# scripts, and the folder-scoped `AGENTS.md`. No real logic yet — the goal is a valid package skeleton that Unity can import without errors.

**Important:** Do not create or modify any file inside `unity-project/`. The Unity project does not exist yet — the user will create it manually after this task is done.

## Acceptance Criteria

- [ ] `packages/com.cre.analytics/package.json` exists and is a valid Unity package manifest (see Relevant Data)
- [ ] `packages/com.cre.analytics/Runtime/` folder exists with:
  - [ ] `com.cre.analytics.Runtime.asmdef` — valid Unity assembly definition (see Relevant Data)
  - [ ] `AnalyticsSchema.cs` — stub ScriptableObject class (see Relevant Data)
  - [ ] `AnalyticsSession.cs` — stub session builder class
  - [ ] `SessionSender.cs` — stub HTTP sender class
- [ ] `packages/com.cre.analytics/Editor/` folder exists with:
  - [ ] `com.cre.analytics.Editor.asmdef` — references the Runtime asmdef, `Editor` platform only (see Relevant Data)
  - [ ] `BakeAnalyticsWindow.cs` — stub Unity EditorWindow (see Relevant Data)
- [ ] `packages/com.cre.analytics/Tests/Runtime/` exists with a valid test asmdef
- [ ] `packages/com.cre.analytics/Tests/Editor/` exists with a valid test asmdef
- [ ] `packages/com.cre.analytics/AGENTS.md` exists with the exact content specified in Relevant Data
- [ ] No `.meta` files are created — Unity generates these when the project is opened

## ⚠️ Manual Step Required — Tell the User

After completing this task, inform the user:

> **Manual step required:** The UPM package structure has been created at `packages/com.cre.analytics/`. You now need to:
> 1. Create a Unity project at `unity-project/` using Unity **6000.0.74f1**
> 2. In that project, open `Packages/manifest.json` and add this line to the `dependencies` object:
>    `"com.cre.analytics": "file:../../packages/com.cre.analytics"`
> 3. Open the project in Unity — it will compile the package automatically

## Relevant Data

### packages/com.cre.analytics/package.json
```json
{
  "name": "com.cre.analytics",
  "version": "0.1.0",
  "displayName": "CRE Analytics",
  "description": "Session-based analytics SDK for Unity projects",
  "unity": "6000.0",
  "author": {
    "name": "CRE"
  },
  "keywords": ["analytics", "session", "firebase"],
  "dependencies": {}
}
```

### Runtime asmdef (com.cre.analytics.Runtime.asmdef)
```json
{
  "name": "CRE.Analytics.Runtime",
  "rootNamespace": "CRE.Analytics",
  "references": [],
  "includePlatforms": [],
  "excludePlatforms": [],
  "allowUnsafeCode": false,
  "overrideReferences": false,
  "autoReferenced": true
}
```

### Editor asmdef (com.cre.analytics.Editor.asmdef)
```json
{
  "name": "CRE.Analytics.Editor",
  "rootNamespace": "CRE.Analytics.Editor",
  "references": ["CRE.Analytics.Runtime"],
  "includePlatforms": ["Editor"],
  "excludePlatforms": [],
  "allowUnsafeCode": false,
  "overrideReferences": false,
  "autoReferenced": false
}
```

### AnalyticsSchema.cs (stub)
```csharp
using System.Collections.Generic;
using UnityEngine;

namespace CRE.Analytics
{
    [CreateAssetMenu(fileName = "AnalyticsSchema", menuName = "CRE Analytics/Schema")]
    public class AnalyticsSchema : ScriptableObject
    {
        public string schemaVersion = "0.1.0";
        public List<AnalyticsField> fields = new();
    }

    [System.Serializable]
    public class AnalyticsField
    {
        public string columnName;
        public AnalyticsFieldType type;
        public string description;
    }

    public enum AnalyticsFieldType
    {
        String,
        Int,
        Float,
        Bool,
        Timestamp
    }
}
```

### AnalyticsSession.cs (stub)
```csharp
using System.Collections.Generic;

namespace CRE.Analytics
{
    public class AnalyticsSession
    {
        private readonly AnalyticsSchema _schema;
        private readonly Dictionary<string, object> _values = new();

        public AnalyticsSession(AnalyticsSchema schema)
        {
            _schema = schema;
        }

        public void SetValue(string columnName, object value)
        {
            _values[columnName] = value;
        }

        // TODO: build the SessionData payload for submission
    }
}
```

### SessionSender.cs (stub)
```csharp
using System.Threading.Tasks;
using UnityEngine;

namespace CRE.Analytics
{
    public class SessionSender : MonoBehaviour
    {
        [SerializeField] private string endpointUrl;
        [SerializeField] private string projectId;

        // TODO: POST session data to Firebase Function endpoint
    }
}
```

### BakeAnalyticsWindow.cs (stub)
```csharp
using UnityEditor;
using UnityEngine;

namespace CRE.Analytics.Editor
{
    public class BakeAnalyticsWindow : EditorWindow
    {
        [MenuItem("CRE Analytics/Bake Analytics")]
        public static void ShowWindow()
        {
            GetWindow<BakeAnalyticsWindow>("Bake Analytics");
        }

        private void OnGUI()
        {
            GUILayout.Label("Bake Analytics", EditorStyles.boldLabel);
            // TODO: schema validation and version bumping
        }
    }
}
```

### AGENTS.md content for packages/com.cre.analytics/

Create `packages/com.cre.analytics/AGENTS.md` with this exact content:

---
```markdown
# AGENTS.md — com.cre.analytics (Unity UPM Package)

These rules apply whenever Windsurf works inside `packages/com.cre.analytics/`.

## Compilation Errors

If you see Unity compilation errors (CS-prefixed errors, missing type/namespace), they are almost always caused by Unity not having compiled yet after file changes — not a real code bug. **Do not attempt to fix compilation errors without first telling the user to open Unity and compile.** Only investigate if the user confirms the error persists after compilation.

## Manual Steps — Always Notify the User

Before completing any task that touches the following, tell the user exactly what manual action is required:

| Change | Manual step |
|--------|------------|
| New or modified `.cs` or `.asmdef` file | Open Unity — let it compile |
| New `.asmdef` added | Open Unity — it must import the assembly definition |
| New Unity package dependency added to `package.json` | Add it via Unity Package Manager in the editor |
| Any structural change to the package | Open Unity — verify no import errors |

## .meta Files

Do not create, delete, or modify `.meta` files. Unity generates them automatically when the project is opened. Commit them when they appear.

## Namespace

All Runtime code uses namespace `CRE.Analytics`. All Editor code uses `CRE.Analytics.Editor`.

## ScriptableObject Menus

All `CreateAssetMenu` entries use the prefix `"CRE Analytics/"`.
All `MenuItem` entries use the prefix `"CRE Analytics/"`.

## Assembly Definitions

- Runtime code → `CRE.Analytics.Runtime` asmdef
- Editor code → `CRE.Analytics.Editor` asmdef (references Runtime, `includePlatforms: ["Editor"]`)
- Do not put editor-only code in the Runtime assembly.
```
---

### Test asmdef stubs

`Tests/Runtime/com.cre.analytics.Tests.asmdef`:
```json
{
  "name": "CRE.Analytics.Tests",
  "rootNamespace": "CRE.Analytics.Tests",
  "references": ["CRE.Analytics.Runtime", "UnityEngine.TestRunner", "UnityEditor.TestRunner"],
  "includePlatforms": [],
  "excludePlatforms": [],
  "allowUnsafeCode": false,
  "overrideReferences": true,
  "precompiledReferences": ["nunit.framework.dll"],
  "autoReferenced": false,
  "defineConstraints": ["UNITY_INCLUDE_TESTS"]
}
```

`Tests/Editor/com.cre.analytics.Editor.Tests.asmdef`:
```json
{
  "name": "CRE.Analytics.Editor.Tests",
  "rootNamespace": "CRE.Analytics.Editor.Tests",
  "references": ["CRE.Analytics.Runtime", "CRE.Analytics.Editor", "UnityEngine.TestRunner", "UnityEditor.TestRunner"],
  "includePlatforms": ["Editor"],
  "excludePlatforms": [],
  "allowUnsafeCode": false,
  "overrideReferences": true,
  "precompiledReferences": ["nunit.framework.dll"],
  "autoReferenced": false,
  "defineConstraints": ["UNITY_INCLUDE_TESTS"]
}
```
