using System;
using System.Collections;
using System.IO;
using UnityEngine;

namespace CRE.Analytics
{
    public class SessionRecorder : MonoBehaviour
    {
        private Camera _recorderCamera;
        private RenderTexture _renderTexture;
        private Coroutine _captureCoroutine;
        private string _sessionId;
        private int _frameCount;
        private string _sessionFolder;
        private string _aviFilePath;
        private MjpegAviWriter _aviWriter;

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
            StartRecording(sessionId);
        }

        private void HandleSessionEnded() => StopRecording();

        public void StartRecording(string sessionId)
        {
            _sessionId = sessionId;
            _frameCount = 0;

            _sessionFolder = Path.Combine(Application.persistentDataPath, "CRERecordings", sessionId);
            Directory.CreateDirectory(_sessionFolder);
            _aviFilePath = Path.Combine(_sessionFolder, "recording.avi");

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

            float clampedScale = Mathf.Clamp(AnalyticsManager.Instance.Config.captureResolutionScale, 0.1f, 1.0f);
            int w = Mathf.Clamp(Mathf.RoundToInt(Screen.width * clampedScale), 1, Screen.width);
            int h = Mathf.Clamp(Mathf.RoundToInt(Screen.height * clampedScale), 1, Screen.height);
            _renderTexture = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32);
            _recorderCamera.targetTexture = _renderTexture;

            int clampedQuality = Mathf.Clamp(AnalyticsManager.Instance.Config.captureJpegQuality, 1, 100);
            _aviWriter = new MjpegAviWriter();
            _aviWriter.Open(_aviFilePath, w, h, AnalyticsManager.Instance.Config.captureFrameRate);

            _captureCoroutine = StartCoroutine(CaptureLoop());
            Debug.Log($"[CRE Recorder] Recording started — {_aviFilePath}");
        }

        public void StopRecording()
        {
            if (_captureCoroutine == null) return;

            StopCoroutine(_captureCoroutine);
            _captureCoroutine = null;

            _aviWriter.Close();

            Destroy(_recorderCamera.gameObject);
            _recorderCamera = null;

            _renderTexture.Release();
            Destroy(_renderTexture);
            _renderTexture = null;

            Debug.Log($"[CRE Recorder] Recording saved — {_aviFilePath} ({_frameCount} frames)");
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
                    nextCapture += 1f / Mathf.Max(1, AnalyticsManager.Instance.Config.captureFrameRate);
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

            int clampedQuality = Mathf.Clamp(AnalyticsManager.Instance.Config.captureJpegQuality, 1, 100);
            byte[] bytes = tex.EncodeToJPG(clampedQuality);
            Destroy(tex);

            _aviWriter.WriteFrame(bytes);
            _frameCount++;
        }
    }
}
