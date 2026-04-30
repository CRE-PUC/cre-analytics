using UnityEditor;
using UnityEngine;

namespace CRE.Analytics.Editor
{
    public class BakeAnalyticsWindow : EditorWindow
    {
        [MenuItem("CRE Analytics/Bake Analytics")]
        public static void ShowWindow()
        {
            GetWindow<BakeAnalyticsWindow>("Bake Analytics");
        }

        private void OnGUI()
        {
            GUILayout.Label("Bake Analytics", EditorStyles.boldLabel);
            // TODO: schema validation and version bumping
        }
    }
}
