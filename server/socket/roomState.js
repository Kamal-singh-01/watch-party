import RoomModel from "../models/Room.js";
import { can } from "./permissions.js";

const DEFAULT_VIDEO = "M7lc1UVf-VE";

// code -> Room (only rooms that currently have people in them)
export const rooms = new Map();

// One live watch room: who is in it, what the video is doing, and pending requests.
export class Room {
  constructor(io, { code, hostId, videoId, roles }) {
    this.io = io;
    this.code = code;
    this.hostId = hostId;
    this.roles = new Map(Object.entries(roles || {})); // saved role assignments
    this.participants = new Map(); // userId -> { userId, username, role, socketId }
    this.kicked = new Set();
    this.requests = new Map(); // requestId -> request
    this.requestCounter = 0;
    this.state = {
      videoId: videoId || DEFAULT_VIDEO,
      playState: "paused",
      currentTime: 0,
      updatedAt: Date.now(),
    };
  }

  // ----- people -----
  roleOf(userId) {
    if (userId === this.hostId) return "host";
    return this.roles.get(userId) || "participant";
  }

  addParticipant(user, socketId) {
    const participant = {
      userId: user.id,
      username: user.username,
      role: this.roleOf(user.id),
      socketId,
    };
    this.participants.set(user.id, participant);
    return participant;
  }

  // The list we send to clients (no socket ids).
  list() {
    return [...this.participants.values()].map(({ userId, username, role }) => ({
      userId,
      username,
      role,
    }));
  }

  // ----- playback -----
  // Where the video is right now. While playing, time keeps moving on the server.
  currentTime() {
    if (this.state.playState !== "playing") return this.state.currentTime;
    return this.state.currentTime + (Date.now() - this.state.updatedAt) / 1000;
  }

  snapshot() {
    return {
      videoId: this.state.videoId,
      playState: this.state.playState,
      currentTime: this.currentTime(),
      serverTime: Date.now(),
    };
  }

  applyAction(type, payload = {}) {
    const s = this.state;
    const time = typeof payload.currentTime === "number" ? payload.currentTime : this.currentTime();

    if (type === "play") {
      s.currentTime = time;
      s.playState = "playing";
    } else if (type === "pause") {
      s.currentTime = time;
      s.playState = "paused";
    } else if (type === "seek") {
      s.currentTime = Math.max(0, Number(payload.time) || 0);
    } else if (type === "change_video") {
      s.videoId = payload.videoId;
      s.currentTime = 0;
      s.playState = "playing";
    } else {
      throw new Error("Unknown action");
    }
    s.updatedAt = Date.now();
  }

  // ----- approval requests (from participants) -----
  addRequest(participant, type, payload) {
    const id = String(++this.requestCounter);
    this.requests.set(id, {
      id,
      userId: participant.userId,
      username: participant.username,
      type,
      payload,
    });
    return id;
  }

  // ----- sending -----
  broadcast(event, data) {
    this.io.to(this.code).emit(event, data);
  }

  emitTo(userId, event, data) {
    const p = this.participants.get(userId);
    if (p) this.io.to(p.socketId).emit(event, data);
  }

  // Only people who can approve (host/moderators) get the pending list.
  sendRequestsToApprovers() {
    const requests = [...this.requests.values()];
    for (const p of this.participants.values()) {
      if (can(p.role, "approve_request")) {
        this.io.to(p.socketId).emit("requests_updated", { requests });
      }
    }
  }
}

// Get a live room, loading it from MongoDB the first time (so rooms survive restarts).
export const getOrLoadRoom = async (io, code) => {
  if (rooms.has(code)) return rooms.get(code);
  const doc = await RoomModel.findOne({ code }).lean();
  if (!doc) return null;
  const room = new Room(io, doc);
  rooms.set(code, room);
  return room;
};

// Save the parts that must survive a restart: host, current video, assigned roles.
export const persistRoom = async (room) =>
  RoomModel.updateOne(
    { code: room.code },
    { hostId: room.hostId, videoId: room.state.videoId, roles: Object.fromEntries(room.roles) }
  );
