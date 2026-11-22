import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, CATEGORIES } from '../api.js';

const today = () => new Date().toISOString().slice(0, 10);

export default function PostItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'lost', title: '', description: '', category: CATEGORIES[0],
    place: '', date: today(), photoUrl: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { item } = await api.post('/items', form);
      navigate(`/items/${item._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <section className="narrow">
      <h1>Post an item</h1>
      <form onSubmit={onSubmit} className="form">
        <div className="segmented" role="radiogroup" aria-label="Item type">
          {['lost', 'found'].map((t) => (
            <label key={t} className={form.type === t ? 'on' : ''}>
              <input type="radio" name="type" value={t} checked={form.type === t} onChange={set('type')} />
              I {t === 'lost' ? 'lost something' : 'found something'}
            </label>
          ))}
        </div>
        <label>Title<input value={form.title} onChange={set('title')} placeholder="Casio scientific calculator" maxLength={100} required /></label>
        <label>Category
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Place<input value={form.place} onChange={set('place')} placeholder="Central library, 2nd floor" required /></label>
        <label>Date {form.type === 'lost' ? 'lost' : 'found'}<input type="date" value={form.date} max={today()} onChange={set('date')} required /></label>
        <label>Description (optional)<textarea rows={3} value={form.description} onChange={set('description')} maxLength={1000} /></label>
        <label>Photo URL (optional)<input type="url" value={form.photoUrl} onChange={set('photoUrl')} placeholder="https://..." /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Posting...' : 'Post item'}</button>
      </form>
    </section>
  );
}
