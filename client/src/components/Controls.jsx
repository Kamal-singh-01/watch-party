import { useState } from 'react';

// Host/Moderator: buttons act immediately.
// Participant: the same buttons send a request that needs approval.
const Controls = ({ canControl, send, getTime }) => {
  const [seekValue, setSeekValue] = useState('');
  const [url, setUrl] = useState('');
  const prefix = canControl ? '' : 'Request ';

  const act = (type, extra = {}) =>
    canControl ? send(type, extra) : send('request_change', { type, ...extra });

  const btn = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700';

  return (
    <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="rounded-xl bg-indigo-50 px-3 py-2.5 text-sm text-indigo-800">
        {canControl
          ? 'You can control playback for everyone.'
          : 'You can watch only. Requests are sent to the host and moderators for approval.'}
      </p>

      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => act('play', { currentTime: getTime() })}>{prefix}Play</button>
        <button className={btn} onClick={() => act('pause', { currentTime: getTime() })}>{prefix}Pause</button>
        <button className={btn} onClick={() => act('seek', { time: Math.max(0, getTime() - 10) })}>{prefix}-10s</button>
        <button className={btn} onClick={() => act('seek', { time: getTime() + 10 })}>{prefix}+10s</button>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(seekValue);
          if (Number.isNaN(n)) return;
          act('seek', { time: n });
          setSeekValue('');
        }}
      >
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-36" placeholder="Seconds" value={seekValue} onChange={(e) => setSeekValue(e.target.value)} />
        <button className={btn}>{prefix}Seek</button>
      </form>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          act('change_video', { videoId: url.trim() });
          setUrl('');
        }}
      >
        <input className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="Paste a YouTube URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className={btn}>{prefix}Change video</button>
      </form>
    </div>
  );
};

export default Controls;
