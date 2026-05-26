using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace CRE.Analytics
{
    internal class RecorderOverlay : MonoBehaviour
    {
        private GameObject _overlayCanvas;
        private RectTransform _logParent;
        private readonly List<GameObject> _activeEntries = new();

        void Awake()
        {
            AnalyticsManager.OnSessionStarted += HandleSessionStarted;
            AnalyticsManager.OnSessionEnded += HandleSessionEnded;
            AnalyticsManager.OnValueSet += HandleValueSet;
        }

        void OnDestroy()
        {
            AnalyticsManager.OnSessionStarted -= HandleSessionStarted;
            AnalyticsManager.OnSessionEnded -= HandleSessionEnded;
            AnalyticsManager.OnValueSet -= HandleValueSet;
        }

        private void HandleSessionStarted(string sessionId)
        {
            Camera recorderCamera = FindRecorderCamera();
            if (recorderCamera == null)
            {
                Debug.LogWarning("[CRE Analytics] RecorderOverlay could not find [CRE Recorder Camera] — overlay disabled for this session.");
                return;
            }

            CreateOverlayCanvas(recorderCamera);
        }

        private void HandleSessionEnded()
        {
            if (_overlayCanvas != null)
            {
                Destroy(_overlayCanvas);
                _overlayCanvas = null;
            }

            _logParent = null;
            _activeEntries.Clear();
        }

        private void HandleValueSet(string columnName, object value)
        {
            if (_logParent == null) return;

            if (_activeEntries.Count >= 4)
            {
                GameObject oldest = _activeEntries[0];
                _activeEntries.RemoveAt(0);
                Destroy(oldest);
            }

            string displayName = GetLastPathSegment(columnName);
            string displayValue = FormatValue(value);
            string displayText = $"{displayName}: {displayValue}";

            GameObject entryGO = new GameObject("[CRE Overlay Entry]");
            entryGO.transform.SetParent(_logParent, false);

            Text text = entryGO.AddComponent<Text>();
            text.text = displayText;
            text.fontSize = 22;
            text.color = new Color(1f, 1f, 0.3f, 1f);
            text.fontStyle = FontStyle.Bold;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            ContentSizeFitter fitter = entryGO.AddComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;

            _activeEntries.Add(entryGO);

            StartCoroutine(FadeAndDestroy(text, entryGO));
        }

        private Camera FindRecorderCamera()
        {
            GameObject go = GameObject.Find("[CRE Recorder Camera]");
            return go != null ? go.GetComponent<Camera>() : null;
        }

        private void CreateOverlayCanvas(Camera recorderCamera)
        {
            var canvasGO = new GameObject("[CRE Overlay Canvas]");
            DontDestroyOnLoad(canvasGO);

            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = recorderCamera;
            canvas.planeDistance = 1f;
            canvas.sortingOrder = 100;

            var scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var logGO = new GameObject("[CRE Overlay Log]");
            logGO.transform.SetParent(canvasGO.transform, false);
            var logRect = logGO.AddComponent<RectTransform>();
            logRect.anchorMin = new Vector2(0, 0);
            logRect.anchorMax = new Vector2(0, 0);
            logRect.pivot = new Vector2(0, 0);
            logRect.anchoredPosition = new Vector2(16, 16);
            logRect.sizeDelta = new Vector2(700, 300);
            var vlg = logGO.AddComponent<VerticalLayoutGroup>();
            vlg.childAlignment = TextAnchor.LowerLeft;
            vlg.spacing = 2;
            vlg.childForceExpandWidth = false;
            vlg.childForceExpandHeight = false;

            _logParent = logRect;
            _overlayCanvas = canvasGO;
        }

        private string GetLastPathSegment(string columnName)
        {
            int lastSlash = columnName.LastIndexOf('/');
            return lastSlash >= 0 ? columnName.Substring(lastSlash + 1) : columnName;
        }

        private string FormatValue(object value)
        {
            if (value == null)
                return "—";

            if (value is string str)
            {
                if (str.Length > 30)
                    return str.Substring(0, 30) + "…";
                return str;
            }

            if (value is float f)
                return f.ToString("F2");

            if (value is double d)
                return d.ToString("F2");

            return value.ToString();
        }

        private IEnumerator FadeAndDestroy(Text text, GameObject entryGO)
        {
            float elapsed = 0f;
            float duration = 2f;
            Color originalColor = text.color;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float alpha = 1f - (elapsed / duration);
                text.color = new Color(originalColor.r, originalColor.g, originalColor.b, alpha);
                yield return null;
            }

            _activeEntries.Remove(entryGO);
            Destroy(entryGO);
        }
    }
}
