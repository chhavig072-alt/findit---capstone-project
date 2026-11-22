import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';

export const allItems = asyncHandler(async (_req, res) => {
  const items = await Item.find().populate('postedBy', 'name email').sort({ createdAt: -1 });
  res.json({ items });
});

export const removeItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');
  await Claim.deleteMany({ item: item._id });
  await item.deleteOne();
  res.json({ message: 'Post removed' });
});

export const stats = asyncHandler(async (_req, res) => {
  const [users, items, open, claims] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments(),
    Item.countDocuments({ status: 'open' }),
    Claim.countDocuments({ status: 'pending' }),
  ]);
  res.json({ users, items, open, pendingClaims: claims });
});
