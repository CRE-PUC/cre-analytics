import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SubmitSessionRequest, BakeSchemaRequest, ProjectSchema } from './types';

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

export const bakeSchema = functions.https.onCall(
  async (request: functions.https.CallableRequest<BakeSchemaRequest>) => {
    const { projectId, projectKey, schemaVersion, columns } = request.data;

    if (!projectId || typeof projectId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'projectId is required and must be a non-empty string');
    }

    if (!schemaVersion || typeof schemaVersion !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'schemaVersion is required and must be a non-empty string');
    }

    if (!projectKey || typeof projectKey !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'projectKey is required and must be a non-empty string');
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'columns is required and must be a non-empty array');
    }

    const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Project not found');
    }
    if (projectDoc.data()?.projectKey !== projectKey) {
      throw new functions.https.HttpsError('permission-denied', 'Invalid project key');
    }

    const schemaData: ProjectSchema = {
      columns,
      bakedAt: new Date().toISOString(),
    };

    await admin
      .firestore()
      .collection('projects')
      .doc(projectId)
      .collection('schemas')
      .doc(schemaVersion)
      .set(schemaData);

    return { success: true };
  }
);
