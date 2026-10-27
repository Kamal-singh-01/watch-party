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
    <div className="max-w-sm mx-auto mt-20 p-4">
      <h1 className="text-2xl font-bold mb-4">Watch Party</h1>
      <h2 className="mb-3">{isSignup ? 'Create an account' : 'Log in'}</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        {isSignup && (
          <input className="border p-2" name="username" placeholder="Username" value={form.username} onChange={onChange} required />
        )}
        <input className="border p-2" type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input className="border p-2" type="password" name="password" placeholder="Password (6+ characters)" value={form.password} onChange={onChange} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="bg-black text-white p-2 disabled:opacity-50" disabled={loading}>
          {loading ? 'Please wait...' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <button className="text-sm underline mt-3" onClick={() => { setIsSignup(!isSignup); setError(''); }}>
        {isSignup ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </div>
  );
};

export default Login;
