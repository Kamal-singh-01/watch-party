import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const Home = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const createRoom = async () => {
    setError('');
    try {
      const data = await api('/rooms', { method: 'POST', token });
      navigate(`/room/${data.code}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/rooms/${code.trim()}`, { token });
      navigate(`/room/${data.code}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:mt-16 sm:p-9">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Together, from anywhere</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Watch Party<span className="text-indigo-600">.</span></h1></div>
        <div className="text-right text-sm text-slate-600">
          {user?.username}{' '}
          <button className="ml-2 font-semibold text-indigo-600 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-800" onClick={logout}>Log out</button>
        </div>
      </div>

      <button className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200" onClick={createRoom}>
        Create a room
      </button>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />or join with a room code<span className="h-px flex-1 bg-slate-200" /></div>

      <form onSubmit={joinRoom} className="flex flex-col gap-2 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 uppercase tracking-widest outline-none transition placeholder:normal-case placeholder:tracking-normal focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          placeholder="Room code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">Join</button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
};

export default Home;
