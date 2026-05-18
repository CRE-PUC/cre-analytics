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
