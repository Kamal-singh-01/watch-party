# YouTube Watch Party

Watch YouTube videos in sync with friends. Rooms, roles, real-time sync over WebSockets.

**Live URL:** _add your Render URL here after deploying_

## Tech stack
- **Frontend:** React (Vite), Tailwind CSS, socket.io-client, YouTube IFrame API
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** email + password (bcryptjs), JWT

## Folder structure
```
youtube-watch-party/
├── package.json            # root scripts used by Render (build + start)
├── server/
│   ├── server.js           # Express + Socket.IO bootstrap, serves client build in production
│   ├── config/db.js        # MongoDB connection
│   ├── models/             # User.js, Room.js (Mongoose)
│   ├── controllers/        # authController.js, roomController.js
│   ├── routes/             # authRoutes.js, roomRoutes.js
│   ├── middleware/         # authMiddleware.js (JWT protect)
│   ├── socket/
│   │   ├── index.js        # socket auth + all event handlers
│   │   ├── roomState.js    # Room class (in-memory live state)
│   │   └── permissions.js  # role -> allowed actions
│   └── utils/              # generateToken, generateRoomCode, youtube URL parser
└── client/
    └── src/
        ├── main.jsx, App.jsx, api.js
        ├── context/AuthContext.jsx
        ├── pages/          # Login, Home, Room
        └── components/     # YouTubePlayer, Controls, ParticipantList, RequestsPanel, Chat
```

## Run locally
Requirements: Node 18+, a MongoDB Atlas connection string.

```bash
# 1. server
cd server
cp .env.example .env      # fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev               # http://localhost:4000

# 2. client (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```
To test roles, use two browser profiles (or a normal + incognito window) with two different accounts.

## Roles
| Role | Permissions |
|---|---|
| Host (room creator) | play, pause, seek, change video, assign roles, remove participants, transfer host, approve requests |
| Moderator (assigned by host) | play, pause, seek, change video, approve requests |
| Participant (default) | watch, chat, and **request** a change that the host/moderator must approve |

The server decides roles. The client never sends its own role, and every socket event is checked against `socket/permissions.js` before it runs. The UI only hides controls for convenience.

## Architecture: how WebSockets fit in
1. User logs in over HTTP and gets a JWT. Creating a room is `POST /api/rooms` (creator is saved as `hostId` in MongoDB).
2. The client opens a Socket.IO connection with the JWT. A middleware verifies it before the socket connects.
3. `join_room` puts the socket in a Socket.IO room (named by the room code). The server replies with `room_joined` (your role, participants, current video state).
4. Every action follows the same path: client emits an event -> server checks the role -> server updates the room state -> server broadcasts to everyone in the room. Rejected actions return `room_error` to the sender only.
5. **The server is the source of truth for playback.** It stores `{ videoId, playState, currentTime, updatedAt }`. A late joiner gets `currentTime + time since updatedAt` if the video is playing.
6. On the client, remote updates are applied with a short "applying" lock so they are not echoed back to the server. Seeking is detected by watching for time jumps (the IFrame API has no seek event).
7. Room roles and the current video are saved in MongoDB, so rooms survive a server restart. Live participants and pending requests stay in memory.

## Socket events
| Client -> Server | Who | Payload |
|---|---|---|
| `join_room` / `leave_room` | any | `{ roomId }` |
| `play` / `pause` | host, moderator | `{ currentTime }` |
| `seek` | host, moderator | `{ time }` |
| `change_video` | host, moderator | `{ videoId }` (id or YouTube URL) |
| `assign_role` | host | `{ userId, role }` |
| `remove_participant` | host | `{ userId }` |
| `transfer_host` | host | `{ userId }` |
| `request_change` | participant | `{ type, time?, videoId? }` |
| `approve_request` / `reject_request` | host, moderator | `{ requestId }` |
| `chat_message` | any | `{ text }` |

| Server -> Client | Meaning |
|---|---|
| `room_joined`, `sync_state` | your join data; video state broadcast |
| `user_joined`, `user_left`, `role_assigned`, `participant_removed`, `host_transferred` | updated participant list with roles |
| `requests_updated`, `request_sent`, `request_resolved` | approval flow |
| `removed`, `room_error`, `chat_message` | kicked; error to sender; chat |

## Deploy on Render (one web service)
1. Push the repo to GitHub.
2. Atlas: create a database user, and under Network Access allow `0.0.0.0/0` for the demo.
3. Render -> New Web Service -> connect the repo.
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
4. Environment variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your Render URL).
5. Express serves the built React app, so the whole app is on one URL. The free tier sleeps after inactivity, so the first load can take about 30 seconds.

## Trade-offs and future work
- Live room state is in memory, so one server instance only. For scale, add the Socket.IO Redis adapter.
- No periodic drift correction yet. Clients re-sync on every action.
- Browsers can block autoplay until the user clicks on the page.
- Not built: reactions, a dedicated host-transfer-on-disconnect timer.
