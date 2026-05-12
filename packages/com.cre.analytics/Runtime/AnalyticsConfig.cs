using UnityEngine;

namespace CRE.Analytics
{
    [CreateAssetMenu(menuName = "CRE Analytics/Config")]
    public class AnalyticsConfig : ScriptableObject
    {
        public string baseUrl;
        public string projectId;
    }
}
