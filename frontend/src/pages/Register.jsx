import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { Mail, Lock, User, FileText, ArrowRight } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, name });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-5xl shadow-xl overflow-hidden p-8 border border-white/50">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 gradient-header rounded-3xl flex items-center justify-center text-white shadow-md mb-4">
            <FileText size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Join ResumeFlow</h2>
          <p className="text-gray-500 text-sm mt-1">Get started in seconds</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all text-gray-700"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all text-gray-700"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all text-gray-700"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-header text-white font-semibold py-4 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 btn-interactive"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">
            Log In here
          </Link>
        </div>
      </div>
    </div>
  );
}
