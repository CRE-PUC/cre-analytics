import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  project?: FirebaseFirestore.DocumentData;
}

export async function validateProjectKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const projectId: string = req.body?.projectId ?? req.body?.sessionData?.metaData?.projectId;
  const projectKey: string = req.body?.projectKey;

  if (!projectId || !projectKey) {
    res.status(400).json({ error: 'projectId and projectKey are required' });
    return;
  }

  const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
  if (!projectDoc.exists) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  if (projectDoc.data()?.projectKey !== projectKey) {
    res.status(403).json({ error: 'Invalid project key' });
    return;
  }

  req.project = projectDoc.data();
  next();
}
