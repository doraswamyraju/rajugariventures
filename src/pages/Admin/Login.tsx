import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      login(response.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-black text-white">
      <Helmet>
        <title>Admin Login | Rajugari Ventures</title>
      </Helmet>
      <div className="w-full max-w-md p-8 bg-white/5 rounded-2xl border border-white/10">
        <h2 className="text-3xl font-display font-bold mb-8 text-center uppercase">Admin Access</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-mono uppercase tracking-widest mb-2 text-white/50">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-orange outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-mono uppercase tracking-widest mb-2 text-white/50">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-orange outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-orange text-black font-bold py-3 rounded-lg hover:bg-white transition-colors uppercase tracking-widest"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
