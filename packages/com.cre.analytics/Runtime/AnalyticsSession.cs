using System;
using System.Collections.Generic;
using UnityEngine;

namespace CRE.Analytics
{
    public class AnalyticsSession
    {
        private readonly AnalyticsSchema _schema;
        private readonly string _projectId;
        private readonly string _schemaVersion;
        private readonly string _projectKey;
        private readonly Dictionary<string, object> _values = new();
        private DateTime _startedAt;

        public string SessionId { get; private set; }
        public bool IsActive { get; private set; }

        public AnalyticsSession(AnalyticsSchema schema, string projectId, string schemaVersion, string projectKey)
        {
            _schema = schema;
            _projectId = projectId;
            _schemaVersion = schemaVersion;
            _projectKey = projectKey;
            Initialize();
        }

        private void Initialize()
        {
            if (_schema == null)
            {
                Debug.LogError("[CRE Analytics] Schema is null — session cannot be initialized");
                IsActive = false;
                return;
            }

            _startedAt = DateTime.UtcNow;
            SessionId = Guid.NewGuid().ToString();

            foreach (var field in _schema.fields)
            {
                switch (field.type)
                {
                    case AnalyticsFieldType.Int:
                        _values[field.columnName] = 0;
                        break;
                    case AnalyticsFieldType.Float:
                        _values[field.columnName] = 0f;
                        break;
                    case AnalyticsFieldType.Bool:
                        _values[field.columnName] = false;
                        break;
                    case AnalyticsFieldType.String:
                        _values[field.columnName] = "";
                        break;
                    case AnalyticsFieldType.Timestamp:
                        _values[field.columnName] = null;
                        break;
                }
            }

            _values["Session/StartedAt"] = _startedAt.ToString("o");
            _values["Session/EndedAt"] = "";
            _values["Session/Duration"] = 0f;
            _values["Session/Platform"] = Application.platform.ToString();
            _values["Session/DeviceModel"] = SystemInfo.deviceModel;

            IsActive = true;
        }

        public void Set(string columnName, object value)
        {
            if (!_values.ContainsKey(columnName))
            {
                Debug.LogWarning($"[CRE Analytics] Field '{columnName}' not in schema — discarded. Did you rebake?");
                return;
            }

            if (columnName.StartsWith("Session/", StringComparison.OrdinalIgnoreCase))
            {
                Debug.LogWarning("[CRE Analytics] Session/ fields are managed by the SDK and cannot be set manually.");
                return;
            }

            _values[columnName] = value;
        }

        public void Complete()
        {
            _values["Session/EndedAt"] = DateTime.UtcNow.ToString("o");
            _values["Session/Duration"] = (float)(DateTime.UtcNow - _startedAt).TotalSeconds;
            IsActive = false;
        }

        public SessionPayload BuildPayload()
        {
            var metaData = new SessionMetaData
            {
                projectId = _projectId,
                schemaVersion = _schemaVersion,
                sessionId = SessionId,
                platform = Application.platform.ToString(),
                startedAt = _values["Session/StartedAt"] as string,
                endedAt = _values["Session/EndedAt"] as string
            };

            var dataList = new List<SessionField>();
            foreach (var kvp in _values)
            {
                dataList.Add(new SessionField
                {
                    columnName = kvp.Key,
                    value = kvp.Value
                });
            }

            return new SessionPayload
            {
                projectKey = _projectKey,
                sessionData = new SessionData
                {
                    metaData = metaData,
                    data = dataList
                }
            };
        }
    }

    public class SessionPayload
    {
        public string projectKey;
        public SessionData sessionData;
    }

    public class SessionData
    {
        public SessionMetaData metaData;
        public List<SessionField> data;
    }

    public class SessionMetaData
    {
        public string projectId;
        public string schemaVersion;
        public string sessionId;
        public string platform;
        public string startedAt;
        public string endedAt;
    }

    public class SessionField
    {
        public string columnName;
        public object value;
    }
}
