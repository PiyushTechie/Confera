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
  }
});


const PORT = process.env.PORT || 8000;
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use(passport.initialize());

app.use("/auth", authRoutes); 
app.use("/api/v1/users", userRoutes);
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

let connections = {};
let waitingRooms = {};

io.on("connection", (socket) => {
    console.log("SOCKET CONNECTED::", socket.id);

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

    socket.on("request-join", ({ path, username }) => {
        socket.join(path);
        socket.roomId = path;

        if (!waitingRooms[path]) {
            waitingRooms[path] = [];
        }

        waitingRooms[path].push({ 
            socketId: socket.id, 
            username: username || "Guest" 
        });

        io.to(path).emit("update-waiting-list", waitingRooms[path]);
        console.log(`User ${username} is waiting in room: ${path}`);
    });

    socket.on("admit-user", ({ socketId }) => {
        io.to(socketId).emit("admitted");

        for (const roomId in waitingRooms) {
            const originalLength = waitingRooms[roomId].length;
            waitingRooms[roomId] = waitingRooms[roomId].filter(user => user.socketId !== socketId);
            
            if (waitingRooms[roomId].length !== originalLength) {
                io.to(roomId).emit("update-waiting-list", waitingRooms[roomId]);
            }
        }
    });

    socket.on("kick-user", ({ socketId }) => {
        let roomKey = null;
        for (let key in connections) {
            if (connections[key].some(u => u.socketId === socketId)) {
                roomKey = key;
                break;
            }
        }

        if (roomKey) {
            const remainingUsers = connections[roomKey].filter(u => u.socketId !== socketId);
            remainingUsers.forEach(user => {
                io.to(user.socketId).emit("user-left", socketId);
            });

            io.to(socketId).emit("kicked");

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
        
        for(let key in connections){
            let index = connections[key].findIndex(u => u.socketId === socket.id);
            if(index !== -1){
                connections[key].splice(index, 1);
                for(let a = 0; a < connections[key].length; ++a){
                    io.to(connections[key][a].socketId).emit("user-left", socket.id);
                }
            }
        }

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