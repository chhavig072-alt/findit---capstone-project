import { Router } from 'express';
import { allItems, removeItem, stats } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const r = Router();
r.use(authenticate, requireRole('admin'));
r.get('/items', allItems);
r.delete('/items/:id', removeItem);
r.get('/stats', stats);
export default r;
