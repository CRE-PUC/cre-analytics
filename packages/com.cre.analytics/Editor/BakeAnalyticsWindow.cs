using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace CRE.Analytics.Editor
{
    public class BakeAnalyticsWindow : EditorWindow
    {
        private class SchemaNode
        {
            public string Name;
            public AnalyticsField Field;
            public List<SchemaNode> Children = new();
        }

        private AnalyticsSchema schema;
        private Vector2 scrollPosition;
        private Dictionary<string, bool> groupFoldouts = new();
        private string newGroupName = "";
        private bool showNewGroupField = false;
        private Dictionary<string, string> renamingGroups = new();
        private Dictionary<string, string> duplicatingGroups = new();
        private Dictionary<string, bool> showAddSubGroupFields = new();

        [MenuItem("CRE Analytics/Bake Analytics")]
        public static void ShowWindow()
        {
            GetWindow<BakeAnalyticsWindow>("Bake Analytics");
        }

        private void OnEnable()
        {
            LoadSchema();
        }

        private void LoadSchema()
        {
            string[] guids = AssetDatabase.FindAssets("t:AnalyticsSchema");
            if (guids.Length == 0)
            {
                schema = null;
                return;
            }

            string path = AssetDatabase.GUIDToAssetPath(guids[0]);
            schema = AssetDatabase.LoadAssetAtPath<AnalyticsSchema>(path);
        }

        private void OnGUI()
        {
            if (schema == null)
            {
                EditorGUILayout.HelpBox(
                    "No AnalyticsSchema found in the project. Create one via Assets > Create > CRE Analytics > Schema.",
                    MessageType.Warning
                );
                return;
            }

            scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition);

            EditorGUILayout.LabelField("Version: " + schema.schemaVersion, EditorStyles.label);
            EditorGUILayout.Space();

            if (GUILayout.Button("Bake Analytics"))
            {
                BakeAnalytics();
            }

            EditorGUILayout.Space();

            var root = BuildTree();
            
            foreach (var child in root.Children)
            {
                RenderNode(child, "");
            }

            EditorGUILayout.Space();

            if (showNewGroupField)
            {
                EditorGUILayout.BeginHorizontal();
                EditorGUILayout.LabelField("New Group Name:", GUILayout.Width(120));
                newGroupName = EditorGUILayout.TextField(newGroupName);
                if (GUILayout.Button("Confirm", GUILayout.Width(70)))
                {
                    if (!string.IsNullOrWhiteSpace(newGroupName))
                    {
                        schema.fields.Add(new AnalyticsField
                        {
                            columnName = newGroupName + "/NewField",
                            type = AnalyticsFieldType.String
                        });
                        EditorUtility.SetDirty(schema);
                        newGroupName = "";
                        showNewGroupField = false;
                    }
                }
                if (GUILayout.Button("Cancel", GUILayout.Width(70)))
                {
                    newGroupName = "";
                    showNewGroupField = false;
                }
                EditorGUILayout.EndHorizontal();
            }
            else
            {
                if (GUILayout.Button("+ Add Group"))
                {
                    showNewGroupField = true;
                }
            }

            EditorGUILayout.Space();
            EditorGUILayout.LabelField("The \"Session/\" group is reserved and auto-managed by the SDK", 
                new GUIStyle(EditorStyles.label) { normal = { textColor = Color.gray } });

            EditorGUILayout.EndScrollView();
        }

        private SchemaNode BuildTree()
        {
            var root = new SchemaNode { Name = "Root", Field = null };

            foreach (var field in schema.fields)
            {
                string[] segments = field.columnName.Split('/');
                SchemaNode current = root;

                for (int i = 0; i < segments.Length; i++)
                {
                    string segment = segments[i];
                    bool isLeaf = (i == segments.Length - 1);

                    if (isLeaf)
                    {
                        var leafNode = new SchemaNode
                        {
                            Name = segment,
                            Field = field
                        };
                        current.Children.Add(leafNode);
                    }
                    else
                    {
                        SchemaNode child = current.Children.Find(n => n.Name == segment && n.Field == null);
                        if (child == null)
                        {
                            child = new SchemaNode { Name = segment, Field = null };
                            current.Children.Add(child);
                        }
                        current = child;
                    }
                }
            }

            return root;
        }

        private string GetFullPath(SchemaNode node, string parentPath)
        {
            if (string.IsNullOrEmpty(parentPath))
                return node.Name;
            return parentPath + "/" + node.Name;
        }

        private string GetLastSegment(string columnName)
        {
            int lastSlash = columnName.LastIndexOf('/');
            return lastSlash >= 0 ? columnName.Substring(lastSlash + 1) : columnName;
        }

        private string GetParentPath(string columnName)
        {
            int lastSlash = columnName.LastIndexOf('/');
            return lastSlash >= 0 ? columnName.Substring(0, lastSlash) : "";
        }

        private void RenderNode(SchemaNode node, string parentPath)
        {
            string fullPath = GetFullPath(node, parentPath);

            if (node.Field != null)
            {
                RenderFieldRow(node, fullPath);
            }
            else
            {
                RenderGroupNode(node, fullPath, parentPath);
            }
        }

        private void RenderGroupNode(SchemaNode node, string fullPath, string parentPath)
        {
            if (!groupFoldouts.ContainsKey(fullPath))
            {
                groupFoldouts[fullPath] = true;
            }

            EditorGUILayout.BeginHorizontal();
            groupFoldouts[fullPath] = EditorGUILayout.Foldout(groupFoldouts[fullPath], node.Name, true);

            if (renamingGroups.ContainsKey(fullPath))
            {
                EditorGUILayout.EndHorizontal();
                EditorGUILayout.BeginHorizontal();
                EditorGUI.indentLevel++;
                EditorGUILayout.LabelField("Rename to:", GUILayout.Width(80));
                renamingGroups[fullPath] = EditorGUILayout.TextField(renamingGroups[fullPath]);
                
                if (GUILayout.Button("OK", GUILayout.Width(40)))
                {
                    string newName = renamingGroups[fullPath];
                    if (!string.IsNullOrWhiteSpace(newName))
                    {
                        RenameGroup(fullPath, parentPath, newName);
                    }
                    renamingGroups.Remove(fullPath);
                }
                if (GUILayout.Button("Cancel", GUILayout.Width(60)))
                {
                    renamingGroups.Remove(fullPath);
                }
                EditorGUI.indentLevel--;
                EditorGUILayout.EndHorizontal();
            }
            else if (duplicatingGroups.ContainsKey(fullPath))
            {
                EditorGUILayout.EndHorizontal();
                EditorGUILayout.BeginHorizontal();
                EditorGUI.indentLevel++;
                EditorGUILayout.LabelField("Duplicate as:", GUILayout.Width(90));
                duplicatingGroups[fullPath] = EditorGUILayout.TextField(duplicatingGroups[fullPath]);
                
                if (GUILayout.Button("OK", GUILayout.Width(40)))
                {
                    string newName = duplicatingGroups[fullPath];
                    if (!string.IsNullOrWhiteSpace(newName))
                    {
                        DuplicateGroup(fullPath, parentPath, newName);
                    }
                    duplicatingGroups.Remove(fullPath);
                }
                if (GUILayout.Button("Cancel", GUILayout.Width(60)))
                {
                    duplicatingGroups.Remove(fullPath);
                }
                EditorGUI.indentLevel--;
                EditorGUILayout.EndHorizontal();
            }
            else
            {
                if (GUILayout.Button("▲", GUILayout.Width(25)))
                {
                    MoveGroupUp(fullPath);
                }
                if (GUILayout.Button("▼", GUILayout.Width(25)))
                {
                    MoveGroupDown(fullPath);
                }
                if (GUILayout.Button("✎", GUILayout.Width(25)))
                {
                    renamingGroups[fullPath] = node.Name;
                }
                if (GUILayout.Button("⧉", GUILayout.Width(25)))
                {
                    duplicatingGroups[fullPath] = node.Name + "Copy";
                }
                EditorGUILayout.EndHorizontal();
            }

            if (groupFoldouts[fullPath])
            {
                EditorGUI.indentLevel++;

                foreach (var child in node.Children)
                {
                    RenderNode(child, fullPath);
                }

                if (GUILayout.Button("+ Add Field"))
                {
                    schema.fields.Add(new AnalyticsField
                    {
                        columnName = fullPath + "/NewField",
                        type = AnalyticsFieldType.String
                    });
                    EditorUtility.SetDirty(schema);
                }

                if (showAddSubGroupFields.ContainsKey(fullPath) && showAddSubGroupFields[fullPath])
                {
                    EditorGUILayout.BeginHorizontal();
                    EditorGUILayout.LabelField("Sub-Group Name:", GUILayout.Width(120));
                    string key = fullPath + "_subgroup";
                    if (!renamingGroups.ContainsKey(key))
                        renamingGroups[key] = "";
                    renamingGroups[key] = EditorGUILayout.TextField(renamingGroups[key]);
                    
                    if (GUILayout.Button("Confirm", GUILayout.Width(70)))
                    {
                        if (!string.IsNullOrWhiteSpace(renamingGroups[key]))
                        {
                            schema.fields.Add(new AnalyticsField
                            {
                                columnName = fullPath + "/" + renamingGroups[key] + "/NewField",
                                type = AnalyticsFieldType.String
                            });
                            EditorUtility.SetDirty(schema);
                            renamingGroups.Remove(key);
                            showAddSubGroupFields[fullPath] = false;
                        }
                    }
                    if (GUILayout.Button("Cancel", GUILayout.Width(70)))
                    {
                        renamingGroups.Remove(key);
                        showAddSubGroupFields[fullPath] = false;
                    }
                    EditorGUILayout.EndHorizontal();
                }
                else
                {
                    if (GUILayout.Button("+ Add Sub-Group"))
                    {
                        showAddSubGroupFields[fullPath] = true;
                    }
                }

                EditorGUI.indentLevel--;
            }

            EditorGUILayout.Space();
        }

        private void RenderFieldRow(SchemaNode node, string fullPath)
        {
            var field = node.Field;
            EditorGUILayout.BeginVertical();
            EditorGUILayout.BeginHorizontal();

            string displayName = node.Name;
            string newDisplayName = EditorGUILayout.TextField(displayName);

            if (newDisplayName != displayName)
            {
                string parentPath = GetParentPath(field.columnName);
                field.columnName = string.IsNullOrEmpty(parentPath) ? newDisplayName : parentPath + "/" + newDisplayName;
                EditorUtility.SetDirty(schema);
            }

            field.type = (AnalyticsFieldType)EditorGUILayout.EnumPopup(field.type, GUILayout.Width(100));

            if (GUILayout.Button("×", GUILayout.Width(25)))
            {
                schema.fields.Remove(field);
                EditorUtility.SetDirty(schema);
                EditorGUILayout.EndHorizontal();
                EditorGUILayout.EndVertical();
                return;
            }

            if (GUILayout.Button("▲", GUILayout.Width(25)))
            {
                MoveFieldUp(field);
            }

            if (GUILayout.Button("▼", GUILayout.Width(25)))
            {
                MoveFieldDown(field);
            }

            EditorGUILayout.EndHorizontal();

            EditorGUILayout.LabelField(field.columnName, 
                new GUIStyle(EditorStyles.miniLabel) { normal = { textColor = Color.gray } });

            string validationError = ValidateField(field);
            if (!string.IsNullOrEmpty(validationError))
            {
                EditorGUILayout.LabelField(validationError, 
                    new GUIStyle(EditorStyles.miniLabel) { normal = { textColor = Color.red } });
            }

            EditorGUILayout.EndVertical();
            EditorGUILayout.Space(5);
        }

        private string ValidateField(AnalyticsField field)
        {
            if (string.IsNullOrWhiteSpace(GetLastSegment(field.columnName)))
            {
                return "Field name is required";
            }

            if (field.columnName.ToLower().StartsWith("session/"))
            {
                return "Reserved — managed by SDK";
            }

            int count = schema.fields.Count(f => f.columnName == field.columnName);
            if (count > 1)
            {
                return "Duplicate column name";
            }

            return null;
        }

        private void MoveFieldUp(AnalyticsField field)
        {
            int currentIndex = schema.fields.IndexOf(field);
            if (currentIndex <= 0) return;

            string parentPath = GetParentPath(field.columnName);
            
            int targetIndex = currentIndex - 1;
            var previousField = schema.fields[targetIndex];
            string previousParent = GetParentPath(previousField.columnName);
            
            if (previousParent == parentPath)
            {
                schema.fields.RemoveAt(currentIndex);
                schema.fields.Insert(targetIndex, field);
                EditorUtility.SetDirty(schema);
            }
            else
            {
                var previousGroup = GetGroupAtIndex(targetIndex, parentPath);
                if (previousGroup != null && previousGroup.Count > 0)
                {
                    int groupStartIndex = schema.fields.IndexOf(previousGroup[0]);
                    schema.fields.RemoveAt(currentIndex);
                    schema.fields.Insert(groupStartIndex, field);
                    EditorUtility.SetDirty(schema);
                }
            }
        }

        private void MoveFieldDown(AnalyticsField field)
        {
            int currentIndex = schema.fields.IndexOf(field);
            if (currentIndex >= schema.fields.Count - 1) return;

            string parentPath = GetParentPath(field.columnName);
            
            int targetIndex = currentIndex + 1;
            var nextField = schema.fields[targetIndex];
            string nextParent = GetParentPath(nextField.columnName);
            
            if (nextParent == parentPath)
            {
                schema.fields.RemoveAt(currentIndex);
                schema.fields.Insert(targetIndex, field);
                EditorUtility.SetDirty(schema);
            }
            else
            {
                var nextGroup = GetGroupAtIndex(targetIndex, parentPath);
                if (nextGroup != null && nextGroup.Count > 0)
                {
                    int groupEndIndex = schema.fields.IndexOf(nextGroup[nextGroup.Count - 1]);
                    schema.fields.RemoveAt(currentIndex);
                    schema.fields.Insert(groupEndIndex, field);
                    EditorUtility.SetDirty(schema);
                }
            }
        }

        private List<AnalyticsField> GetGroupAtIndex(int index, string expectedParent)
        {
            if (index < 0 || index >= schema.fields.Count) return null;
            
            var field = schema.fields[index];
            string fieldParent = GetParentPath(field.columnName);
            
            if (fieldParent == expectedParent)
            {
                return new List<AnalyticsField> { field };
            }
            
            string groupPrefix = null;
            if (string.IsNullOrEmpty(expectedParent))
            {
                int firstSlash = field.columnName.IndexOf('/');
                if (firstSlash > 0)
                {
                    groupPrefix = field.columnName.Substring(0, firstSlash);
                }
            }
            else if (field.columnName.StartsWith(expectedParent + "/"))
            {
                string remainder = field.columnName.Substring(expectedParent.Length + 1);
                int nextSlash = remainder.IndexOf('/');
                if (nextSlash > 0)
                {
                    groupPrefix = expectedParent + "/" + remainder.Substring(0, nextSlash);
                }
            }
            
            if (groupPrefix != null)
            {
                return schema.fields.Where(f => f.columnName.StartsWith(groupPrefix + "/")).ToList();
            }
            
            return null;
        }

        private void MoveGroupUp(string fullPath)
        {
            var groupFields = schema.fields.Where(f => f.columnName.StartsWith(fullPath + "/")).ToList();
            if (groupFields.Count == 0) return;

            string parentPath = GetParentPath(fullPath);
            var siblingGroups = GetSiblingGroups(parentPath);
            int currentGroupIndex = siblingGroups.IndexOf(fullPath);
            
            if (currentGroupIndex > 0)
            {
                string previousGroup = siblingGroups[currentGroupIndex - 1];
                var previousGroupFields = schema.fields.Where(f => f.columnName.StartsWith(previousGroup + "/")).ToList();
                
                int firstFieldIndex = schema.fields.IndexOf(groupFields[0]);
                int previousFirstIndex = schema.fields.IndexOf(previousGroupFields[0]);
                
                foreach (var field in groupFields)
                {
                    schema.fields.Remove(field);
                }
                
                int insertIndex = schema.fields.IndexOf(previousGroupFields[0]);
                foreach (var field in groupFields)
                {
                    schema.fields.Insert(insertIndex, field);
                    insertIndex++;
                }
                
                EditorUtility.SetDirty(schema);
            }
        }

        private void MoveGroupDown(string fullPath)
        {
            var groupFields = schema.fields.Where(f => f.columnName.StartsWith(fullPath + "/")).ToList();
            if (groupFields.Count == 0) return;

            string parentPath = GetParentPath(fullPath);
            var siblingGroups = GetSiblingGroups(parentPath);
            int currentGroupIndex = siblingGroups.IndexOf(fullPath);
            
            if (currentGroupIndex < siblingGroups.Count - 1)
            {
                string nextGroup = siblingGroups[currentGroupIndex + 1];
                var nextGroupFields = schema.fields.Where(f => f.columnName.StartsWith(nextGroup + "/")).ToList();
                
                foreach (var field in groupFields)
                {
                    schema.fields.Remove(field);
                }
                
                int insertIndex = schema.fields.IndexOf(nextGroupFields[nextGroupFields.Count - 1]) + 1;
                foreach (var field in groupFields)
                {
                    schema.fields.Insert(insertIndex, field);
                    insertIndex++;
                }
                
                EditorUtility.SetDirty(schema);
            }
        }

        private List<string> GetSiblingGroups(string parentPath)
        {
            var groups = new List<string>();
            foreach (var field in schema.fields)
            {
                if (string.IsNullOrEmpty(parentPath))
                {
                    int firstSlash = field.columnName.IndexOf('/');
                    if (firstSlash > 0)
                    {
                        string group = field.columnName.Substring(0, firstSlash);
                        if (!groups.Contains(group))
                            groups.Add(group);
                    }
                }
                else if (field.columnName.StartsWith(parentPath + "/"))
                {
                    string remainder = field.columnName.Substring(parentPath.Length + 1);
                    int nextSlash = remainder.IndexOf('/');
                    if (nextSlash > 0)
                    {
                        string group = parentPath + "/" + remainder.Substring(0, nextSlash);
                        if (!groups.Contains(group))
                            groups.Add(group);
                    }
                }
            }
            return groups;
        }

        private void RenameGroup(string oldFullPath, string parentPath, string newName)
        {
            string newFullPath = string.IsNullOrEmpty(parentPath) ? newName : parentPath + "/" + newName;
            
            foreach (var field in schema.fields)
            {
                if (field.columnName.StartsWith(oldFullPath + "/"))
                {
                    field.columnName = newFullPath + field.columnName.Substring(oldFullPath.Length);
                }
            }
            
            EditorUtility.SetDirty(schema);
        }

        private void DuplicateGroup(string sourceFullPath, string parentPath, string newName)
        {
            string newFullPath = string.IsNullOrEmpty(parentPath) ? newName : parentPath + "/" + newName;
            var fieldsToClone = schema.fields.Where(f => f.columnName.StartsWith(sourceFullPath + "/")).ToList();
            
            foreach (var field in fieldsToClone)
            {
                var newField = new AnalyticsField
                {
                    columnName = newFullPath + field.columnName.Substring(sourceFullPath.Length),
                    type = field.type,
                    description = field.description
                };
                schema.fields.Add(newField);
            }
            
            EditorUtility.SetDirty(schema);
        }

        private void BakeAnalytics()
        {
            if (!ValidateSchema(out string validationError))
            {
                EditorUtility.DisplayDialog("Bake Failed", validationError, "OK");
                return;
            }

            var config = Resources.Load<AnalyticsConfig>("CREAnalyticsConfig");
            if (config == null)
            {
                EditorUtility.DisplayDialog("Bake Failed", "AnalyticsConfig not found at Resources/CREAnalyticsConfig", "OK");
                return;
            }

            var secrets = Resources.Load<AnalyticsSecrets>("CREAnalyticsSecrets");
            if (secrets == null)
            {
                EditorUtility.DisplayDialog("Bake Failed", "AnalyticsSecrets not found at Resources/CREAnalyticsSecrets", "OK");
                return;
            }

            BumpSchemaVersion();

            AnalyticsCodeGenerator.Generate(schema);

            SyncSchemaToFirebase(config, secrets);

            EditorUtility.SetDirty(schema);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log($"[CRE Analytics] Bake complete — version {schema.schemaVersion}");
        }

        private bool ValidateSchema(out string errorMessage)
        {
            foreach (var field in schema.fields)
            {
                if (string.IsNullOrWhiteSpace(field.columnName))
                {
                    errorMessage = "One or more fields have an empty columnName";
                    return false;
                }

                if (field.columnName.ToLower().StartsWith("session/"))
                {
                    errorMessage = $"Field '{field.columnName}' starts with 'Session/' which is reserved";
                    return false;
                }
            }

            var columnNames = schema.fields.Select(f => f.columnName).ToList();
            var duplicates = columnNames.GroupBy(x => x).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
            if (duplicates.Count > 0)
            {
                errorMessage = $"Duplicate column names found: {string.Join(", ", duplicates)}";
                return false;
            }

            errorMessage = null;
            return true;
        }

        private void BumpSchemaVersion()
        {
            var parts = schema.schemaVersion.Split('.');
            if (parts.Length == 3 && int.TryParse(parts[2], out int patch))
            {
                schema.schemaVersion = $"{parts[0]}.{parts[1]}.{patch + 1}";
            }
            else
            {
                schema.schemaVersion += "-baked";
            }
        }

        private void SyncSchemaToFirebase(AnalyticsConfig config, AnalyticsSecrets secrets)
        {
            var columns = new List<SchemaColumn>();

            foreach (var field in schema.fields)
            {
                columns.Add(new SchemaColumn
                {
                    columnName = field.columnName,
                    dataType = GetDataType(field.type)
                });
            }

            columns.Add(new SchemaColumn { columnName = "Session/StartedAt", dataType = "string" });
            columns.Add(new SchemaColumn { columnName = "Session/EndedAt", dataType = "string" });
            columns.Add(new SchemaColumn { columnName = "Session/Duration", dataType = "number" });
            columns.Add(new SchemaColumn { columnName = "Session/Platform", dataType = "string" });
            columns.Add(new SchemaColumn { columnName = "Session/DeviceModel", dataType = "string" });

            var body = new SchemaBakeRequest
            {
                projectId = config.projectId,
                projectKey = secrets.projectKey,
                schemaVersion = schema.schemaVersion,
                columns = columns.ToArray()
            };

            string json = JsonUtility.ToJson(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            string url = $"{config.baseUrl}/schemas/bake";

            try
            {
                var client = new HttpClient();
                var response = client.PostAsync(url, content).Result;

                if (!response.IsSuccessStatusCode)
                {
                    string responseBody = response.Content.ReadAsStringAsync().Result;
                    EditorUtility.DisplayDialog(
                        "Schema Sync Warning",
                        $"Firebase schema sync failed with status {(int)response.StatusCode}:\n{responseBody}",
                        "OK"
                    );
                }
                else
                {
                    Debug.Log("[CRE Analytics] Schema synced to Firebase");
                }
            }
            catch (System.Exception ex)
            {
                EditorUtility.DisplayDialog(
                    "Schema Sync Warning",
                    $"Firebase schema sync failed:\n{ex.Message}",
                    "OK"
                );
            }
        }

        private string GetDataType(AnalyticsFieldType type)
        {
            switch (type)
            {
                case AnalyticsFieldType.Int:
                case AnalyticsFieldType.Float:
                    return "number";
                case AnalyticsFieldType.Bool:
                    return "boolean";
                case AnalyticsFieldType.String:
                case AnalyticsFieldType.Timestamp:
                    return "string";
                default:
                    return "string";
            }
        }
    }

    [System.Serializable]
    internal class SchemaBakeRequest
    {
        public string projectId;
        public string projectKey;
        public string schemaVersion;
        public SchemaColumn[] columns;
    }

    [System.Serializable]
    internal class SchemaColumn
    {
        public string columnName;
        public string dataType;
    }
}
