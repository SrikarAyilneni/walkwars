import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="text-xl font-bold">
          WalkWars
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/walk" className="hover:underline">Track Walk</Link>
            <Link to="/walks" className="hover:underline">History</Link>
            <Link to="/leaderboard" className="hover:underline">Leaderboard</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>
            <span className="text-blue-200">{user?.username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded bg-blue-700 px-3 py-1 hover:bg-blue-800"
              aria-label="Log out"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:underline">Track Walk</Link>
            <Link to="/login" className="hover:underline">Log In</Link>
            <Link to="/register" className="rounded bg-blue-700 px-3 py-1 hover:bg-blue-850 text-white font-semibold">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
