---
id: TASK-031
title: Create RecorderPrefabCreator editor tool and Runtime/Prefabs folder
status: pending
model: cheap
model-name: SWE-1.6
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

This task depends on TASK-030 being complete (SessionRecorder.cs must exist).

Create a Unity Editor script that generates the `CRESessionRecorder` prefab programmatically via a menu item. The prefab is the scene-placeable entry point for session recording — developers drop it into their scene and recording starts automatically when a session begins.

The prefab contains:
- A root `SessionRecorder` MonoBehaviour (from TASK-030)
- A child Canvas (Screen Space Overlay) for the session ID display
- A child Text inside the Canvas (legacy `UnityEngine.UI.Text`), anchored to the bottom-left, showing the current session ID

After the user runs the menu item, the prefab is saved inside the package at:
```
packages/com.cre.analytics/Runtime/Prefabs/CRESessionRecorder.prefab
```

The user must then commit the `.prefab` and generated `.meta` files so the prefab ships with the package for consumers.

---

## Files to Create

### 1. `packages/com.cre.analytics/Runtime/Prefabs/.gitkeep`

Create this folder and an empty `.gitkeep` file so the folder exists in git before Unity generates the `.meta`.

### 2. `packages/com.cre.analytics/Editor/RecorderPrefabCreator.cs`

```csharp
using UnityEngine;
using UnityEditor;
using UnityEngine.UI;

namespace CRE.Analytics.Editor
{
    internal static class RecorderPrefabCreator
    {
        [MenuItem("CRE Analytics/Create Session Recorder Prefab")]
        private static void CreatePrefab()
        {
            // Root
            var root = new GameObject("CRESessionRecorder");
            root.AddComponent<SessionRecorder>();

            // Canvas
            var canvasGO = new GameObject("RecordingOverlay");
            canvasGO.transform.SetParent(root.transform, false);
            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 999;
            canvasGO.AddComponent<CanvasScaler>();
            canvasGO.AddComponent<GraphicRaycaster>();

            // Session ID text
            var textGO = new GameObject("SessionIdText");
            textGO.transform.SetParent(canvasGO.transform, false);
            var text = textGO.AddComponent<Text>();
            text.text = string.Empty;
            text.fontSize = 18;
            text.color = new Color(1f, 1f, 1f, 0.85f);
            text.fontStyle = FontStyle.Bold;
            text.alignment = TextAnchor.LowerLeft;

            // Position text bottom-left with padding
            var rect = textGO.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.zero;
            rect.pivot = Vector2.zero;
            rect.anchoredPosition = new Vector2(12f, 12f);
            rect.sizeDelta = new Vector2(600f, 28f);

            // Wire the text reference into SessionRecorder
            var recorder = root.GetComponent<SessionRecorder>();
            var so = new SerializedObject(recorder);
            so.FindProperty("sessionIdDisplay").objectReferenceValue = text;
            so.ApplyModifiedPropertiesWithoutUndo();

            // Save prefab into the package
            const string prefabDir = "Packages/com.cre.analytics/Runtime/Prefabs";
            const string prefabPath = prefabDir + "/CRESessionRecorder.prefab";

            bool success;
            PrefabUtility.SaveAsPrefabAsset(root, prefabPath, out success);
            Object.DestroyImmediate(root);

            if (success)
            {
                AssetDatabase.Refresh();
                Debug.Log($"[CRE Analytics] CRESessionRecorder prefab created at {prefabPath}");
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
                EditorGUIUtility.PingObject(prefab);
            }
            else
            {
                Debug.LogError("[CRE Analytics] Failed to save CRESessionRecorder prefab.");
            }
        }
    }
}
```

### asmdef note

The Editor asmdef (`com.cre.analytics.Editor.asmdef`) currently references only `CRE.Analytics.Runtime`. Using `UnityEngine.UI` in editor code should resolve automatically (no override). If `UnityEngine.UI.Text` fails to compile in the Editor assembly, add `"Unity.ugui"` to the references array in `com.cre.analytics.Editor.asmdef`.

---

## Acceptance Criteria

- [ ] `Runtime/Prefabs/.gitkeep` exists (folder is in the repo)
- [ ] `Editor/RecorderPrefabCreator.cs` exists with the `CRE Analytics/Create Session Recorder Prefab` menu item
- [ ] After running the menu item in Unity, `CRESessionRecorder.prefab` appears at `Packages/com.cre.analytics/Runtime/Prefabs/` (i.e., `packages/com.cre.analytics/Runtime/Prefabs/CRESessionRecorder.prefab` on disk)
- [ ] The prefab has a `SessionRecorder` component on the root
- [ ] The prefab has a child Canvas (Screen Space Overlay) with a child `UnityEngine.UI.Text` component
- [ ] The `sessionIdDisplay` field on `SessionRecorder` references the Text component
- [ ] No compilation errors

## Manual Steps Required

1. After Windsurf completes this task, open Unity and let it compile.
2. Run `CRE Analytics > Create Session Recorder Prefab` from the Unity menu bar.
3. Verify the prefab appears in `packages/com.cre.analytics/Runtime/Prefabs/`.
4. Commit `CRESessionRecorder.prefab` and its `.meta` file (and the `Prefabs/` folder `.meta`) to git.
