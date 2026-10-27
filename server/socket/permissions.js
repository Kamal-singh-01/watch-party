// Who may do what. Every socket event is checked against this BEFORE it runs.
const PERMISSIONS = {
  host: [
    "play", "pause", "seek", "change_video",
    "assign_role", "remove_participant", "transfer_host",
    "approve_request", "chat",
  ],
  moderator: ["play", "pause", "seek", "change_video", "approve_request", "chat"],
  participant: ["request_change", "chat"],
};

export const can = (role, action) => PERMISSIONS[role]?.includes(action) ?? false;

export const isAssignableRole = (role) => role === "moderator" || role === "participant";
