import Item from '../models/Item.js';

const STOP = new Set([
  'the', 'and', 'for', 'with', 'my', 'our', 'his', 'her', 'its', 'lost', 'found',
  'black', 'white', 'blue', 'red', 'green', 'small', 'big', 'new', 'old', 'near',
  'one', 'has', 'have', 'was', 'are', 'you', 'item', 'please',
]);

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DAY = 24 * 60 * 60 * 1000;

export const keywords = (title) => [
  ...new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  ),
];

/**
 * "Possible matches": opposite type, still open, same category,
 * at least one shared title keyword, date within 7 days.
 */
export async function findMatches(item) {
  const words = keywords(item.title);
  if (!words.length) return [];
  const t = new Date(item.date).getTime();

  return Item.find({
    _id: { $ne: item._id },
    type: item.type === 'lost' ? 'found' : 'lost',
    status: 'open',
    category: item.category,
    date: { $gte: new Date(t - 7 * DAY), $lte: new Date(t + 7 * DAY) },
    title: { $regex: words.map(escapeRegex).join('|'), $options: 'i' },
  })
    .populate('postedBy', 'name')
    .sort({ date: -1 })
    .limit(10);
}
