---
id: TASK-021.1
title: Schema editor — recursive nested hierarchy, reorder, duplicate, rename-move
status: done
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

The current `BakeAnalyticsWindow.cs` (completed in TASK-021) only renders one level of nesting. A column like `Tutorial/Cliques/Botao A` shows "Cliques/Botao A" as a flat text field inside "Tutorial" instead of "Cliques" being its own nested foldout. Fix this by making the rendering fully recursive, and add the quality-of-life operations that become naturally expressible once the tree model is in place.

The underlying data model does **not change** — `schema.fields` remains a flat `List<AnalyticsField>` with full column paths as `columnName`. The tree is a derived rendering view, rebuilt from the flat list on every `OnGUI()` call.

Do not touch the Bake button logic (TASK-022).

## Files to Modify

- `packages/com.cre.analytics/Editor/BakeAnalyticsWindow.cs`

## Core concept: SchemaNode tree

Build a `private class SchemaNode` to represent the tree derived from `schema.fields`:

```csharp
private class SchemaNode
{
    public string Name;                           // single path segment
    public AnalyticsField Field;                  // non-null only for leaf nodes
    public List<SchemaNode> Children = new();     // ordered (preserves schema.fields order)
}
```

Rebuild this tree on every `OnGUI()` call (or cache and invalidate on dirty). Building algorithm:
- For each field in `schema.fields` (in order), split `columnName` on `/`
- Walk/create intermediate nodes for all but the last segment
- Attach the `AnalyticsField` to the leaf node
- The root node holds the top-level groups

Preserve insertion order: use `List<SchemaNode>` for `Children`, find-or-create by name when building.

## Acceptance Criteria

### Recursive rendering

- [ ] The window renders groups to arbitrary depth: `Tutorial/Cliques/Botao A` shows as foldout "Tutorial" → foldout "Cliques" → field row "Botao A"
- [ ] Each intermediate node (group) is a foldout with its single-segment name as label
- [ ] Leaf nodes (fields) are rendered as field rows (text field + type dropdown + action buttons), same visual style as TASK-021
- [ ] The full column path is shown in grey below each leaf row (unchanged from TASK-021)
- [ ] Indentation increases with nesting depth via `EditorGUI.indentLevel`
- [ ] Foldout open/close state is persisted in `groupFoldouts` dictionary, keyed by full path prefix (e.g., `"Tutorial/Cliques"` not just `"Cliques"`)

### Context-aware add buttons

- [ ] Each group node (non-leaf) shows two buttons at the bottom of its content area when expanded:
  - `"+ Add Field"` — appends a new `AnalyticsField` with `columnName = "{groupFullPath}/NewField"` to `schema.fields`
  - `"+ Add Sub-Group"` — shows an inline text input (same pattern as current "Add Group"), then appends a placeholder field `"{groupFullPath}/{newSubGroupName}/NewField"` when confirmed
- [ ] The global `"+ Add Group"` button at the bottom of the window adds a top-level group (unchanged from TASK-021)

### Editing leaf name

- [ ] The text field for a leaf node contains only the **last segment** of the column name (e.g., `"Botao A"` for `Tutorial/Cliques/Botao A`)
- [ ] Editing renames only that last segment — the path up to (not including) the last segment remains unchanged
- [ ] e.g., rename `"Botao A"` → `"Botao C"` updates `field.columnName` from `"Tutorial/Cliques/Botao A"` to `"Tutorial/Cliques/Botao C"`

### Reorder within level

- [ ] Each leaf field row has `▲` and `▼` buttons (small, after the `×` delete button)
- [ ] `▲` swaps this field with the previous sibling **at the same nesting level** in `schema.fields`
- [ ] `▼` swaps this field with the next sibling at the same nesting level
- [ ] "Same nesting level" = same parent path prefix. Do not move a field past a field belonging to a different group at the same depth.
- [ ] ▲ is disabled (greyed out) if the field is first among its siblings; ▼ if last
- [ ] Each group node header also has `▲` and `▼` buttons that move the **entire group block** (all fields sharing that prefix) past the next/previous sibling group block at the same depth

### Rename group (= move)

- [ ] Each group node header shows a small `✎` (or "Rename") button
- [ ] Clicking it replaces the group label with an inline text field pre-filled with the current last segment of the group path
- [ ] Confirming the rename updates the prefix of **all** `field.columnName` strings in `schema.fields` that start with the old full group path (e.g., renaming the `"Cliques"` node under `"Tutorial"` from `"Cliques"` to `"Interacoes"` replaces `"Tutorial/Cliques/"` prefix with `"Tutorial/Interacoes/"` in every affected field)
- [ ] Rename is also how a developer "moves" a group: renaming `"Tutorial/Cliques"` to `"Other/Cliques"` moves the entire sub-tree under a different top-level group
- [ ] After rename, call `EditorUtility.SetDirty(schema)`

### Duplicate group

- [ ] Each group node header shows a `⧉` (or "Duplicate") button
- [ ] Clicking shows an inline text input asking for the new group name (at the same depth)
- [ ] Confirming copies all `AnalyticsField` entries whose `columnName` starts with the source group's full path, replacing the source prefix with `{parentPath}/{newName}`, and appends them to `schema.fields`
- [ ] After duplication, call `EditorUtility.SetDirty(schema)`

### Validation (unchanged from TASK-021)

- [ ] All existing inline validation still works: reserved `Session/` names, duplicates, empty names
- [ ] Validation checks the full `columnName` (not just the display segment)

### No drag-and-drop

Drag-and-drop is out of scope. The rename operation covers the move use case.

## Relevant Data

**Current `BakeAnalyticsWindow.cs` key methods to replace/extend:**
- `GetGroupedFields()` — replace with `BuildTree()` that returns a root `SchemaNode`
- `RenderGroup(groupName, fields)` — replace with `RenderNode(SchemaNode node, string fullPath)`
- `GetGroupName()` and `GetDisplayName()` — no longer needed as standalone methods once tree is used

**Reorder implementation pattern** (for field siblings):
```csharp
// Find indices of this field and its target swap field in schema.fields
// Both must share the same parent prefix
int indexA = schema.fields.IndexOf(fieldToMove);
int indexB = schema.fields.IndexOf(siblingToSwapWith);
(schema.fields[indexA], schema.fields[indexB]) = (schema.fields[indexB], schema.fields[indexA]);
EditorUtility.SetDirty(schema);
```

For group reorder: find the contiguous block of fields sharing the group prefix and move the entire block.

**Foldout key pattern:**
Use the full path as key: `"Tutorial"`, `"Tutorial/Cliques"`. This avoids collision when two groups at different depths share the same segment name.

**Manual step required:** After Windsurf completes, open Unity to compile and verify recursive groups render correctly. Test: create a schema with `A/B/C/Field1`, `A/B/Field2`, `A/Field3` and confirm three nesting levels are shown.

---

## Implementation Log

### Additional Enhancement (Post-Completion)

**Issue:** Field reordering was initially implemented to only swap with sibling fields at the same parent level. This prevented fields from moving past entire group blocks.

**Example Problem:**
```
Tutorial D/NewField
Tutorial D/Cliques/Botão A
Tutorial D/Cliques/Botão B
Tutorial D/Começou em
```
Pressing ▲ on "Começou em" would not move it past the "Cliques" group.

**Solution:** Enhanced `MoveFieldUp()` and `MoveFieldDown()` to treat groups as atomic blocks:
- Added `GetGroupAtIndex()` helper method to detect if the adjacent item is part of a group
- When moving up/down, if the adjacent item belongs to a different parent (indicating a group), the field jumps over the entire group block
- Fields at the same level still swap normally

**Result:** Fields can now reorder freely, jumping over nested group structures as expected.

**Files Modified:**
- `packages/com.cre.analytics/Editor/BakeAnalyticsWindow.cs` - Updated `MoveFieldUp()`, `MoveFieldDown()`, added `GetGroupAtIndex()`
