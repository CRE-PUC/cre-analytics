using UnityEditor;
using UnityEngine;

namespace CRE.Analytics
{
    public static class AnalyticsSettingsProvider
    {
        [SettingsProvider]
        public static SettingsProvider CreateAnalyticsSettingsProvider()
        {
            return new SettingsProvider("Project/CRE Analytics", SettingsScope.Project)
            {
                label = "CRE Analytics",
                guiHandler = (searchContext) =>
                {
                    var config = Resources.Load<AnalyticsConfig>("CREAnalyticsConfig");
                    var secrets = Resources.Load<AnalyticsSecrets>("CREAnalyticsSecrets");

                    EditorGUILayout.Space();

                    if (config == null)
                    {
                        EditorGUILayout.HelpBox("AnalyticsConfig asset not found.", MessageType.Warning);
                        if (GUILayout.Button("Create AnalyticsConfig"))
                        {
                            CreateConfig();
                            config = Resources.Load<AnalyticsConfig>("CREAnalyticsConfig");
                        }
                        EditorGUILayout.Space();
                    }

                    if (secrets == null)
                    {
                        EditorGUILayout.HelpBox("AnalyticsSecrets asset not found.", MessageType.Warning);
                        if (GUILayout.Button("Create AnalyticsSecrets"))
                        {
                            CreateSecrets();
                            secrets = Resources.Load<AnalyticsSecrets>("CREAnalyticsSecrets");
                        }
                        EditorGUILayout.Space();
                    }

                    if (config != null)
                    {
                        EditorGUILayout.LabelField("Shared Configuration (commit to git)", EditorStyles.boldLabel);
                        EditorGUI.BeginChangeCheck();
                        config.projectId = EditorGUILayout.TextField("Project ID", config.projectId);
                        config.baseUrl = EditorGUILayout.TextField("Base URL", config.baseUrl);
                        if (EditorGUI.EndChangeCheck())
                        {
                            EditorUtility.SetDirty(config);
                            AssetDatabase.SaveAssets();
                        }
                        EditorGUILayout.Space();
                    }

                    if (secrets != null)
                    {
                        EditorGUILayout.LabelField("Secret Configuration", EditorStyles.boldLabel);
                        EditorGUILayout.HelpBox("Add Assets/Resources/CREAnalyticsSecrets.asset to your .gitignore — it contains your project key", MessageType.Warning);
                        EditorGUI.BeginChangeCheck();
                        secrets.projectKey = EditorGUILayout.TextField("Project Key", secrets.projectKey);
                        if (EditorGUI.EndChangeCheck())
                        {
                            EditorUtility.SetDirty(secrets);
                            AssetDatabase.SaveAssets();
                        }
                    }
                }
            };
        }

        private static void CreateConfig()
        {
            if (!AssetDatabase.IsValidFolder("Assets/Resources"))
                AssetDatabase.CreateFolder("Assets", "Resources");
            var asset = ScriptableObject.CreateInstance<AnalyticsConfig>();
            AssetDatabase.CreateAsset(asset, "Assets/Resources/CREAnalyticsConfig.asset");
            AssetDatabase.SaveAssets();
        }

        private static void CreateSecrets()
        {
            if (!AssetDatabase.IsValidFolder("Assets/Resources"))
                AssetDatabase.CreateFolder("Assets", "Resources");
            var asset = ScriptableObject.CreateInstance<AnalyticsSecrets>();
            AssetDatabase.CreateAsset(asset, "Assets/Resources/CREAnalyticsSecrets.asset");
            AssetDatabase.SaveAssets();
        }
    }
}
