using UnityEngine;

namespace CRE.Analytics
{
    internal class AnalyticsManager : MonoBehaviour
    {
        internal static AnalyticsManager Instance { get; private set; }
        
        public bool IsInitialized { get; private set; }
        internal AnalyticsConfig Config { get; private set; }
        internal AnalyticsSecrets Secrets { get; private set; }
        internal AnalyticsSchema Schema { get; private set; }

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
            LoadConfig();
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
            Debug.LogWarning("[CRE Analytics] Session logic not yet implemented");
        }

        internal void SetValue(string columnName, object value)
        {
            Debug.LogWarning("[CRE Analytics] Session logic not yet implemented");
        }

        internal void EndSession()
        {
            Debug.LogWarning("[CRE Analytics] Session logic not yet implemented");
        }
    }
}
