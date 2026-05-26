import cors from 'cors';
import express from 'express';
import * as admin from 'firebase-admin';
import { router } from './routes';

admin.initializeApp();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/', router);

export { app };
