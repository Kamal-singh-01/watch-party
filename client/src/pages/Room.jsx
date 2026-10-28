import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';
import YouTubePlayer from '../components/YouTubePlayer.jsx';
import Controls from '../components/Controls.jsx';
import ParticipantList from '../components/ParticipantList.jsx';
import RequestsPanel from '../components/RequestsPanel.jsx';
import Chat from '../components/Chat.jsx';

const ACTION_LABEL = { play: 'pressed play', pause: 'paused', seek: 'seeked', change_video: 'changed the video' };

const Room = () => {
  const { code } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const playerRef = useRef(null);

  const [participants, setParticipants] = useState([]);
  const [initial, setInitial] = useState(null); // first sync state, used to create the player
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notice, setNotice] = useState('');
  const [activity, setActivity] = useState('');

  // Role comes from the server's participant list, never from the client.
  const me = participants.find((p) => p.userId === user.id);
  const role = me?.role || 'participant';
  const canControl = role === 'host' || role === 'moderator';

  const send = (event, data) => socketRef.current?.emit(event, data);

  useEffect(() => {
     const SOCKET_URL = import.meta.env.VITE_API_URL;

  if (!SOCKET_URL) {
    console.error("VITE_API_URL is missing. Cannot connect to Socket.IO.");
    return;
  }

  const socket = io(SOCKET_URL, {
    auth: { token },
  });

  socketRef.current = socket;

    let noticeTimer;
    const flash = (msg) => {
      setNotice(msg);
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => setNotice(''), 4000);
    };
    const system = (text) => setMessages((prev) => [...prev, { system: true, text }]);

    // Runs on first connect and on every automatic reconnect.
    socket.on('connect', () => socket.emit('join_room', { roomId: code }));
    socket.on('connect_error', (err) => {
      if (err.message === 'Unauthorized') {
        logout();
        navigate('/login');
      } else {
        flash('Connection problem, retrying...');
      }
    });

    socket.on('room_joined', (d) => {
      setParticipants(d.participants);
      setInitial((prev) => prev || d.state);
      playerRef.current?.apply(d.state); // re-sync after a reconnect
    });

    socket.on('sync_state', (s) => {
      playerRef.current?.apply(s);
      setActivity(`${s.by} ${ACTION_LABEL[s.action] || s.action}`);
    });

    // All of these carry the full, updated participant list (with roles).
    const updateList = (d) => setParticipants(d.participants);
    ['user_joined', 'user_left', 'participant_removed', 'role_assigned', 'host_transferred'].forEach((e) =>
      socket.on(e, updateList)
    );
    socket.on('user_joined', (d) => system(`${d.username} joined`));
    socket.on('user_left', (d) => system(`${d.username} left`));
    socket.on('role_assigned', (d) => system(`${d.username} is now ${d.role}`));
    socket.on('host_transferred', (d) => {
      const name = d.participants.find((p) => p.userId === d.userId)?.username;
      system(`${name} is now the host`);
    });

    socket.on('requests_updated', (d) => setRequests(d.requests));
    socket.on('request_sent', () => flash('Request sent. Waiting for approval.'));
    socket.on('request_resolved', (d) =>
      flash(`Your ${d.type.replace('_', ' ')} request was ${d.approved ? 'approved' : 'rejected'}`)
    );
    socket.on('chat_message', (m) => setMessages((prev) => [...prev, m]));
    socket.on('room_error', (d) => flash(d.message));
    socket.on('removed', (d) => {
      alert(d.reason);
      navigate('/');
    });

    return () => {
      clearTimeout(noticeTimer);
      socket.emit('leave_room');
      socket.disconnect();
    };
  }, [code, token]);

  return (
    <div className="mx-auto max-w-[1500px] p-3 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Your watch party</p><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Room <span className="text-indigo-600">{code}</span></h1>
          <p className="mt-1 text-sm text-slate-500">
            You are: <b>{role}</b> &middot; Share this page's link or the code with friends
          </p>
        </div>
        <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => navigate('/')}>Leave room</button>
      </div>

      {notice && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-3 lg:col-span-2">
          {initial ? (
            <YouTubePlayer
              ref={playerRef}
              initial={initial}
              canControl={canControl}
              onPlay={(t) => send('play', { currentTime: t })}
              onPause={(t) => send('pause', { currentTime: t })}
              onSeek={(t) => send('seek', { time: t })}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 text-sm font-medium text-slate-300">Joining your watch party...</div>
          )}
          {activity && <p className="text-xs text-slate-500">Last activity: {activity}</p>}
          <Controls canControl={canControl} send={send} getTime={() => playerRef.current?.getTime() ?? 0} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <ParticipantList participants={participants} meId={user.id} isHost={role === 'host'} send={send} />
          {canControl && <RequestsPanel requests={requests} send={send} />}
          <Chat messages={messages} send={send} />
        </div>
      </div>
    </div>
  );
};

export default Room;
