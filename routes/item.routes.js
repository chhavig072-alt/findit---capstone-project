import { Router } from 'express';
import {
  createItem, listItems, myItems, getItem, getMatches, deleteOwnItem,
} from '../controllers/item.controller.js';
import { createClaim, itemClaims } from '../controllers/claim.controller.js';
import { authenticate } from '../middleware/auth.js';

const r = Router();
r.use(authenticate);
r.get('/', listItems);
r.post('/', createItem);
r.get('/mine', myItems);            // must come before '/:id'
r.get('/:id', getItem);
r.delete('/:id', deleteOwnItem);
r.get('/:id/matches', getMatches);  // the "possible matches" twist
r.post('/:id/claims', createClaim);
r.get('/:id/claims', itemClaims);
export default r;
