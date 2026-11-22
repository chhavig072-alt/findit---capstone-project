import { Link } from 'react-router-dom';

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item._id}`} className={`tag ${item.type}`}>
      {item.photoUrl ? (
        <img src={item.photoUrl} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : null}
      <div className="tag-body">
        <span className="tag-type">{item.type === 'lost' ? 'Lost' : 'Found'}</span>
        <h3>{item.title}</h3>
        <p className="muted">{item.category}, {item.place}</p>
        <p className="muted small">{fmtDate(item.date)}</p>
      </div>
    </Link>
  );
}
