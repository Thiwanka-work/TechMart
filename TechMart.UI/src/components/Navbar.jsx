import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white py-4 px-6 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-black tracking-wider text-indigo-400 hover:text-indigo-300 transition">
          TechMart
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
              <div className="h-4 w-px bg-slate-700"></div>
              <span className="text-slate-400">
                Welcome, <span className="font-semibold text-slate-100">{user.name}</span>
              </span>
              <button 
                onClick={handleLogout} 
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg transition"
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
};

export default Navbar;
