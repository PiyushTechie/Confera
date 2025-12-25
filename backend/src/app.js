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

// Room structure: { path: { users: [], waiting: [], hostId: string } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED::", socket.id);

  // Guest requests to join
  socket.on("request-join", ({ path, username }) => {
    if (!rooms[path]) {
      rooms[path] = { users: [], waiting: [], hostId: null };
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

  // User joins the call (host or admitted guest)
  socket.on("join-call", ({ path, username }) => {
    if (!rooms[path]) {
      rooms[path] = { users: [], waiting: [], hostId: socket.id }; 
    }
    if (!rooms[path].hostId) rooms[path].hostId = socket.id;

    rooms[path].waiting = rooms[path].waiting.filter((u) => u.socketId !== socket.id);

    const userData = {
      socketId: socket.id,
      username: username || "Guest",
      isMuted: false,
    };

    rooms[path].users.push(userData);
    socket.join(path);
    socket.roomPath = path;

    // --- CRITICAL FIX: Prevent Connection Collisions ---
    // 1. Tell the NEW user about existing users (so they can wait for calls)
    const otherUsers = rooms[path].users.filter(u => u.socketId !== socket.id);
    socket.emit("all-users", otherUsers);

    // 2. Tell EXISTING users about the new user (so they can initiate calls)
    socket.to(path).emit("user-joined", userData);
    
    // Update host waiting list
    if (rooms[path].hostId === socket.id) {
      socket.emit("update-waiting-list", rooms[path].waiting);
    }
  });

  // Host admits a user
  socket.on("admit-user", (targetSocketId) => {
    const room = Object.values(rooms).find((r) =>
      r.waiting.some((u) => u.socketId === targetSocketId)
    );
    if (room) {
      room.waiting = room.waiting.filter((u) => u.socketId !== targetSocketId);
      io.to(targetSocketId).emit("admitted");
      if (room.hostId) io.to(room.hostId).emit("update-waiting-list", room.waiting);
    }
  });

  // WebRTC signaling
  socket.on("signal", (toId, message) => {
    io.to(toId).emit("signal", socket.id, message);
  });

  // Audio toggle
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

  // --- CRITICAL FIX: Chat Event Name ---
  // Must match Frontend: "send-message" -> "receive-message"
  socket.on("send-message", (data) => {
    const path = socket.roomPath;
    if (path) {
      socket.to(path).emit("receive-message", data);
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    for (const path in rooms) {
      const room = rooms[path];
      const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
      
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        // Only notify others if user was actually in the call
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