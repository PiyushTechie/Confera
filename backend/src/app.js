import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import passport from "passport";
import "./config/passportConfig.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Room structure
const rooms = {};

io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED::", socket.id);

  // 1. GUEST JOIN REQUEST
  socket.on("request-join", ({ path, username, passcode }) => {
    // If room doesn't exist, reject
    if (!rooms[path]) {
      socket.emit("invalid-meeting");
      return;
    }

    const room = rooms[path];

    // Check Lock Status
    if (room.isLocked) {
        socket.emit("meeting-locked");
        return;
    }

    // Check Passcode
    if (room.passcode && room.passcode !== passcode) {
      socket.emit("passcode-required");
      return;
    }

    rooms[path].waiting.push({
      socketId: socket.id,
      username: username || "Guest",
    });
    socket.join(path);
    socket.roomPath = path;

    if (rooms[path].hostId) {
      io.to(rooms[path].hostId).emit("update-waiting-list", rooms[path].waiting);
    }
  });

  // 2. JOIN CALL (Host or Admitted Guest)
  socket.on("join-call", ({ path, username, passcode }) => {
    if (!rooms[path]) {
      rooms[path] = { 
        users: [], 
        waiting: [], 
        hostId: socket.id, 
        passcode: passcode || null,
        isLocked: false // Default unlocked
      }; 
    }
    
    if (!rooms[path].hostId) {
      rooms[path].hostId = socket.id;
      if (passcode) rooms[path].passcode = passcode;
    }

    rooms[path].waiting = rooms[path].waiting.filter((u) => u.socketId !== socket.id);

    const userData = {
      socketId: socket.id,
      username: username || "Guest",
      isMuted: false,
      isVideoOff: false,
      isHandRaised: false
    };

    rooms[path].users.push(userData);
    socket.join(path);
    socket.roomPath = path;

    io.to(path).emit("update-host-id", rooms[path].hostId);
    
    const otherUsers = rooms[path].users.filter(u => u.socketId !== socket.id);
    socket.emit("all-users", otherUsers);

    // Sync Lock State with new user (especially if it's the host rejoining)
    socket.emit("lock-update", rooms[path].isLocked);

    socket.to(path).emit("user-joined", userData);
    
    if (rooms[path].hostId === socket.id) {
      socket.emit("update-waiting-list", rooms[path].waiting);
    }
  });

  // --- HOST CONTROLS ---

  socket.on("toggle-lock", () => {
      const room = rooms[socket.roomPath];
      if(room && room.hostId === socket.id) {
          room.isLocked = !room.isLocked;
          // Important: Broadcast to the specific room path
          io.to(socket.roomPath).emit("lock-update", room.isLocked); 
          console.log(`Room ${socket.roomPath} lock status: ${room.isLocked}`);
      }
  });

  socket.on("kick-user", (targetSocketId) => {
      const room = rooms[socket.roomPath];
      if(room && room.hostId === socket.id) {
          io.to(targetSocketId).emit("kicked");
          const userIndex = room.users.findIndex(u => u.socketId === targetSocketId);
          if (userIndex !== -1) {
              room.users.splice(userIndex, 1);
              io.to(socket.roomPath).emit("user-left", targetSocketId);
          }
      }
  });

  socket.on("mute-all", () => {
      const room = rooms[socket.roomPath];
      if(room && room.hostId === socket.id) {
          socket.to(socket.roomPath).emit("force-mute");
      }
  });

  socket.on("stop-video-all", () => {
      const room = rooms[socket.roomPath];
      if(room && room.hostId === socket.id) {
          socket.to(socket.roomPath).emit("force-stop-video");
      }
  });

  socket.on("end-meeting-for-all", () => {
      const path = socket.roomPath;
      const room = rooms[path];
      if(room && room.hostId === socket.id) {
          io.to(path).emit("meeting-ended");
          delete rooms[path];
      }
  });

  // --- STATE SYNC ---

  socket.on("admit-user", (targetSocketId) => {
    const room = Object.values(rooms).find((r) => r.waiting.some((u) => u.socketId === targetSocketId));
    if (room) {
      room.waiting = room.waiting.filter((u) => u.socketId !== targetSocketId);
      io.to(targetSocketId).emit("admitted");
      if (room.hostId) io.to(room.hostId).emit("update-waiting-list", room.waiting);
    }
  });

  socket.on("signal", (toId, message) => {
    io.to(toId).emit("signal", socket.id, message);
  });

  socket.on("toggle-audio", ({ isMuted }) => {
    const path = socket.roomPath;
    if (rooms[path]) {
      const user = rooms[path].users.find((u) => u.socketId === socket.id);
      if (user) {
        user.isMuted = isMuted;
        socket.to(path).emit("audio-toggled", { socketId: socket.id, isMuted });
      }
    }
  });

  socket.on("toggle-video", ({ isVideoOff }) => {
    const path = socket.roomPath;
    if (rooms[path]) {
      const user = rooms[path].users.find((u) => u.socketId === socket.id);
      if (user) {
        user.isVideoOff = isVideoOff;
        socket.to(path).emit("video-toggled", { socketId: socket.id, isVideoOff });
      }
    }
  });

  socket.on("toggle-hand", ({ isRaised }) => {
    const path = socket.roomPath;
    if (rooms[path]) {
      const user = rooms[path].users.find((u) => u.socketId === socket.id);
      if (user) {
        user.isHandRaised = isRaised;
        io.to(path).emit("hand-toggled", { socketId: socket.id, isRaised });
      }
    }
  });

  socket.on("send-message", (data) => {
    const path = socket.roomPath;
    if (path) socket.to(path).emit("receive-message", data);
  });

  socket.on("send-emoji", ({ emoji }) => {
    const path = socket.roomPath;
    if (path) io.to(path).emit("emoji-received", { socketId: socket.id, emoji });
  });

  socket.on("disconnect", () => {
    for (const path in rooms) {
      const room = rooms[path];
      const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
      
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        socket.to(path).emit("user-left", socket.id); 

        if (room.hostId === socket.id && room.users.length > 0) {
          room.hostId = room.users[0].socketId;
          io.to(room.hostId).emit("update-waiting-list", room.waiting);
        }
      }

      room.waiting = room.waiting.filter((u) => u.socketId !== socket.id);
      if (room.hostId) io.to(room.hostId).emit("update-waiting-list", room.waiting);

      if (room.users.length === 0 && room.waiting.length === 0) {
        delete rooms[path];
      }
    }
  });
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

start();