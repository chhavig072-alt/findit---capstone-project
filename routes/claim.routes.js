import { Router } from 'express';
import { myClaims, receivedClaims, decideClaim } from '../controllers/claim.controller.js';
import { authenticate } from '../middleware/auth.js';

const r = Router();
r.use(authenticate);
r.get('/mine', myClaims);
r.get('/received', receivedClaims);
r.patch('/:id', decideClaim);
export default r;
