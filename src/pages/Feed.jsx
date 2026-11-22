import { useEffect, useState } from 'react';
import { api, CATEGORIES } from '../api.js';
import ItemCard from '../components/ItemCard.jsx';

const empty = { type: '', category: '', place: '', q: '', from: '', to: '' };

export default function Feed() {
  const [filters, setFilters] = useState(empty);
  const [applied, setApplied] = useState(empty);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ page });
    Object.entries(applied).forEach(([k, v]) => v && params.set(k, v));
    setLoading(true);
    api.get(`/items?${params}`)
      .then((d) => { setData(d); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [applied, page]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  function search(e) {
    e.preventDefault();
    setPage(1);
    setApplied(filters);
  }
  function reset() {
    setFilters(empty); setApplied(empty); setPage(1);
  }

  return (
    <section>
      <h1>Lost and found on campus</h1>
      <form className="filters" onSubmit={search}>
        <input placeholder="Search title (e.g. calculator)" value={filters.q} onChange={set('q')} />
        <select value={filters.type} onChange={set('type')}>
          <option value="">Lost and found</option>
          <option value="lost">Lost only</option>
          <option value="found">Found only</option>
        </select>
        <select value={filters.category} onChange={set('category')}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input placeholder="Place (e.g. library)" value={filters.place} onChange={set('place')} />
        <label className="inline">From<input type="date" value={filters.from} onChange={set('from')} /></label>
        <label className="inline">To<input type="date" value={filters.to} onChange={set('to')} /></label>
        <button className="btn">Search</button>
        <button type="button" className="btn ghost" onClick={reset}>Clear</button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p className="muted">Loading items...</p> : data.items.length === 0 ? (
        <p className="muted">No items match these filters. Try clearing them, or post what you lost or found.</p>
      ) : (
        <>
          <p className="muted small">{data.total} open item{data.total === 1 ? '' : 's'}</p>
          <div className="grid">
            {data.items.map((it) => <ItemCard key={it._id} item={it} />)}
          </div>
          <div className="pager">
            <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span className="muted">Page {page} of {data.pages}</span>
            <button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}
