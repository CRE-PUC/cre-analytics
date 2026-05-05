import { Router } from 'express';
import { bakeSchema } from '../controllers/schemas.controller';
import { submitSession } from '../controllers/sessions.controller';
import { validateProjectKey } from '../middleware/validateProjectKey';

export const router = Router();

router.post('/schemas/bake', validateProjectKey, bakeSchema);
router.post('/sessions', validateProjectKey, submitSession);
