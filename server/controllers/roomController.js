import Room from "../models/Room.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";

// The creator becomes the host: their user id is saved as hostId.
export const createRoom = async (req, res) => {
  try {
    let code;
    do {
      code = generateRoomCode();
    } while (await Room.exists({ code }));

    await Room.create({ code, hostId: req.user._id.toString() });
    res.status(201).json({ success: true, code });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkRoom = async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const exists = await Room.exists({ code });
    if (!exists) return res.status(404).json({ success: false, message: "Room not found" });
    res.json({ success: true, code });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
