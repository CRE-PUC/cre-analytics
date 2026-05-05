import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from '../middleware/validateProjectKey';
import { BakeSchemaBodyZod, validate, ProjectSchema } from '../types';

export async function bakeSchema(req: AuthenticatedRequest, res: Response) {
  const body = validate(BakeSchemaBodyZod, req.body, res);
  if (!body) return;

  const { projectId, schemaVersion, columns } = body;

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

  res.json({ success: true });
}
