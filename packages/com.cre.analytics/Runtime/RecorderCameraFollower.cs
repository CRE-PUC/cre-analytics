using UnityEngine;

namespace CRE.Analytics
{
    [RequireComponent(typeof(Camera))]
    internal class RecorderCameraFollower : MonoBehaviour
    {
        void LateUpdate()
        {
            if (Camera.main == null) return;
            transform.SetPositionAndRotation(
                Camera.main.transform.position,
                Camera.main.transform.rotation);
        }
    }
}
