// No 0/O/1/I so codes are easy to read out loud.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateRoomCode = () => {
  let code = "";
  for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
};
