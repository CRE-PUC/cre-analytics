---
id: TASK-021
title: Redesign Bake Analytics window — grouped schema editor UI
status: done
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

Redesign `BakeAnalyticsWindow.cs` to replace the current empty stub with a functional grouped schema editor. Fields in `AnalyticsSchema.fields` are displayed grouped by the first segment of their `columnName` (the part before the first `/`). Fields with no `/` go in an "Other" group shown first.

This task covers only the editor UI — do not add bake logic. The "Bake Analytics" button should exist in the window but remain a stub that logs `[CRE Analytics] Bake not yet implemented`. Bake logic and code generation are added in TASK-022.

## Files to Modify

- `packages/com.cre.analytics/Editor/BakeAnalyticsWindow.cs`

## Acceptance Criteria

- [ ] Window accessible via `CRE Analytics > Bake Analytics` menu item (keep existing `[MenuItem]`)
- [ ] Window loads the `AnalyticsSchema` asset from the project on open. Use `AssetDatabase.FindAssets("t:AnalyticsSchema")` to find it. If none found, show a message: "No AnalyticsSchema found in the project. Create one via Assets > Create > CRE Analytics > Schema."
- [ ] Schema version string is displayed read-only at the top of the window (e.g., `Version: 1.0.0`)
- [ ] A "Bake Analytics" button sits at the top of the window; clicking it logs `Debug.Log("[CRE Analytics] Bake not yet implemented")` (replaced in TASK-022)
- [ ] Fields are grouped by first path segment. Grouping logic: `"Tutorial/Steps"` → group `"Tutorial"`, display name `"Steps"`. `"Score"` → group `"Other"`, display name `"Score"`
- [ ] Each group renders as a labeled foldout with the group name as header
- [ ] Each field row within a group shows:
  - Text field for the short name (display name without group prefix) — editable; editing updates `field.columnName` to `"GroupName/" + newShortName` (or just `newShortName` for Other)
  - Dropdown for `AnalyticsFieldType` — editable
  - Small `×` button that removes the field from `schema.fields`
  - Below the row, in small/grey style: the full column path (e.g., `Tutorial/Steps`)
- [ ] An "+ Add Field" button at the bottom of each group appends a new `AnalyticsField` with `columnName = "GroupName/NewField"` (or `"NewField"` for Other) and default type `String`
- [ ] An "+ Add Group" button below all groups: when clicked, shows an inline text field + confirm button to name the new group; confirming creates a placeholder field `"NewGroupName/NewField"` so the group appears
- [ ] Inline validation per row (shown as a small red label below the full path):
  - Empty short name → `"Field name is required"`
  - Column name starts with `Session/` (case-insensitive) → `"Reserved — managed by SDK"`
  - Duplicate `columnName` anywhere in schema → `"Duplicate column name"`
- [ ] A grey notice at the very bottom of the window: `The "Session/" group is reserved and auto-managed by the SDK`
- [ ] Every schema mutation (add, remove, rename, type change) immediately calls `EditorUtility.SetDirty(schema)` so changes survive window close without explicit save
- [ ] The window scrolls if content overflows (wrap content in `EditorGUILayout.BeginScrollView`)

## Relevant Data

**`AnalyticsSchema` (current, `packages/com.cre.analytics/Runtime/AnalyticsSchema.cs`):**
```csharp
public class AnalyticsSchema : ScriptableObject
{
    public string schemaVersion = "0.1.0";
    public List<AnalyticsField> fields = new();
}

public class AnalyticsField
{
    public string columnName;   // full path e.g. "Tutorial/Steps"
    public AnalyticsFieldType type;
    public string description;  // not shown in this UI
}

public enum AnalyticsFieldType { String, Int, Float, Bool, Timestamp }
```

**Grouping helper logic (implement inline or as a private method):**
```csharp
// Given "Tutorial/Steps/Completed" → group = "Tutorial", displayName = "Steps/Completed"
// Given "Score"                     → group = "Other",    displayName = "Score"
int slash = columnName.IndexOf('/');
string group = slash >= 0 ? columnName[..slash] : "Other";
string displayName = slash >= 0 ? columnName[(slash + 1)..] : columnName;
```

**Manual step required:** After Windsurf completes, open Unity to compile, then open `CRE Analytics > Bake Analytics` and verify the grouped UI renders correctly with the test schema.
