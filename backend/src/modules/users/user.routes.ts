import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, deleteAccountSchema } from './user.schema.js';
import { getMe, patchMe, deleteMe, exportMe } from './user.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/me', getMe);
router.patch('/me', validate({ body: updateProfileSchema }), patchMe);
router.delete('/me', validate({ body: deleteAccountSchema }), deleteMe);
router.get('/me/export', exportMe);

export const userRoutes = router;
