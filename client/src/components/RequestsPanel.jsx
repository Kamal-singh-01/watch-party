const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const describe = (r) => {
  if (r.type === 'seek') return `seek to ${formatTime(r.payload.time)}`;
  if (r.type === 'change_video') return `change video (${r.payload.videoId})`;
  return r.type;
};

// Visible to host and moderators only.
const RequestsPanel = ({ requests, send }) => (
  <div className="border p-3">
    <h3 className="font-bold mb-2">Pending requests ({requests.length})</h3>
    {requests.length === 0 && <p className="text-sm">No requests right now.</p>}
    <ul className="flex flex-col gap-2">
      {requests.map((r) => (
        <li key={r.id} className="text-sm flex justify-between items-center gap-2">
          <span>{r.username} wants to {describe(r)}</span>
          <span className="flex gap-1">
            <button className="border px-2" onClick={() => send('approve_request', { requestId: r.id })}>Approve</button>
            <button className="border px-2" onClick={() => send('reject_request', { requestId: r.id })}>Reject</button>
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default RequestsPanel;
