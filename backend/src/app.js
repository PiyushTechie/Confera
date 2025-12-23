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
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use(passport.initialize());

app.use("/auth", authRoutes); 
app.use("/api/v1/users", userRoutes);

// 1. Existing Active Connections
let connections = {};
// 2. NEW: Waiting Rooms Storage
let waitingRooms = {};

io.on("connection", (socket) => {
    console.log("SOCKET CONNECTED::", socket.id);

    // --- STANDARD JOIN (For Hosts or Admitted Guests) ---
    socket.on("join-call", ({ path, username }) => {
        if(connections[path] === undefined){
            connections[path] = []
        }
        
        connections[path].push({ 
            socketId: socket.id, 
            username: username || "Guest", 
            isMuted: false 
        });

        socket.roomId = path; 
        socket.join(path);

        io.to(path).emit("user-joined", connections[path]);
        console.log(`User ${username} (${socket.id}) joined room: ${path}`);
    });

    // --- NEW: GUEST REQUESTS TO JOIN (Waiting Room) ---
    socket.on("request-join", ({ path, username }) => {
        socket.join(path); // Join socket room to handle signals
        socket.roomId = path;

        if (!waitingRooms[path]) {
            waitingRooms[path] = [];
        }

        // Add to waiting list
        waitingRooms[path].push({ 
            socketId: socket.id, 
            username: username || "Guest" 
        });

        // Notify the Host (broadcast to room, Host UI filters this)
        io.to(path).emit("update-waiting-list", waitingRooms[path]);
        console.log(`User ${username} is waiting in room: ${path}`);
    });

    // --- NEW: HOST ADMITS USER ---
    socket.on("admit-user", ({ socketId }) => {
        // Notify specific user
        io.to(socketId).emit("admitted");

        // Clean up waiting list
        for (const roomId in waitingRooms) {
            const originalLength = waitingRooms[roomId].length;
            waitingRooms[roomId] = waitingRooms[roomId].filter(user => user.socketId !== socketId);
            
            // If we removed someone, update the host's view
            if (waitingRooms[roomId].length !== originalLength) {
                io.to(roomId).emit("update-waiting-list", waitingRooms[roomId]);
            }
        }
    });

    // --- NEW: HOST KICKS USER ---
    // --- UPDATED: HOST KICKS USER ---
    socket.on("kick-user", ({ socketId }) => {
        // 1. Find the room this user is in
        let roomKey = null;
        for (let key in connections) {
            if (connections[key].some(u => u.socketId === socketId)) {
                roomKey = key;
                break;
            }
        }

        if (roomKey) {
            // 2. Notify everyone else in the room IMMEDIATELY that this user left
            // (This ensures the grid updates even if the disconnect event lags)
            const remainingUsers = connections[roomKey].filter(u => u.socketId !== socketId);
            remainingUsers.forEach(user => {
                io.to(user.socketId).emit("user-left", socketId);
            });

            // 3. Notify the target user they were kicked
            io.to(socketId).emit("kicked");

            // 4. Force disconnect the target socket
            const targetSocket = io.sockets.sockets.get(socketId);
            if (targetSocket) {
                targetSocket.leave(roomKey);
                targetSocket.disconnect();
            }
        }
    });

    socket.on("signal", (toId, message) => {
        io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
        socket.to(socket.roomId).emit("chat-message", data, sender, socket.id);
    });

    socket.on("toggle-audio", ({ roomId, isMuted }) => {
        if (connections[roomId]) {
            const user = connections[roomId].find(u => u.socketId === socket.id);
            if (user) user.isMuted = isMuted;
        }
        socket.to(roomId).emit("audio-toggled", { socketId: socket.id, isMuted });
    });

    socket.on("disconnect", () => {
        console.log("SOCKET DISCONNECTED::", socket.id);
        
        // 1. Remove from Active Connections
        for(let key in connections){
            let index = connections[key].findIndex(u => u.socketId === socket.id);
            if(index !== -1){
                connections[key].splice(index, 1);
                for(let a = 0; a < connections[key].length; ++a){
                    io.to(connections[key][a].socketId).emit("user-left", socket.id);
                }
            }
        }

        // 2. NEW: Remove from Waiting Rooms (if they leave while waiting)
        for (const roomId in waitingRooms) {
            const initialLength = waitingRooms[roomId].length;
            waitingRooms[roomId] = waitingRooms[roomId].filter(user => user.socketId !== socket.id);
            
            if (waitingRooms[roomId].length !== initialLength) {
                io.to(roomId).emit("update-waiting-list", waitingRooms[roomId]);
            }
        }
    });
});

const start = async () => {
    try {
        const connectionDB = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Atlas Connected. ${connectionDB.connection.host}`);
        server.listen(PORT, () => {
            console.log(`Listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
    }
};

start();