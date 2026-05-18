using System;
using System.Collections;
using System.IO;
using UnityEngine;

namespace CRE.Analytics
{
    public class SessionRecorder : MonoBehaviour
    {
        [SerializeField] private bool recordOnSessionStart = true;
        [SerializeField] private int captureFrameRate = 30;
        [SerializeField] private UnityEngine.UI.Text sessionIdDisplay;

        private Camera _recorderCamera;
        private RenderTexture _renderTexture;
        private Coroutine _captureCoroutine;
        private string _sessionId;
        private int _frameIndex;
        private string _recordingPath;

        void Awake()
        {
            AnalyticsManager.OnSessionStarted += HandleSessionStarted;
            AnalyticsManager.OnSessionEnded += HandleSessionEnded;
        }

        void OnDestroy()
        {
            AnalyticsManager.OnSessionStarted -= HandleSessionStarted;
            AnalyticsManager.OnSessionEnded -= HandleSessionEnded;
            if (_captureCoroutine != null) StopRecording();
        }

        private void HandleSessionStarted(string sessionId)
        {
            if (recordOnSessionStart) StartRecording(sessionId);
        }

        private void HandleSessionEnded() => StopRecording();

        public void StartRecording(string sessionId)
        {
            _sessionId = sessionId;
            _frameIndex = 0;

            _recordingPath = Path.Combine(Application.persistentDataPath, "CRERecordings", sessionId);
            Directory.CreateDirectory(_recordingPath);

            var go = new GameObject("[CRE Recorder Camera]");
            DontDestroyOnLoad(go);
            _recorderCamera = go.AddComponent<Camera>();
            go.AddComponent<RecorderCameraFollower>();

            if (Camera.main != null)
            {
                _recorderCamera.fieldOfView = Camera.main.fieldOfView;
                _recorderCamera.nearClipPlane = Camera.main.nearClipPlane;
                _recorderCamera.farClipPlane = Camera.main.farClipPlane;
                _recorderCamera.backgroundColor = Camera.main.backgroundColor;
                _recorderCamera.clearFlags = Camera.main.clearFlags;
            }
            _recorderCamera.depth = -10;

            _renderTexture = new RenderTexture(Screen.width, Screen.height, 24, RenderTextureFormat.ARGB32);
            _recorderCamera.targetTexture = _renderTexture;

            if (sessionIdDisplay != null)
            {
                sessionIdDisplay.text = $"Session: {sessionId}";
            }

            _captureCoroutine = StartCoroutine(CaptureLoop());
            Debug.Log($"[CRE Recorder] Recording started — {_recordingPath}");
        }

        public void StopRecording()
        {
            if (_captureCoroutine == null) return;

            StopCoroutine(_captureCoroutine);
            _captureCoroutine = null;

            WriteManifest();

            Destroy(_recorderCamera.gameObject);
            _recorderCamera = null;

            _renderTexture.Release();
            Destroy(_renderTexture);
            _renderTexture = null;

            if (sessionIdDisplay != null)
            {
                sessionIdDisplay.text = string.Empty;
            }

            Debug.Log($"[CRE Recorder] Recording stopped — {_frameIndex} frames saved to {_recordingPath}");
        }

        private IEnumerator CaptureLoop()
        {
            var waitForEndOfFrame = new WaitForEndOfFrame();
            float nextCapture = Time.time;

            while (true)
            {
                yield return waitForEndOfFrame;

                if (Time.time >= nextCapture)
                {
                    CaptureFrame();
                    nextCapture += 1f / Mathf.Max(1, captureFrameRate);
                }
            }
        }

        private void CaptureFrame()
        {
            var prevActive = RenderTexture.active;
            RenderTexture.active = _renderTexture;

            var tex = new Texture2D(_renderTexture.width, _renderTexture.height, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, _renderTexture.width, _renderTexture.height), 0, 0);
            tex.Apply();

            RenderTexture.active = prevActive;

            byte[] bytes = tex.EncodeToPNG();
            Destroy(tex);

            string path = Path.Combine(_recordingPath, $"frame_{_frameIndex:D6}.png");
            File.WriteAllBytes(path, bytes);
            _frameIndex++;
        }

        private void WriteManifest()
        {
            string json = $@"{{
  ""sessionId"": ""{_sessionId}"",
  ""captureFrameRate"": {captureFrameRate},
  ""frameCount"": {_frameIndex},
  ""savedAt"": ""{DateTime.UtcNow:O}""
}}";
            string manifestPath = Path.Combine(_recordingPath, "recording_manifest.json");
            File.WriteAllText(manifestPath, json);
        }
    }
}
