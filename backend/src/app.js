import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import helmet from "helmet";

// 1. Import User Model for Hex Token Validation
import { User } from "./models/user.js"; 

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

// 🔐 UPDATED: Auth for Crypto Hex Tokens (Database Lookup)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    // 1. If NO token, allow them as a Guest
    if (!token) {
      socket.user = { role: "guest", username: "Guest" };
      return next();
    }

    // 2. If Token exists, search MongoDB
    // We look for a user who has this specific token string
    const user = await User.findOne({ token: token });

    if (user) {
      // ✅ Found valid user
      socket.user = { 
        username: user.name, // Using 'name' from your schema
        userId: user._id, 
        role: "user" 
      };
      return next();
    } else {
      // ❌ Token sent, but not found in DB (Old/Invalid)
      // We reject to force the frontend to clear the bad token
      return next(new Error("Invalid authentication token"));
    }

  } catch (err) {
    console.error("Socket Auth Error:", err);
    return next(new Error("Internal Server Error"));
  }
});

// 🔐 Secure Engine.IO handshake
io.engine.use(helmet());

/* ================= SOCKET RATE LIMITING ================= */

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

/* ================= SOCKET LOGIC ================= */

io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED::", socket.id);

  const isAuthorizedHost = () => {
    const path = socket.roomPath;
    return path && rooms[path] && rooms[path].hostId === socket.id;
  };

  /* -------- 1. GUEST JOIN REQUEST -------- */
  socket.on("request-join", ({ path, username, passcode }) => {
    if (!rateLimitSocket(socket, "request-join")) return;

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

    // Use name from DB if logged in, otherwise use passed username or "Guest"
    const finalName = socket.user?.role === "user" ? socket.user.username : (username || "Guest");

    room.waiting.push({
      socketId: socket.id,
      username: finalName,
    });

    socket.join(path);
    socket.roomPath = path;

    if (room.hostId) {
      io.to(room.hostId).emit("update-waiting-list", room.waiting);
    }
  });

  /* -------- 2. JOIN CALL -------- */
  socket.on("join-call", ({ path, username, passcode }) => {
    if (!rateLimitSocket(socket, "join-call")) return;

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

    const finalName = socket.user?.role === "user" ? socket.user.username : (username || "Guest");

    const userData = {
      socketId: socket.id,
      username: finalName,
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
    if (!rateLimitSocket(socket, "signal")) return;
    io.to(toId).emit("signal", socket.id, message);
  });

  // 📝 CAPTIONS (Your Logic Added Here)
  socket.on("send-caption", ({ roomId, caption, username }) => {
    if (!rateLimitSocket(socket, "send-caption")) return;
    
    // Broadcast to everyone ELSE in room
    socket.to(roomId).emit("receive-caption", {
      caption,
      username: username || "Speaker"
    });
  });

  socket.on("send-message", (data) => {
    if (!rateLimitSocket(socket, "send-message")) return;
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