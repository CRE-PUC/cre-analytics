using CRE.Analytics;
using System.Collections;
using UnityEngine;

public class TestingScript : MonoBehaviour
{
    public int sessionsToGenerate = 3;

    void Start()
    {
        StartCoroutine(GenerateSessions());
    }

    IEnumerator GenerateSessions()
    {
        for (int i = 0; i < sessionsToGenerate; i++)
        {
            yield return new WaitForSeconds(1f);
            FakeSession();
        }
    }

    void FakeSession()
    {
        CREAnalytics.StartSession();

        Analytics.TutorialDiegetico.SetComecouEm(System.DateTime.UtcNow.ToString("o"));
        Analytics.TutorialDiegetico.Cliques.SetBotaoA(Random.Range(0, 10).ToString());
        Analytics.TutorialDiegetico.Cliques.SetBotaoB(Random.Range(0, 10).ToString());

        Analytics.TutorialN.SetComecouEm(System.DateTime.UtcNow.ToString("o"));
        Analytics.TutorialN.Cliques.SetBotaoA(Random.Range(0, 10).ToString());
        Analytics.TutorialN.Cliques.SetBotaoB(Random.Range(0, 10).ToString());

        CREAnalytics.EndSession();
    }
}
