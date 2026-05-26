using System;
using UnityEngine;

namespace CRE.Analytics
{
    internal class AnalyticsManager : MonoBehaviour
    {
        internal static AnalyticsManager Instance { get; private set; }
        
        internal static event Action<string> OnSessionStarted;
        internal static event Action OnSessionEnded;
        internal static event Action<string, object> OnValueSet;
        
        public bool IsInitialized { get; private set; }
        internal AnalyticsConfig Config { get; private set; }
        internal AnalyticsSecrets Secrets { get; private set; }
        internal AnalyticsSchema Schema { get; private set; }

        private AnalyticsSession _currentSession;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        static void Bootstrap()
        {
            if (Instance != null) return;

            GameObject go = new GameObject("[CRE Analytics]");
            go.AddComponent<AnalyticsManager>();
            DontDestroyOnLoad(go);
        }

        void Awake()
        {
            Instance = this;
            gameObject.AddComponent<SessionSender>();
            LoadConfig();

            if (Config != null && Config.enableRecording)
            {
                gameObject.AddComponent<SessionRecorder>();
                if (Config.showAnalyticsOverlay)
                {
                    gameObject.AddComponent<RecorderOverlay>();
                }
            }
        }

        void OnDestroy()
        {
            Instance = null;
        }

        void LoadConfig()
        {
            Config = Resources.Load<AnalyticsConfig>("CREAnalyticsConfig");
            if (Config == null)
            {
                Debug.LogError("[CRE Analytics] AnalyticsConfig not found in Resources — analytics disabled");
                IsInitialized = false;
                return;
            }

            Secrets = Resources.Load<AnalyticsSecrets>("CREAnalyticsSecrets");
            if (Secrets == null)
            {
                Debug.LogWarning("[CRE Analytics] AnalyticsSecrets not found in Resources — session submission will fail");
            }

            Schema = Resources.Load<AnalyticsSchema>("CREAnalyticsSchema");
            if (Schema == null)
            {
                Debug.LogWarning("[CRE Analytics] AnalyticsSchema not found in Resources — Set() calls will be discarded");
            }

            IsInitialized = true;
        }

        internal void StartSession()
        {
            if (_currentSession != null && _currentSession.IsActive)
            {
                Debug.LogWarning("[CRE Analytics] StartSession called while a session is already active — replacing.");
            }

            string projectKey = Secrets?.projectKey ?? "";
            _currentSession = new AnalyticsSession(Schema, Config.projectId, Schema?.schemaVersion ?? "", projectKey);
            OnSessionStarted?.Invoke(_currentSession.SessionId);
        }

        internal void SetValue(string columnName, object value)
        {
            if (_currentSession == null)
            {
                Debug.LogWarning("[CRE Analytics] Set called with no active session — ignored.");
                return;
            }

            _currentSession.Set(columnName, value);
            OnValueSet?.Invoke(columnName, value);
        }

        internal void Increment(string columnName, int amount = 1)
        {
            if (_currentSession == null)
            {
                Debug.LogWarning("[CRE Analytics] Increment called with no active session — ignored.");
                return;
            }

            if (_currentSession.Increment(columnName, amount))
            {
                var newValue = _currentSession.GetValue(columnName);
                if (newValue != null)
                    OnValueSet?.Invoke(columnName, newValue);
            }
        }

        internal void EndSession()
        {
            if (_currentSession == null)
            {
                Debug.LogWarning("[CRE Analytics] EndSession called with no active session — ignored.");
                return;
            }

            if (!_currentSession.IsActive)
            {
                Debug.LogWarning("[CRE Analytics] EndSession called but session failed to initialize — ignoring.");
                _currentSession = null;
                return;
            }

            _currentSession.Complete();
            OnSessionEnded?.Invoke();
            SessionPayload payload = _currentSession.BuildPayload();
            GetComponent<SessionSender>().Send(payload, Config.baseUrl);
            _currentSession = null;
        }
    }
}
