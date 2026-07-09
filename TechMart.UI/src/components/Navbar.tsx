import React, { memo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

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
  const [cartCount, setCartCount] = useState<number>(0);

  // Fetch cart count
  const fetchCartCount = useCallback(async () => {
    try {
      if (user) {
        const res = await api.get('/cart');
        const items = res.data?.items || [];
        setCartCount(items.reduce((sum: number, item: any) => sum + item.quantity, 0));
      } else {
        const guest = JSON.parse(localStorage.getItem('guestCart') || '[]');
        setCartCount(guest.reduce((sum: number, item: any) => sum + item.quantity, 0));
      }
    } catch {
      setCartCount(0);
    }
  }, [user]);

  // Refresh count on mount and when user changes
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  // Listen for cart update events dispatched by cart add actions
  useEffect(() => {
    const handler = () => fetchCartCount();
    window.addEventListener('cart:updated', handler);
    window.addEventListener('martbuddy:excite', handler);
    return () => {
      window.removeEventListener('cart:updated', handler);
      window.removeEventListener('martbuddy:excite', handler);
    };
  }, [fetchCartCount]);

  // Memoize handleLogout to prevent recreation on every render
  const handleLogout = useCallback(() => {
    logout();
    setCartCount(0);
    navigate('/login');
  }, [logout, navigate]);

  return (
    <nav className="bg-slate-950 text-white py-4 px-6 border-b border-slate-800 shadow-xl sticky top-0 z-40" aria-label="Main Navigation">
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
          <Link to="/products" className="text-slate-300 hover:text-white transition">
            Products
          </Link>

          {/* Cart link with badge */}
          <Link to="/cart" className="relative text-slate-300 hover:text-white transition flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-indigo-500 text-white text-[10px] font-black w-4.5 h-4.5 min-w-[1.1rem] px-1 py-0.5 rounded-full flex items-center justify-center leading-none shadow-lg">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              {/* My Orders link for logged in customers */}
              {user.role !== 'Admin' && (
                <Link to="/orders" className="text-slate-300 hover:text-white transition">
                  My Orders
                </Link>
              )}

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
