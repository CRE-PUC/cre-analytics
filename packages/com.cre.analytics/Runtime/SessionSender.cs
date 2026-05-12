using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace CRE.Analytics
{
    public class SessionSender : MonoBehaviour
    {
        public void Send(SessionPayload payload, string baseUrl)
        {
            StartCoroutine(PostSession(payload, baseUrl));
        }

        private IEnumerator PostSession(SessionPayload payload, string baseUrl)
        {
            string json = SerializePayload(payload);
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            string url = $"{baseUrl.TrimEnd('/')}/sessions";

            using var request = new UnityWebRequest(url, "POST");
            request.uploadHandler = new UploadHandlerRaw(bytes);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.ConnectionError)
            {
                Debug.LogError("[CRE Analytics] Session submission failed — network error.");
            }
            else if (request.responseCode >= 200 && request.responseCode < 300)
            {
                Debug.Log($"[CRE Analytics] Session {payload.sessionData.metaData.sessionId} submitted.");
            }
            else
            {
                Debug.LogError($"[CRE Analytics] Session submission failed — HTTP {request.responseCode}: {request.downloadHandler.text}");
            }
        }

        private string SerializePayload(SessionPayload payload)
        {
            var sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"projectKey\":\"{EscapeJson(payload.projectKey)}\",");
            sb.Append("\"sessionData\":{");
            sb.Append("\"metaData\":{");
            sb.Append($"\"projectId\":\"{EscapeJson(payload.sessionData.metaData.projectId)}\",");
            sb.Append($"\"schemaVersion\":\"{EscapeJson(payload.sessionData.metaData.schemaVersion)}\",");
            sb.Append($"\"sessionId\":\"{EscapeJson(payload.sessionData.metaData.sessionId)}\",");
            sb.Append($"\"platform\":\"{EscapeJson(payload.sessionData.metaData.platform)}\",");
            sb.Append($"\"startedAt\":\"{EscapeJson(payload.sessionData.metaData.startedAt)}\",");
            sb.Append($"\"endedAt\":\"{EscapeJson(payload.sessionData.metaData.endedAt)}\"");
            sb.Append("},");
            sb.Append("\"data\":[");
            for (int i = 0; i < payload.sessionData.data.Count; i++)
            {
                if (i > 0) sb.Append(",");
                var field = payload.sessionData.data[i];
                sb.Append("{");
                sb.Append($"\"columnName\":\"{EscapeJson(field.columnName)}\",");
                sb.Append($"\"value\":{SerializeValue(field.value)}");
                sb.Append("}");
            }
            sb.Append("]");
            sb.Append("}");
            sb.Append("}");
            return sb.ToString();
        }

        private string SerializeValue(object value)
        {
            if (value == null)
            {
                return "null";
            }
            else if (value is string str)
            {
                return $"\"{EscapeJson(str)}\"";
            }
            else if (value is bool b)
            {
                return b ? "true" : "false";
            }
            else if (value is int || value is long || value is short || value is byte)
            {
                return value.ToString();
            }
            else if (value is float f)
            {
                return f.ToString(System.Globalization.CultureInfo.InvariantCulture);
            }
            else if (value is double d)
            {
                return d.ToString(System.Globalization.CultureInfo.InvariantCulture);
            }
            else
            {
                return $"\"{EscapeJson(value.ToString())}\"";
            }
        }

        private string EscapeJson(string str)
        {
            if (str == null) return "";
            return str.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
        }
    }
}
