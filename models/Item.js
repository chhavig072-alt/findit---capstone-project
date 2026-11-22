import mongoose from 'mongoose';

export const CATEGORIES = [
  'Electronics', 'Books', 'ID Cards', 'Keys', 'Clothing',
  'Bags', 'Wallets', 'Accessories', 'Other',
];

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    category: { type: String, enum: CATEGORIES, required: true },
    place: { type: String, required: true, trim: true, maxlength: 100 },
    date: { type: Date, required: true },
    photoUrl: { type: String, trim: true, default: '' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

itemSchema.index({ category: 1, date: -1 });
itemSchema.index({ type: 1, status: 1 });

export default mongoose.model('Item', itemSchema);
