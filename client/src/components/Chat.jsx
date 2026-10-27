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
    <div className="border p-3">
      <h3 className="font-bold mb-2">Chat</h3>
      <div className="h-48 overflow-y-auto text-sm flex flex-col gap-1 mb-2">
        {messages.map((m, i) =>
          m.system ? (
            <p key={i} className="text-gray-500 italic">{m.text}</p>
          ) : (
            <p key={i}>
              <b>{m.username}</b> <span className="text-xs text-gray-500">({m.role})</span>: {m.text}
            </p>
          )
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input className="border p-1 flex-1" placeholder="Say something" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="border px-3">Send</button>
      </form>
    </div>
  );
};

export default Chat;
