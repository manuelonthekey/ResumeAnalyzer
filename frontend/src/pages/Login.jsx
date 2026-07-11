import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { Mail, Lock, User, FileText, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/40 backdrop-blur-md rounded-5xl shadow-2xl p-8 border border-white/40">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 gradient-header rounded-3xl flex items-center justify-center text-white shadow-md mb-4">
            <FileText size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">ResumeFlow</h2>
          <p className="text-slate-550 text-sm mt-1 font-medium">AI-Powered Resume Analyzer</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/90 backdrop-blur-sm border border-red-100 text-red-650 text-sm rounded-2xl text-center font-bold shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-purple-400" size={20} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/95 border border-purple-100/60 rounded-3xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all text-slate-800 font-medium shadow-sm"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-purple-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/95 border border-purple-100/60 rounded-3xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all text-slate-800 font-medium shadow-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-header text-white font-bold py-4 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 btn-interactive cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Log In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-purple-600 font-extrabold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
