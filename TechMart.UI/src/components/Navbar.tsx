import React, { memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Define strict types for the Auth user
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User' | string;
}

// Define the shape of the Auth Context returned by useAuth()
export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (jwtToken: string) => void;
  logout: () => void;
  loading: boolean;
}

const Navbar: React.FC = memo(() => {
  const { user, logout } = useAuth() as AuthContextType;
  const navigate = useNavigate();

  // Memoize handleLogout to prevent recreation on every render
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <nav className="bg-slate-950 text-white py-4.5 px-6 border-b border-slate-800 shadow-xl" aria-label="Main Navigation">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img 
            src="/logo.png" 
            alt="TechMart Logo" 
            className="h-10 w-10 object-contain rounded-xl border border-slate-700 bg-white p-0.5 shadow group-hover:scale-105 transition duration-200" 
          />
          <span className="text-xl font-black tracking-widest bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent group-hover:from-blue-400 group-hover:to-purple-400 transition duration-300">
            TECHMART
          </span>
        </Link>
        <div className="flex gap-6 items-center text-sm font-medium">
          <Link to="/products" className="text-slate-300 hover:text-white transition">Products</Link>
          <Link to="/cart" className="text-slate-300 hover:text-white transition">Cart</Link>
          
          {user ? (
            <>
              {user.role === 'Admin' && (
                <Link to="/admin" className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition">
                  Admin Dashboard
                </Link>
              )}
              <div className="h-4 w-px bg-slate-700" aria-hidden="true"></div>
              <span className="text-slate-400">
                Welcome, <span className="font-semibold text-slate-100">{user.name}</span>
              </span>
              <button 
                onClick={handleLogout} 
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white transition">Login</Link>
              <Link 
                to="/register" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
