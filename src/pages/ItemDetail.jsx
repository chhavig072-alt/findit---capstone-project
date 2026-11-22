import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ItemCard, { fmtDate } from '../components/ItemCard.jsx';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [claims, setClaims] = useState([]);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const isOwner = item && user && item.postedBy?._id === user.id;

  const load = useCallback(async () => {
    try {
      const [{ item }, { matches }] = await Promise.all([
        api.get(`/items/${id}`), api.get(`/items/${id}/matches`),
      ]);
      setItem(item); setMatches(matches);
      if (item.postedBy?._id === user.id) {
        const { claims } = await api.get(`/items/${id}/claims`);
        setClaims(claims);
      }
    } catch (e) { setError(e.message); }
  }, [id, user.id]);

  useEffect(() => { load(); }, [load]);

  async function submitClaim(e) {
    e.preventDefault();
    setError(''); setNotice('');
    try {
      await api.post(`/items/${id}/claims`, { message });
      setMessage('');
      setNotice('Claim sent. The poster will approve or reject it.');
    } catch (err) { setError(err.message); }
  }

  async function decide(claimId, status) {
    setError('');
    try { await api.patch(`/claims/${claimId}`, { status }); await load(); }
    catch (err) { setError(err.message); }
  }

  async function remove() {
    if (!window.confirm('Delete this post?')) return;
    try { await api.del(`/items/${id}`); navigate('/activity'); }
    catch (err) { setError(err.message); }
  }

  if (error && !item) return <p className="error" role="alert">{error}</p>;
  if (!item) return <p className="muted">Loading...</p>;

  return (
    <section>
      <div className={`detail ${item.type}`}>
        {item.photoUrl && <img src={item.photoUrl} alt={item.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
        <div>
          <span className="tag-type">{item.type === 'lost' ? 'Lost' : 'Found'}{item.status === 'resolved' ? ' - resolved' : ''}</span>
          <h1>{item.title}</h1>
          <p>{item.description || <span className="muted">No description.</span>}</p>
          <dl>
            <dt>Category</dt><dd>{item.category}</dd>
            <dt>Place</dt><dd>{item.place}</dd>
            <dt>Date</dt><dd>{fmtDate(item.date)}</dd>
            <dt>Posted by</dt><dd>{item.postedBy?.name}</dd>
          </dl>
          {isOwner && <button className="btn ghost" onClick={remove}>Delete my post</button>}
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p className="ok" role="status">{notice}</p>}

      {!isOwner && item.status === 'open' && (
        <form className="form panel" onSubmit={submitClaim}>
          <h2>{item.type === 'found' ? 'Is this yours?' : 'Did you find this?'}</h2>
          <label>
            {item.type === 'found'
              ? 'Describe something only the owner would know (colour, marks, contents)'
              : 'Tell them where the item is and how to reach you'}
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} required />
          </label>
          <button className="btn">Send claim</button>
        </form>
      )}

      {isOwner && (
        <div className="panel">
          <h2>Claims on this post</h2>
          {claims.length === 0 ? <p className="muted">No claims yet.</p> : claims.map((c) => (
            <div key={c._id} className="claim">
              <p><strong>{c.claimant?.name}</strong> <span className="muted small">({c.claimant?.email})</span></p>
              <p>{c.message}</p>
              {c.status === 'pending' ? (
                <div className="row">
                  <button className="btn" onClick={() => decide(c._id, 'approved')}>Approve</button>
                  <button className="btn ghost" onClick={() => decide(c._id, 'rejected')}>Reject</button>
                </div>
              ) : <span className={`pill ${c.status}`}>{c.status}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <h2>Possible matches</h2>
        <p className="muted small">Same category, a shared title keyword, and a date within 7 days.</p>
        {matches.length === 0 ? <p className="muted">No likely matches yet. New posts are checked every time you open this page.</p> : (
          <div className="grid">{matches.map((m) => <ItemCard key={m._id} item={m} />)}</div>
        )}
      </div>
      <p><Link to="/">Back to browse</Link></p>
    </section>
  );
}
