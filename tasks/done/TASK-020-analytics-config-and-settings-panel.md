---
id: TASK-020
title: Analytics config ScriptableObjects + Project Settings panel
status: done
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
doc-impact:
  - docs/context/unity-sdk.md
---

## Description

Create the configuration infrastructure for the CRE Analytics Unity SDK. The SDK requires two pieces of configuration: shared config (`baseUrl`, `projectId`) that is committed to version control, and a secret (`projectKey`) that must be gitignored. Both are stored as ScriptableObjects in `Resources/` so the runtime can load them without scene references.

The Project Settings panel (`Edit > Project Settings > CRE Analytics`) is the primary developer-facing UI for configuring both assets. It creates the assets if they don't exist and permanently reminds developers to gitignore the secrets file.

## Files to Create

- `packages/com.cre.analytics/Runtime/AnalyticsConfig.cs`
- `packages/com.cre.analytics/Runtime/AnalyticsSecrets.cs`
- `packages/com.cre.analytics/Editor/AnalyticsSettingsProvider.cs`

## Acceptance Criteria

- [ ] `AnalyticsConfig` is a `ScriptableObject` with `public string baseUrl` and `public string projectId` fields, decorated with `[CreateAssetMenu(menuName = "CRE Analytics/Config")]`, in namespace `CRE.Analytics`
- [ ] `AnalyticsSecrets` is a `ScriptableObject` with `public string projectKey` field, decorated with `[CreateAssetMenu(menuName = "CRE Analytics/Secrets")]`, in namespace `CRE.Analytics`
- [ ] A `[SettingsProvider]` static factory in `AnalyticsSettingsProvider.cs` registers a panel at `"Project/CRE Analytics"` with `SettingsScope.Project`
- [ ] The panel loads `AnalyticsConfig` from `Resources.Load<AnalyticsConfig>("CREAnalyticsConfig")` and `AnalyticsSecrets` from `Resources.Load<AnalyticsSecrets>("CREAnalyticsSecrets")`
- [ ] If either asset is missing, the panel shows a "Create" button that creates it at the correct `Assets/Resources/` path using `AssetDatabase.CreateAsset`; creates the `Assets/Resources/` folder first if it doesn't exist
- [ ] The panel shows two clearly labeled sections: **"Shared Configuration (commit to git)"** containing Project ID and Base URL fields, and **"Secret Configuration"** containing the Project Key field
- [ ] In the Secret Configuration section, a persistent `EditorGUILayout.HelpBox` with `MessageType.Warning` reads: `Add Assets/Resources/CREAnalyticsSecrets.asset to your .gitignore — it contains your project key`
- [ ] Editing any field immediately calls `EditorUtility.SetDirty(asset)` followed by `AssetDatabase.SaveAssets()` — no explicit Save button is needed
- [ ] Both ScriptableObject classes are in the `CRE.Analytics` namespace

## Relevant Data

`Resources.Load<T>(path)` loads from any `Resources/` folder under `Assets/`. The correct load paths are `"CREAnalyticsConfig"` and `"CREAnalyticsSecrets"` (no extension, no `Assets/Resources/` prefix).

**SettingsProvider registration pattern:**
```csharp
[SettingsProvider]
public static SettingsProvider CreateAnalyticsSettingsProvider()
{
    return new SettingsProvider("Project/CRE Analytics", SettingsScope.Project)
    {
        label = "CRE Analytics",
        guiHandler = (searchContext) => { /* draw IMGUI here */ }
    };
}
```

**Creating an asset at a path:**
```csharp
if (!AssetDatabase.IsValidFolder("Assets/Resources"))
    AssetDatabase.CreateFolder("Assets", "Resources");
var asset = ScriptableObject.CreateInstance<AnalyticsConfig>();
AssetDatabase.CreateAsset(asset, "Assets/Resources/CREAnalyticsConfig.asset");
AssetDatabase.SaveAssets();
```

**Manual step required:** After Windsurf creates these files, open Unity to compile. Then open `Edit > Project Settings > CRE Analytics`, fill in the values, and add `Assets/Resources/CREAnalyticsSecrets.asset` to the project's `.gitignore`.
