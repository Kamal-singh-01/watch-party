const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const describe = (r) => {
  if (r.type === 'seek') return `seek to ${formatTime(r.payload.time)}`;
  if (r.type === 'change_video') return `change video (${r.payload.videoId})`;
  return r.type;
};

// Visible to host and moderators only.
const RequestsPanel = ({ requests, send }) => (
  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-bold text-slate-900">Pending requests</h3><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{requests.length}</span></div>
    {requests.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">You’re all caught up. No pending requests.</p>}
    <ul className="flex flex-col gap-2">
      {requests.map((r) => (
        <li key={r.id} className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm sm:flex-row sm:items-center">
          <span>{r.username} wants to {describe(r)}</span>
          <span className="flex shrink-0 gap-2">
            <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700" onClick={() => send('approve_request', { requestId: r.id })}>Approve</button>
            <button className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50" onClick={() => send('reject_request', { requestId: r.id })}>Reject</button>
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default RequestsPanel;
