import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import helmet from "helmet";
import scheduleRoutes from "./routes/scheduleRoutes.js";
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

app.use("/auth", authLimiter, authRoutes);
app.use("/api/v1/users", apiLimiter, userRoutes);
app.use("/api/schedule", scheduleRoutes);
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.user = { role: "guest", username: "Guest" };
      return next();
    }
    const user = await User.findOne({ token: token });
    if (user) {
      socket.user = { 
        username: user.name,
        userId: user._id, 
        role: "user" 
      };
      return next();
    } else {
      return next(new Error("Invalid authentication token"));
    }
  } catch (err) {
    console.error("Socket Auth Error:", err);
    return next(new Error("Internal Server Error"));
  }
});
io.engine.use(helmet());

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

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of socketRateMap.entries()) {
    if (now - value.start > RATE_LIMIT.windowMs) {
      socketRateMap.delete(key);
    }
  }
}, RATE_LIMIT.windowMs);

const rooms = {};

io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED::", socket.id);

  const isAuthorizedHost = () => {
    const path = socket.roomPath;
    return path && rooms[path] && rooms[path].hostId === socket.id;
  };

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

  socket.on("join-call", ({ path, username, passcode }) => {
    if (!rateLimitSocket(socket, "join-call")) return;

    if (!rooms[path]) {
      rooms[path] = {
        users: [],
        waiting: [],
        hostId: null,
        passcode: passcode || null,
        isLocked: false,
      };
    }

    const room = rooms[path];
    if (!room.hostId) {
       if (socket.user?.role === "user") {
           room.hostId = socket.id;
           if (passcode) room.passcode = passcode; 
       }
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
      isHost: room.hostId === socket.id
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

  socket.on("toggle-lock", () => {
    if (isAuthorizedHost()) {
      const room = rooms[socket.roomPath];
      room.isLocked = !room.isLocked;
      io.to(socket.roomPath).emit("lock-update", room.isLocked);
    }
  });

  socket.on("toggle-hand", ({ isRaised }) => {
    const path = socket.roomPath;
    if (rooms[path]) {
      const user = rooms[path].users.find((u) => u.socketId === socket.id);
      if (user) {
        user.isHandRaised = isRaised;
        io.to(path).emit("hand-toggled", { 
            socketId: socket.id, 
            isRaised,
            username: user.username 
        });
      }
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

  socket.on("send-caption", ({ roomId, caption, username }) => {
    if (!rateLimitSocket(socket, "send-caption")) return;
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

  const handleUserLeave = () => {
    // 1. Cleanup Rate Limits
    const keysToDelete = [];
    for (const key of socketRateMap.keys()) {
        if (key.startsWith(socket.id)) keysToDelete.push(key);
    }
    keysToDelete.forEach(k => socketRateMap.delete(k));

    const path = socket.roomPath; 
    
    if (!path || !rooms[path]) return;

    const room = rooms[path];
    const userIndex = room.users.findIndex((u) => u.socketId === socket.id);

    if (userIndex !== -1) {
      room.users.splice(userIndex, 1);
      io.to(path).emit("user-left", socket.id);

      if (room.hostId === socket.id) {
        if (room.users.length > 0) {
          const newHost = room.users[0];
          room.hostId = newHost.socketId;
          
          io.to(path).emit("update-host-id", room.hostId);
          io.to(room.hostId).emit("update-waiting-list", room.waiting);
        } else {
            room.hostId = null; 
        }
      }
    }

    room.waiting = room.waiting.filter((u) => u.socketId !== socket.id);

    if (room.users.length === 0 && room.waiting.length === 0) {
      delete rooms[path];
    }
  };

  socket.on("disconnect", () => {
    handleUserLeave();
  });

  socket.on("leave-room", () => {
    handleUserLeave();
    socket.leave(socket.roomPath);
    socket.roomPath = null;
  });

});

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