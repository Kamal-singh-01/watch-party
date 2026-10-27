const ParticipantList = ({ participants, meId, isHost, send }) => (
  <div className="border p-3">
    <h3 className="font-bold mb-2">Participants ({participants.length})</h3>
    <ul className="flex flex-col gap-2">
      {participants.map((p) => (
        <li key={p.userId} className="text-sm">
          <div className="flex justify-between">
            <span>
              {p.username}
              {p.userId === meId && ' (you)'}
            </span>
            <span className="border px-1">{p.role}</span>
          </div>
          {isHost && p.role !== 'host' && (
            <div className="flex gap-2 mt-1">
              <select
                className="border text-xs"
                value={p.role}
                onChange={(e) => send('assign_role', { userId: p.userId, role: e.target.value })}
              >
                <option value="participant">participant</option>
                <option value="moderator">moderator</option>
              </select>
              <button className="border px-1 text-xs" onClick={() => send('transfer_host', { userId: p.userId })}>
                Make host
              </button>
              <button className="border px-1 text-xs text-red-600" onClick={() => send('remove_participant', { userId: p.userId })}>
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
