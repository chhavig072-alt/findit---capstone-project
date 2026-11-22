import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import asyncHandler from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';

export const createClaim = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    throw httpError(400, 'Describe how you can prove this item is yours / was found by you');
  }
  const item = await Item.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');
  if (item.status !== 'open') throw httpError(400, 'This item is already resolved');
  if (String(item.postedBy) === req.user.id) throw httpError(400, 'You cannot claim your own post');

  const dup = await Claim.findOne({ item: item._id, claimant: req.user.id, status: 'pending' });
  if (dup) throw httpError(409, 'You already have a pending claim on this item');

  const claim = await Claim.create({ item: item._id, claimant: req.user.id, message });
  res.status(201).json({ claim });
});

// Claims on one item - visible to the poster (or admin).
export const itemClaims = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');
  if (String(item.postedBy) !== req.user.id && req.user.role !== 'admin') {
    throw httpError(403, 'Only the poster can see claims');
  }
  const claims = await Claim.find({ item: item._id })
    .populate('claimant', 'name email').sort({ createdAt: -1 });
  res.json({ claims });
});

// Claims I made.
export const myClaims = asyncHandler(async (req, res) => {
  const claims = await Claim.find({ claimant: req.user.id })
    .populate({ path: 'item', select: 'title type place status' })
    .sort({ createdAt: -1 });
  res.json({ claims });
});

// Claims on items I posted.
export const receivedClaims = asyncHandler(async (req, res) => {
  const mine = await Item.find({ postedBy: req.user.id }).select('_id');
  const claims = await Claim.find({ item: { $in: mine.map((i) => i._id) } })
    .populate({ path: 'item', select: 'title type place status' })
    .populate('claimant', 'name email')
    .sort({ createdAt: -1 });
  res.json({ claims });
});

// Poster approves or rejects.
export const decideClaim = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    throw httpError(400, 'Status must be approved or rejected');
  }
  const claim = await Claim.findById(req.params.id);
  if (!claim) throw httpError(404, 'Claim not found');
  const item = await Item.findById(claim.item);
  if (!item) throw httpError(404, 'Item no longer exists');
  if (String(item.postedBy) !== req.user.id) throw httpError(403, 'Only the poster can decide on claims');
  if (claim.status !== 'pending') throw httpError(400, 'This claim was already decided');

  claim.status = status;
  await claim.save();

  if (status === 'approved') {
    item.status = 'resolved';
    await item.save();
    await Claim.updateMany(
      { item: item._id, status: 'pending', _id: { $ne: claim._id } },
      { status: 'rejected' }
    );
  }
  res.json({ claim });
});
