using UnityEngine;

namespace CRE.Analytics
{
    [CreateAssetMenu(menuName = "CRE Analytics/Secrets")]
    public class AnalyticsSecrets : ScriptableObject
    {
        public string projectKey;
    }
}
