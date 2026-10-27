const ParticipantList = ({ participants, meId, isHost, send }) => (
  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-bold text-slate-900">People here</h3><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{participants.length}</span></div>
    <ul className="flex flex-col gap-2">
      {participants.map((p) => (
        <li key={p.userId} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span>
              {p.username}
              {p.userId === meId && ' (you)'}
            </span>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">{p.role}</span>
          </div>
          {isHost && p.role !== 'host' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                className="max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                value={p.role}
                onChange={(e) => send('assign_role', { userId: p.userId, role: e.target.value })}
              >
                <option value="participant">participant</option>
                <option value="moderator">moderator</option>
              </select>
              <button className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700" onClick={() => send('transfer_host', { userId: p.userId })}>
                Make host
              </button>
              <button className="rounded-lg border border-red-100 bg-white px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50" onClick={() => send('remove_participant', { userId: p.userId })}>
                Remove
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default ParticipantList;
