import jwt from "jsonwebtoken";
import { can, isAssignableRole } from "./permissions.js";
import { rooms, getOrLoadRoom, persistRoom } from "./roomState.js";
import { extractVideoId } from "../utils/youtube.js";

export const initSocket = (io) => {
  // Runs once per connection: no valid JWT = no socket.
  io.use((socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.data.user = { id: decoded.id, username: decoded.username };
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    // Wraps every event after join_room:
    // find room + caller -> check permission -> run handler -> report errors to the sender only.
    const handle = (event, action, fn) => {
      socket.on(event, async (data) => {
        try {
          const room = rooms.get(socket.data.roomId);
          const me = room?.participants.get(user.id);
          if (!room || !me) throw new Error("You are not in a room");
          if (action && !can(me.role, action)) {
            throw new Error(`Permission denied: ${me.role} cannot ${action}`);
          }
          await fn({ room, me, data: data || {} });
        } catch (error) {
          socket.emit("room_error", { event, message: error.message });
        }
      });
    };

    // ---------- join / leave ----------
    socket.on("join_room", async (data) => {
      try {
        const code = String(data?.roomId || "").trim().toUpperCase();
        const room = await getOrLoadRoom(io, code);
        if (!room) throw new Error("Room not found");
        if (room.kicked.has(user.id)) throw new Error("You were removed from this room");

        // Same user opened a second tab: close the older one.
        const old = room.participants.get(user.id);
        if (old && old.socketId !== socket.id) {
          io.to(old.socketId).emit("removed", { reason: "You joined from another tab" });
          const oldSocket = io.sockets.sockets.get(old.socketId);
          if (oldSocket) {
            oldSocket.leave(code);
            oldSocket.data.roomId = null;
          }
        }

        const me = room.addParticipant(user, socket.id);
        socket.join(code);
        socket.data.roomId = code;

        socket.emit("room_joined", {
          roomId: code,
          you: { userId: me.userId, username: me.username, role: me.role },
          participants: room.list(),
          state: room.snapshot(),
        });
        socket.to(code).emit("user_joined", {
          username: me.username,
          userId: me.userId,
          role: me.role,
          participants: room.list(),
        });
        room.sendRequestsToApprovers();
      } catch (error) {
        socket.emit("room_error", { event: "join_room", message: error.message });
      }
    });

    const leaveRoom = () => {
      const code = socket.data.roomId;
      const room = rooms.get(code);
      const me = room?.participants.get(user.id);
      // Ignore if this user already reconnected on a newer socket.
      if (!room || !me || me.socketId !== socket.id) return;

      room.participants.delete(user.id);
      socket.leave(code);
      socket.data.roomId = null;
      room.broadcast("user_left", {
        username: me.username,
        userId: me.userId,
        participants: room.list(),
      });
      if (room.participants.size === 0) rooms.delete(code); // saved in MongoDB, reloaded on next join
    };

    socket.on("leave_room", leaveRoom);
    socket.on("disconnect", leaveRoom);

    // ---------- playback: host + moderator only ----------
    ["play", "pause", "seek", "change_video"].forEach((type) => {
      handle(type, type, async ({ room, data }) => {
        const payload = {};

        if (type === "play" || type === "pause") {
          if (typeof data.currentTime === "number") payload.currentTime = data.currentTime;
        } else if (type === "seek") {
          if (typeof data.time !== "number") throw new Error("time must be a number");
          payload.time = data.time;
        } else if (type === "change_video") {
          const videoId = extractVideoId(data.videoId);
          if (!videoId) throw new Error("Invalid YouTube URL or id");
          payload.videoId = videoId;
        }

        room.applyAction(type, payload);
        if (type === "change_video") await persistRoom(room);
        room.broadcast("sync_state", { ...room.snapshot(), by: user.username, action: type });
      });
    });

    // ---------- roles: host only ----------
    handle("assign_role", "assign_role", async ({ room, data }) => {
      const { userId, role } = data;
      if (!isAssignableRole(role)) throw new Error("Role must be moderator or participant");
      const target = room.participants.get(userId);
      if (!target) throw new Error("User is not in the room");
      if (userId === room.hostId) throw new Error("Cannot change the host's role");

      room.roles.set(userId, role);
      target.role = role;
      await persistRoom(room);
      room.broadcast("role_assigned", {
        userId,
        username: target.username,
        role,
        participants: room.list(),
      });
      room.sendRequestsToApprovers();
    });

    handle("remove_participant", "remove_participant", async ({ room, me, data }) => {
      const target = room.participants.get(data.userId);
      if (!target) throw new Error("User is not in the room");
      if (target.userId === me.userId) throw new Error("The host cannot remove themselves");

      room.kicked.add(target.userId);
      room.participants.delete(target.userId);
      io.to(target.socketId).emit("removed", { reason: "You were removed by the host" });
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.leave(room.code);
        targetSocket.data.roomId = null;
      }
      room.broadcast("participant_removed", { userId: target.userId, participants: room.list() });
    });

    handle("transfer_host", "transfer_host", async ({ room, me, data }) => {
      const target = room.participants.get(data.userId);
      if (!target || target.userId === me.userId) throw new Error("Pick another participant in the room");

      room.hostId = target.userId;
      room.roles.delete(target.userId);
      room.roles.set(me.userId, "moderator"); // old host stays useful as a moderator
      me.role = "moderator";
      target.role = "host";
      await persistRoom(room);
      room.broadcast("host_transferred", { userId: target.userId, participants: room.list() });
      room.sendRequestsToApprovers();
    });

    // ---------- approval flow ----------
    handle("request_change", "request_change", async ({ room, me, data }) => {
      const payload = {};
      if (data.type === "change_video") {
        payload.videoId = extractVideoId(data.videoId);
        if (!payload.videoId) throw new Error("Invalid YouTube URL or id");
      } else if (data.type === "seek") {
        if (typeof data.time !== "number") throw new Error("time must be a number");
        payload.time = data.time;
      } else if (data.type !== "play" && data.type !== "pause") {
        throw new Error("Unknown request type");
      }

      room.addRequest(me, data.type, payload);
      room.sendRequestsToApprovers();
      socket.emit("request_sent", { type: data.type });
    });

    handle("approve_request", "approve_request", async ({ room, data }) => {
      const request = room.requests.get(String(data.requestId));
      if (!request) throw new Error("Request not found");

      room.requests.delete(request.id);
      room.applyAction(request.type, request.payload);
      if (request.type === "change_video") await persistRoom(room);
      room.broadcast("sync_state", { ...room.snapshot(), by: request.username, action: request.type });
      room.emitTo(request.userId, "request_resolved", { type: request.type, approved: true });
      room.sendRequestsToApprovers();
    });

    handle("reject_request", "approve_request", async ({ room, data }) => {
      const request = room.requests.get(String(data.requestId));
      if (!request) throw new Error("Request not found");

      room.requests.delete(request.id);
      room.emitTo(request.userId, "request_resolved", { type: request.type, approved: false });
      room.sendRequestsToApprovers();
    });

    // ---------- chat ----------
    handle("chat_message", "chat", async ({ room, me, data }) => {
      const text = String(data.text || "").trim().slice(0, 500);
      if (!text) return;
      room.broadcast("chat_message", {
        userId: me.userId,
        username: me.username,
        role: me.role,
        text,
        at: Date.now(),
      });
    });
  });
};
