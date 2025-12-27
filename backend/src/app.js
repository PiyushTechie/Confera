import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import helmet from "helmet";
import jwt from "jsonwebtoken"; // 🔐 NEW

import { authLimiter, apiLimiter } from "./middlewares/limiters.js";
import "./config/passportConfig.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const server = createServer(app);

app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false }));

const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));
mongoose.set("sanitizeFilter", true);
app.use(passport.initialize());

const io = new Server(server, { cors: corsOptions });

const PORT = process.env.PORT || 8000;

/* ================= ROUTES ================= */

app.use("/auth", authLimiter, authRoutes);
app.use("/api/v1/users", apiLimiter, userRoutes);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* ================= SOCKET SECURITY ================= */

// 🔐 NEW: Socket JWT auth (guest + logged-in users)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Socket token missing"));

    const payload = jwt.verify(token, process.env.SOCKET_SECRET);
    socket.user = payload; // { role, userId?, roomId?, username? }

    next();
  } catch {
    next(new Error("Invalid or expired socket token"));
  }
});

// 🔐 Secure Engine.IO handshake
io.engine.use(helmet());

/* ================= SOCKET RATE LIMITING ================= */

// 🚦 NEW
const RATE_LIMIT = { windowMs: 10_000, max: 20 };
const socketRateMap = new Map();

const rateLimitSocket = (socket, event) => {
  const key = `${socket.id}:${event}`;
  const now = Date.now();

  if (!socketRateMap.has(key)) {
    socketRateMap.set(key, { count: 1, start: now });
    return true;
  }

  const data = socketRateMap.get(key);

  if (now - data.start > RATE_LIMIT.windowMs) {
    socketRateMap.set(key, { count: 1, start: now });
    return true;
  }

  if (data.count >= RATE_LIMIT.max) return false;

  data.count++;
  return true;
};

/* ================= ROOM MEMORY ================= */

const rooms = {};

/* ================= SOCKET LOGIC (UNCHANGED) ================= */

io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED::", socket.id);

  const isAuthorizedHost = () => {
    const path = socket.roomPath;
    return path && rooms[path] && rooms[path].hostId === socket.id;
  };

  /* -------- 1. GUEST JOIN REQUEST -------- */
  socket.on("request-join", ({ path, username, passcode }) => {
    if (!rateLimitSocket(socket, "request-join")) return; // 🚦 NEW

    if (!rooms[path]) {
      socket.emit("invalid-meeting");
      return;
    }

    const room = rooms[path];

    if (room.isLocked) {
      socket.emit("meeting-locked");
      return;
    }

    if (room.passcode && room.passcode !== passcode) {
      socket.emit("passcode-required");
      return;
    }

    room.waiting.push({
      socketId: socket.id,
      username: username || socket.user?.username || "Guest",
    });

    socket.join(path);
    socket.roomPath = path;

    if (room.hostId) {
      io.to(room.hostId).emit("update-waiting-list", room.waiting);
    }
  });

  /* -------- 2. JOIN CALL -------- */
  socket.on("join-call", ({ path, username, passcode }) => {
    if (!rateLimitSocket(socket, "join-call")) return; // 🚦 NEW

    if (!rooms[path]) {
      rooms[path] = {
        users: [],
        waiting: [],
        hostId: socket.id,
        passcode: passcode || null,
        isLocked: false,
      };
    }

    const room = rooms[path];

    if (!room.hostId) {
      room.hostId = socket.id;
      if (passcode) room.passcode = passcode;
    }

    room.waiting = room.waiting.filter(
      (u) => u.socketId !== socket.id
    );

    const userData = {
      socketId: socket.id,
      username: username || socket.user?.username || "Guest",
      isMuted: false,
      isVideoOff: false,
      isHandRaised: false,
    };

    room.users.push(userData);
    socket.join(path);
    socket.roomPath = path;

    io.to(path).emit("update-host-id", room.hostId);

    const otherUsers = room.users.filter(
      (u) => u.socketId !== socket.id
    );
    socket.emit("all-users", otherUsers);
    socket.emit("lock-update", room.isLocked);
    socket.to(path).emit("user-joined", userData);

    if (room.hostId === socket.id) {
      socket.emit("update-waiting-list", room.waiting);
    }
  });

  /* -------- HOST CONTROLS -------- */

  socket.on("toggle-lock", () => {
    if (isAuthorizedHost()) {
      const room = rooms[socket.roomPath];
      room.isLocked = !room.isLocked;
      io.to(socket.roomPath).emit("lock-update", room.isLocked);
    }
  });

  socket.on("transfer-host", (newHostId) => {
    if (isAuthorizedHost()) {
      const room = rooms[socket.roomPath];
      room.hostId = newHostId;
      io.to(socket.roomPath).emit("update-host-id", newHostId);
      io.to(newHostId).emit("update-waiting-list", room.waiting);
    }
  });

  socket.on("kick-user", (targetSocketId) => {
    if (isAuthorizedHost()) {
      const room = rooms[socket.roomPath];
      io.to(targetSocketId).emit("kicked");
      room.users = room.users.filter(
        (u) => u.socketId !== targetSocketId
      );
      io.to(socket.roomPath).emit("user-left", targetSocketId);
    }
  });

  socket.on("mute-all", () => {
    if (isAuthorizedHost()) {
      socket.to(socket.roomPath).emit("force-mute");
    }
  });

  socket.on("stop-video-all", () => {
    if (isAuthorizedHost()) {
      socket.to(socket.roomPath).emit("force-stop-video");
    }
  });

  socket.on("end-meeting-for-all", () => {
    if (isAuthorizedHost()) {
      const path = socket.roomPath;
      io.to(path).emit("meeting-ended");
      delete rooms[path];
    }
  });

  socket.on("admit-user", (targetSocketId) => {
    if (isAuthorizedHost()) {
      const room = rooms[socket.roomPath];
      const isWaiting = room.waiting.some(
        (u) => u.socketId === targetSocketId
      );

      if (isWaiting) {
        room.waiting = room.waiting.filter(
          (u) => u.socketId !== targetSocketId
        );
        io.to(targetSocketId).emit("admitted");
        socket.emit("update-waiting-list", room.waiting);
      }
    }
  });

  /* -------- STATE SYNC -------- */

  socket.on("signal", (toId, message) => {
    if (!rateLimitSocket(socket, "signal")) return; // 🚦 NEW
    io.to(toId).emit("signal", socket.id, message);
  });

  socket.on("send-caption", ({ roomId, caption, username }) => {
    if (!rateLimitSocket(socket, "send-caption")) return; 

    socket.to(roomId).emit("receive-caption", {
      caption,
      username: username || "Speaker"
    });
  });

  socket.on("send-message", (data) => {
    if (!rateLimitSocket(socket, "send-message")) return; // 🚦 NEW
    if (socket.roomPath)
      socket.to(socket.roomPath).emit("receive-message", data);
  });

  socket.on("send-emoji", ({ emoji }) => {
    if (socket.roomPath)
      io.to(socket.roomPath).emit("emoji-received", {
        socketId: socket.id,
        emoji,
      });
  });

  /* -------- DISCONNECT -------- */

  socket.on("disconnect", () => {
    for (const path in rooms) {
      const room = rooms[path];

      const userIndex = room.users.findIndex(
        (u) => u.socketId === socket.id
      );

      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        socket.to(path).emit("user-left", socket.id);

        if (room.hostId === socket.id && room.users.length > 0) {
          room.hostId = room.users[0].socketId;
          io.to(room.hostId).emit(
            "update-waiting-list",
            room.waiting
          );
          io.to(path).emit("update-host-id", room.hostId);
        }
      }

      room.waiting = room.waiting.filter(
        (u) => u.socketId !== socket.id
      );

      if (room.users.length === 0 && room.waiting.length === 0) {
        delete rooms[path];
      }
    }
  });
});

/* ================= START SERVER ================= */

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

start();
