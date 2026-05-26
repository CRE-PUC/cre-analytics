using UnityEngine;

namespace CRE.Analytics
{
    [CreateAssetMenu(menuName = "CRE Analytics/Config")]
    public class AnalyticsConfig : ScriptableObject
    {
        public string baseUrl;
        public string projectId;

        [Header("Recording")]
        public bool enableRecording = false;
        public int captureFrameRate = 15;
        [Range(0.1f, 1f)]
        public float captureResolutionScale = 0.5f;
        [Range(1, 100)]
        public int captureJpegQuality = 75;
        public bool showAnalyticsOverlay = true;
    }
}
