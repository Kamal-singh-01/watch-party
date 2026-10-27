import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api(isSignup ? '/auth/signup' : '/auth/login', {
        method: 'POST',
        body: form,
      });
      login(data);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:mt-20 sm:p-10">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Together, from anywhere</p><h1 className="mb-8 text-3xl font-extrabold tracking-tight text-slate-900">Watch Party<span className="text-indigo-600">.</span></h1>
      <h2 className="mb-2 text-xl font-bold text-slate-800">{isSignup ? 'Create your account' : 'Welcome back'}</h2><p className="mb-6 text-sm text-slate-500">{isSignup ? 'Sign up to start watching together.' : 'Log in to join your watch party.'}</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {isSignup && (
          <input className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" name="username" placeholder="Username" value={form.username} onChange={onChange} required />
        )}
        <input className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" type="password" name="password" placeholder="Password (6+ characters)" value={form.password} onChange={onChange} required />
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="rounded-xl bg-indigo-600 p-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading}>
          {loading ? 'Please wait...' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <button className="mt-5 text-sm font-semibold text-indigo-600 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-800" onClick={() => { setIsSignup(!isSignup); setError(''); }}>
        {isSignup ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </div>
  );
};

export default Login;
