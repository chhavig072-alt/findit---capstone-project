import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="nav">
      <NavLink to="/" className="brand">FindIt</NavLink>
      <nav>
        {user ? (
          <>
            <NavLink to="/" end>Browse</NavLink>
            <NavLink to="/post">Post an item</NavLink>
            <NavLink to="/activity">My activity</NavLink>
            {user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            <button className="link" onClick={handleLogout}>Log out ({user.name.split(' ')[0]})</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Create account</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
