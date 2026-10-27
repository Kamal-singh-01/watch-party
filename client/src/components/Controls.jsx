import { useState } from 'react';

// Host/Moderator: buttons act immediately.
// Participant: the same buttons send a request that needs approval.
const Controls = ({ canControl, send, getTime }) => {
  const [seekValue, setSeekValue] = useState('');
  const [url, setUrl] = useState('');
  const prefix = canControl ? '' : 'Request ';

  const act = (type, extra = {}) =>
    canControl ? send(type, extra) : send('request_change', { type, ...extra });

  const btn = 'border px-3 py-1';

  return (
    <div className="border p-3 mt-3 flex flex-col gap-3">
      <p className="text-sm">
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
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(seekValue);
          if (Number.isNaN(n)) return;
          act('seek', { time: n });
          setSeekValue('');
        }}
      >
        <input className="border p-1 w-32" placeholder="Seconds" value={seekValue} onChange={(e) => setSeekValue(e.target.value)} />
        <button className={btn}>{prefix}Seek</button>
      </form>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          act('change_video', { videoId: url.trim() });
          setUrl('');
        }}
      >
        <input className="border p-1 flex-1" placeholder="Paste a YouTube URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className={btn}>{prefix}Change video</button>
      </form>
    </div>
  );
};

export default Controls;
