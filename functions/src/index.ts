import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SubmitSessionRequest } from './types';

admin.initializeApp();

export const submitSession = functions.https.onCall(
  async (request: functions.https.CallableRequest<SubmitSessionRequest>) => {
    const { sessionData } = request.data;

    if (!sessionData?.metaData?.projectId || !sessionData?.metaData?.sessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required metaData fields');
    }

    const { projectId, sessionId } = sessionData.metaData;

    await admin
      .firestore()
      .collection('projects')
      .doc(projectId)
      .collection('sessions')
      .doc(sessionId)
      .set({ sessionData });

    return { success: true };
  }
);
