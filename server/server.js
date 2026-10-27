import "dotenv/config";
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import { initSocket } from "./socket/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_URL } });

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ success: true }));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

initSocket(io);

// In production, Express also serves the built React app (one URL for everything).
const clientDist = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

connectDB()
  .then(() => server.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
