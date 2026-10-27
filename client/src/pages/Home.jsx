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
    <div className="max-w-md mx-auto mt-16 p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Watch Party</h1>
        <div className="text-sm">
          {user?.username}{' '}
          <button className="underline ml-2" onClick={logout}>Log out</button>
        </div>
      </div>

      <button className="bg-black text-white px-4 py-2 w-full" onClick={createRoom}>
        Create a room
      </button>

      <p className="text-center my-4 text-sm">or join with a room code</p>

      <form onSubmit={joinRoom} className="flex gap-2">
        <input
          className="border p-2 flex-1 uppercase"
          placeholder="Room code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button className="border px-4">Join</button>
      </form>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default Home;
