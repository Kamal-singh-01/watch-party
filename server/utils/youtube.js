// Accepts an 11-character video id or any common YouTube link. Returns the id or null.
export const extractVideoId = (input) => {
  if (!input || typeof input !== "string") return null;
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  const match = value.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return match ? match[1] : null;
};
