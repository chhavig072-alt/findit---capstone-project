import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ItemCard from '../components/ItemCard.jsx';

export default function MyActivity() {
  const [items, setItems] = useState([]);
  const [made, setMade] = useState([]);
  const [received, setReceived] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([
        api.get('/items/mine'), api.get('/claims/mine'), api.get('/claims/received'),
      ]);
      setItems(a.items); setMade(b.claims); setReceived(c.claims);
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(id, status) {
    try { await api.patch(`/claims/${id}`, { status }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <section>
      <h1>My activity</h1>
      {error && <p className="error" role="alert">{error}</p>}

      <h2>Claims waiting on me</h2>
      {received.filter((c) => c.status === 'pending').length === 0 ? <p className="muted">Nothing to review.</p> :
        received.filter((c) => c.status === 'pending').map((c) => (
          <div key={c._id} className="claim">
            <p><strong>{c.claimant?.name}</strong> on <Link to={`/items/${c.item?._id}`}>{c.item?.title}</Link></p>
            <p>{c.message}</p>
            <div className="row">
              <button className="btn" onClick={() => decide(c._id, 'approved')}>Approve</button>
              <button className="btn ghost" onClick={() => decide(c._id, 'rejected')}>Reject</button>
            </div>
          </div>
        ))}

      <h2>Claims I made</h2>
      {made.length === 0 ? <p className="muted">You haven't claimed anything.</p> : made.map((c) => (
        <div key={c._id} className="claim row between">
          <span>{c.item ? <Link to={`/items/${c.item._id}`}>{c.item.title}</Link> : 'Removed post'}</span>
          <span className={`pill ${c.status}`}>{c.status}</span>
        </div>
      ))}

      <h2>My posts</h2>
      {items.length === 0 ? <p className="muted">No posts yet. <Link to="/post">Post an item</Link></p> :
        <div className="grid">{items.map((i) => <ItemCard key={i._id} item={i} />)}</div>}
    </section>
  );
}
