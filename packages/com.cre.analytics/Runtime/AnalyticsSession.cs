using System.Collections.Generic;

namespace CRE.Analytics
{
    public class AnalyticsSession
    {
        private readonly AnalyticsSchema _schema;
        private readonly Dictionary<string, object> _values = new();

        public AnalyticsSession(AnalyticsSchema schema)
        {
            _schema = schema;
        }

        public void SetValue(string columnName, object value)
        {
            _values[columnName] = value;
        }

        // TODO: build the SessionData payload for submission
    }
}
