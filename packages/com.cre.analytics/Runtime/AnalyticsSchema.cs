using System.Collections.Generic;
using UnityEngine;

namespace CRE.Analytics
{
    [CreateAssetMenu(fileName = "CREAnalyticsSchema", menuName = "CRE Analytics/Schema")]
    public class AnalyticsSchema : ScriptableObject
    {
        public string schemaVersion = "0.1.0";
        public List<AnalyticsField> fields = new();
    }

    [System.Serializable]
    public class AnalyticsField
    {
        public string columnName;
        public AnalyticsFieldType type;
        public string description;
    }

    public enum AnalyticsFieldType
    {
        String,
        Int,
        Float,
        Bool,
        Timestamp
    }
}
