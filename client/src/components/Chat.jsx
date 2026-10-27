import { useEffect, useRef, useState } from 'react';

const Chat = ({ messages, send }) => {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    send('chat_message', { text });
    setText('');
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-slate-900">Live chat</h3><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">● Live</span></div>
      <div className="mb-3 flex h-56 flex-col gap-2 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm">
        {messages.map((m, i) =>
          m.system ? (
            <p key={i} className="rounded-lg bg-white px-2.5 py-1.5 text-xs italic text-slate-400">{m.text}</p>
          ) : (
            <p key={i} className="break-words rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
              <b className="text-indigo-700">{m.username}</b> <span className="text-xs text-slate-400">({m.role})</span><span className="block text-slate-700">{m.text}</span>
            </p>
          )
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="Say something…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Send</button>
      </form>
    </div>
  );
};

export default Chat;
