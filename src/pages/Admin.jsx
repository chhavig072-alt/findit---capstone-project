import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { fmtDate } from '../components/ItemCard.jsx';

export default function Admin() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([api.get('/admin/items'), api.get('/admin/stats')]);
      setItems(a.items); setStats(s);
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove(item) {
    if (!window.confirm(`Remove "${item.title}"? Its claims will be deleted too.`)) return;
    try { await api.del(`/admin/items/${item._id}`); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <section>
      <h1>Security desk</h1>
      {stats && (
        <p className="muted">
          {stats.users} users, {stats.items} posts ({stats.open} open), {stats.pendingClaims} pending claims
        </p>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Title</th><th>Posted by</th><th>Date</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id}>
                <td>{i.type}</td>
                <td><Link to={`/items/${i._id}`}>{i.title}</Link></td>
                <td>{i.postedBy?.name}<br /><span className="muted small">{i.postedBy?.email}</span></td>
                <td>{fmtDate(i.date)}</td>
                <td>{i.status}</td>
                <td><button className="btn ghost danger" onClick={() => remove(i)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
