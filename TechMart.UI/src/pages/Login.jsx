import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-16 px-4 max-w-md">
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="TechMart Logo" className="h-16 w-16 object-contain rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm mb-3" />
          <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wider">TECHMART</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Access your shopping cart and order history</p>
        </div>
        
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-lg p-3 text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
          <div className="space-y-1">
            <label className="block text-slate-500 uppercase tracking-wider text-[10px]">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-350 bg-slate-50/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition font-semibold text-slate-800"
              placeholder="e.g. ruwan@gmail.com"
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="block text-slate-500 uppercase tracking-wider text-[10px]">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-350 bg-slate-50/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition font-semibold text-slate-800"
              placeholder="••••••••"
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold py-3 rounded-xl shadow-md transition duration-250 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 font-semibold">
          Don't have an account? <Link to="/register" className="text-blue-600 font-extrabold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
