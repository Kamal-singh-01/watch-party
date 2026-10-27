import mongoose from "mongoose";

// The saved part of a room. Live playback + participants live in memory (socket/roomState.js).
const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    videoId: { type: String, default: "M7lc1UVf-VE" },
    roles: { type: Map, of: String, default: {} }, // userId -> "moderator" | "participant"
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
