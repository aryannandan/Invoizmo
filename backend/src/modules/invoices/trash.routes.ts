import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { listTrash, restoreTrash, deleteForever } from './invoice.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listTrash);
router.post('/:id/restore', restoreTrash);
router.delete('/:id', deleteForever);

export const trashRoutes = router;
