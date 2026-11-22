import Item, { CATEGORIES } from '../models/Item.js';
import Claim from '../models/Claim.js';
import asyncHandler from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { findMatches, escapeRegex } from '../utils/matcher.js';

const validDate = (v) => v && !Number.isNaN(new Date(v).getTime());

export const createItem = asyncHandler(async (req, res) => {
  const { type, title, description, category, place, date, photoUrl } = req.body;
  if (!['lost', 'found'].includes(type)) throw httpError(400, 'Type must be lost or found');
  if (!title || !place) throw httpError(400, 'Title and place are required');
  if (!CATEGORIES.includes(category)) throw httpError(400, 'Choose a valid category');
  if (!validDate(date)) throw httpError(400, 'Enter a valid date');
  if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
    throw httpError(400, 'Photo URL must start with http:// or https://');
  }

  const item = await Item.create({
    type, title, description, category, place,
    date: new Date(date), photoUrl, postedBy: req.user.id,
  });
  res.status(201).json({ item });
});

export const listItems = asyncHandler(async (req, res) => {
  const { type, category, place, q, from, to, status = 'open' } = req.query;
  const filter = {};
  if (['lost', 'found'].includes(type)) filter.type = type;
  if (category) filter.category = category;
  if (status !== 'all') filter.status = status;
  if (place) filter.place = new RegExp(escapeRegex(place), 'i');
  if (q) filter.title = new RegExp(escapeRegex(q), 'i');
  if (validDate(from) || validDate(to)) {
    filter.date = {};
    if (validDate(from)) filter.date.$gte = new Date(from);
    if (validDate(to)) filter.date.$lte = new Date(to);
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);

  const [items, total] = await Promise.all([
    Item.find(filter).populate('postedBy', 'name').sort({ date: -1 })
      .skip((page - 1) * limit).limit(limit),
    Item.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

export const myItems = asyncHandler(async (req, res) => {
  const items = await Item.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
  res.json({ items });
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate('postedBy', 'name');
  if (!item) throw httpError(404, 'Item not found');
  res.json({ item });
});

export const getMatches = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');
  res.json({ matches: await findMatches(item) });
});

export const deleteOwnItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');
  if (String(item.postedBy) !== req.user.id) throw httpError(403, 'You can only delete your own posts');
  await Claim.deleteMany({ item: item._id });
  await item.deleteOne();
  res.json({ message: 'Post deleted' });
});
