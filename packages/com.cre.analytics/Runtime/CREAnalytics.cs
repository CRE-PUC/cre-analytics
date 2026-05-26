using UnityEngine;

namespace CRE.Analytics
{
    public static class CREAnalytics
    {
        public static void StartSession()
        {
            if (AnalyticsManager.Instance == null || !AnalyticsManager.Instance.IsInitialized)
            {
                Debug.LogWarning("[CRE Analytics] SDK is not initialized. Call ignored.");
                return;
            }

            AnalyticsManager.Instance.StartSession();
        }

        public static void Set(string columnName, object value)
        {
            if (AnalyticsManager.Instance == null || !AnalyticsManager.Instance.IsInitialized)
            {
                Debug.LogWarning("[CRE Analytics] SDK is not initialized. Call ignored.");
                return;
            }

            AnalyticsManager.Instance.SetValue(columnName, value);
        }

        public static void Increment(string columnName, int amount = 1)
        {
            if (AnalyticsManager.Instance == null || !AnalyticsManager.Instance.IsInitialized)
            {
                Debug.LogWarning("[CRE Analytics] SDK is not initialized. Call ignored.");
                return;
            }

            AnalyticsManager.Instance.Increment(columnName, amount);
        }

        public static void EndSession()
        {
            if (AnalyticsManager.Instance == null || !AnalyticsManager.Instance.IsInitialized)
            {
                Debug.LogWarning("[CRE Analytics] SDK is not initialized. Call ignored.");
                return;
            }

            AnalyticsManager.Instance.EndSession();
        }
    }
}
