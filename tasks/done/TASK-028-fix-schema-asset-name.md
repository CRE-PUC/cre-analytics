---
id: TASK-028
title: Fix schema asset filename mismatch — rename asset and fix CreateAssetMenu
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

`AnalyticsManager.cs` loads the schema via:
```csharp
Schema = Resources.Load<AnalyticsSchema>("CREAnalyticsSchema");
```

But `AnalyticsSchema.cs` declares:
```csharp
[CreateAssetMenu(fileName = "AnalyticsSchema", menuName = "CRE Analytics/Schema")]
```

Unity uses `fileName` as the default asset name when the user creates one via the menu. The asset in `unity-project/Assets/Resources/` was created with that default, so it's named `AnalyticsSchema.asset` — but `Resources.Load` looks for `CREAnalyticsSchema`. The load silently returns null, causing all Set() calls to be discarded and the session to never initialize.

Two changes are needed:

**1. Fix `AnalyticsSchema.cs`** — update `fileName` so newly created assets get the correct name:
```csharp
[CreateAssetMenu(fileName = "CREAnalyticsSchema", menuName = "CRE Analytics/Schema")]
```

**2. Rename the existing asset files** in `unity-project/Assets/Resources/`:
- `AnalyticsSchema.asset` → `CREAnalyticsSchema.asset`
- `AnalyticsSchema.asset.meta` → `CREAnalyticsSchema.asset.meta`

Renaming both files together (keeping the `.meta` content unchanged) preserves the GUID, so Unity will recognize the asset after reimport. The meta file content must not be edited — only the filename changes.

> **Manual Step Required:** After Windsurf renames the files, the user must open Unity and let it reimport. The asset will reappear as `CREAnalyticsSchema` in the Resources folder.

## Acceptance Criteria

- [ ] `AnalyticsSchema.cs` `CreateAssetMenu` has `fileName = "CREAnalyticsSchema"`
- [ ] `unity-project/Assets/Resources/AnalyticsSchema.asset` is renamed to `CREAnalyticsSchema.asset`
- [ ] `unity-project/Assets/Resources/AnalyticsSchema.asset.meta` is renamed to `CREAnalyticsSchema.asset.meta`
- [ ] The content of the `.meta` file is unchanged (only filename, not contents)
- [ ] No other files reference the old filename `AnalyticsSchema` as a load path

## Relevant Data

**`packages/com.cre.analytics/Runtime/AnalyticsSchema.cs` (line 6, current):**
```csharp
[CreateAssetMenu(fileName = "AnalyticsSchema", menuName = "CRE Analytics/Schema")]
```

**`packages/com.cre.analytics/Runtime/AnalyticsManager.cs` (line 54, unchanged — already correct):**
```csharp
Schema = Resources.Load<AnalyticsSchema>("CREAnalyticsSchema");
```

Files to change:
- `packages/com.cre.analytics/Runtime/AnalyticsSchema.cs` — update `fileName`
- `unity-project/Assets/Resources/AnalyticsSchema.asset` — rename to `CREAnalyticsSchema.asset`
- `unity-project/Assets/Resources/AnalyticsSchema.asset.meta` — rename to `CREAnalyticsSchema.asset.meta`
