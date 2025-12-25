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
    console.log(`Request to join: ${username} (${socket.id}) → ${path}`);

    if (!rooms[path]) {
      rooms[path] = { users: [], waiting: [], hostId: null };
    }

    // Add to waiting room
    rooms[path].waiting.push({
      socketId: socket.id,
      username: username || "Guest",
    });

    socket.join(path);
    socket.roomPath = path; // Store for later use

    // Notify ONLY the host about new waiting user
    if (rooms[path].hostId) {
      io.to(rooms[path].hostId).emit("update-waiting-list", rooms[path].waiting);
    }

    console.log(`User ${username} added to waiting room for ${path}`);
  });

  // User joins the call (host or admitted guest)
  socket.on("join-call", ({ path, username }) => {
    console.log(`Joining call: ${username} (${socket.id}) → ${path}`);

    if (!rooms[path]) {
      rooms[path] = { users: [], waiting: [], hostId: socket.id }; // First user = host
    }

    // If no host yet, this user becomes host
    if (!rooms[path].hostId) {
      rooms[path].hostId = socket.id;
    }

    // Remove from waiting if they were there
    rooms[path].waiting = rooms[path].waiting.filter((u) => u.socketId !== socket.id);

    // Add to active users
    const userData = {
      socketId: socket.id,
      username: username || "Guest",
      isMuted: false,
    };

    rooms[path].users.push(userData);

    socket.join(path);
    socket.roomPath = path;

    // Notify everyone in room about updated user list
    io.to(path).emit("user-joined", rooms[path].users);

    // Send waiting list to host only
    if (rooms[path].hostId === socket.id) {
      socket.emit("update-waiting-list", rooms[path].waiting);
    }

    console.log(`${username} (${socket.id}) joined call. Total users: ${rooms[path].users.length}`);
  });

  // Host admits a user
  socket.on("admit-user", (targetSocketId) => {
    console.log(`Host ${socket.id} admitting user ${targetSocketId}`);

    const room = Object.values(rooms).find((r) =>
      r.waiting.some((u) => u.socketId === targetSocketId)
    );

    if (!room) {
      console.log("User not found in any waiting room");
      return;
    }

    const user = room.waiting.find((u) => u.socketId === targetSocketId);
    if (!user) return;

    const path = Object.keys(rooms).find((key) => rooms[key] === room);

    // Remove from waiting
    room.waiting = room.waiting.filter((u) => u.socketId !== targetSocketId);

    // Tell the admitted user they can join
    io.to(targetSocketId).emit("admitted");

    // Update waiting list for host
    if (room.hostId) {
      io.to(room.hostId).emit("update-waiting-list", room.waiting);
    }

    console.log(`User ${user.username} admitted to ${path}`);
  });

  // WebRTC signaling
  socket.on("signal", (toId, message) => {
    io.to(toId).emit("signal", socket.id, message);
  });

  // Optional: audio toggle
  socket.on("toggle-audio", ({ isMuted }) => {
    const path = socket.roomPath;
    if (!path || !rooms[path]) return;

    const user = rooms[path].users.find((u) => u.socketId === socket.id);
    if (user) {
      user.isMuted = isMuted;
      socket.to(path).emit("audio-toggled", { socketId: socket.id, isMuted });
    }
  });

  // ------------------------------------------
  // FIXED CHAT SECTION
  // ------------------------------------------
  socket.on("send-message", (data) => {
    const path = socket.roomPath;
    if (path) {
      // Broadcast to everyone ELSE in the room (sender already updated locally)
      socket.to(path).emit("receive-message", data);
      console.log(`Message sent in ${path} by ${socket.id}`);
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("SOCKET DISCONNECTED::", socket.id);

    for (const path in rooms) {
      const room = rooms[path];

      // Remove from active users
      const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        io.to(path).emit("user-joined", room.users); // Update user list
        socket.to(path).emit("user-left", socket.id);

        // If host left, assign new host if users remain
        if (room.hostId === socket.id && room.users.length > 0) {
          room.hostId = room.users[0].socketId;
          io.to(room.hostId).emit("update-waiting-list", room.waiting);
        }
      }

      // Remove from waiting
      room.waiting = room.waiting.filter((u) => u.socketId !== socket.id);

      // Update waiting list for host
      if (room.hostId) {
        io.to(room.hostId).emit("update-waiting-list", room.waiting);
      }

      // Cleanup empty room
      if (room.users.length === 0 && room.waiting.length === 0) {
        delete rooms[path];
        console.log(`Room ${path} cleaned up`);
      }
    }
  });
});



const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

start();