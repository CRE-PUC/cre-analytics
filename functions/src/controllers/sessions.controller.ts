import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from '../middleware/validateProjectKey';
import { SubmitSessionBodyZod, validate, ProjectSchema } from '../types';

export async function submitSession(req: AuthenticatedRequest, res: Response) {
  const body = validate(SubmitSessionBodyZod, req.body, res);
  if (!body) return;

  const { sessionData } = body;
  const { projectId, sessionId, schemaVersion } = sessionData.metaData;

  const schemaDoc = await admin.firestore()
    .collection('projects').doc(projectId)
    .collection('schemas').doc(schemaVersion)
    .get();

  if (schemaDoc.exists) {
    const schema = schemaDoc.data() as ProjectSchema;
    const submitted = new Set(sessionData.data.map(d => d.columnName));
    const missing = schema.columns.map(c => c.columnName).filter(n => !submitted.has(n));
    if (missing.length > 0) {
      res.status(422).json({ error: 'Missing required columns', missingColumns: missing });
      return;
    }
  }

  await admin
    .firestore()
    .collection('projects')
    .doc(projectId)
    .collection('sessions')
    .doc(sessionId)
    .set({ sessionData });

  res.json({ success: true });
}
