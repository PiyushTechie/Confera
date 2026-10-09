import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import { User } from "./models/user.js";
import { authLimiter, apiLimiter } from "./middlewares/limiters.js";
import "./config/passportConfig.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/users.js";
import contactRoutes from "./routes/contactRoutes.js";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { initWorkers, getRouter, createWebRtcTransport, addTransport, getTransport, addProducer, addConsumer, initPeer, removePeer, getRoomPeers } from "./mediasoup/mediaManager.js";

dotenv.config();

const app = express();
const server = createServer(app);

app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false }));

const corsOptions = {
  origin: "http://localhost:5173",
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
app.use("/api/contact", contactRoutes);
app.use("/api/schedule", scheduleRoutes);
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

io.use(async (socket, next) => {
  const incomingToken = socket.handshake.auth?.token;

  if (!incomingToken) {
    socket.user = { role: "guest" };
    return next();
  }

  try {
    let user = null;
    if (mongoose.Types.ObjectId.isValid(incomingToken)) {
      user = await User.findById(incomingToken);
    } else {
      user = await User.findOne({ token: incomingToken });
    }

    if (user) {
      socket.user = {
        role: "user",
        userId: user._id.toString(),
        username: user.name || user.username || "Host",
      };
    } else {
      socket.user = { role: "guest" };
    }
  } catch (error) {
    socket.user = { role: "guest" };
  }

  next();
});

const ROOM_TTL = 60 * 60 * 2;
const RATE_LIMIT = { windowMs: 10_000, max: 200 };
const socketRateMap = new Map();

const rateLimitSocket = (socket, event) => {
  if (event === "whiteboard-draw") return true;

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

setInterval(async () => {
  try {
    const keys = await pubClient.keys("room:*:host-disconnected");
    
    for (const key of keys) {
      const oldHostId = await pubClient.get(key);
      const roomMatch = key.match(/^room:(.+):host-disconnected$/);
      if (!roomMatch) continue;

      const path = roomMatch[1];
      const currentHostId = await pubClient.hGet(`room:${path}`, "hostId");

      if (currentHostId === oldHostId) {
        const usersLeft =  await pubClient.sMembers(`room:${path}:users`);
        if (usersLeft.length > 0) {
          const newHostId = usersLeft[0];
          await pubClient.hSet(`room:${path}`, "hostId", newHostId);
          io.to(path).emit("update-host-id", newHostId);
        } else {
          await pubClient.hDel(`room:${path}`, "hostId");
        }
      }
      
      await pubClient.del(key);
    }
  } catch (err) {
    console.error("Error processing host grace period:", err);
  }
}, 5000);

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => console.error("Redis Pub Client Error", err));
subClient.on("error", (err) => console.error("Redis Sub Client Error", err));

await pubClient.connect();
await subClient.connect();

io.adapter(createAdapter(pubClient, subClient));
console.log("Redis + Socket.IO adapter connected");

const touchRoomTTL = async (path) => {
  if (!path) return;
  await pubClient.expire(`room:${path}`, ROOM_TTL);
  await pubClient.expire(`room:${path}:users`, ROOM_TTL);
  await pubClient.expire(`room:${path}:waiting`, ROOM_TTL);
  await pubClient.expire(`room:${path}:hands`, ROOM_TTL);
};

const transferHostScript = `
local currentHost = redis.call("HGET", KEYS[1], "hostId")
if currentHost ~= ARGV[1] then return 0 end
redis.call("HSET", KEYS[1], "hostId", ARGV[2])
return 1
`;

const votePollScript = `
  local pollStr = redis.call("HGET", KEYS[1], "activePoll")
  if not pollStr or pollStr == "" then return nil end

  local poll = cjson.decode(pollStr)

  if poll.votedUsers then
      for i, v in ipairs(poll.votedUsers) do
          if v == ARGV[1] then return nil end
      end
  else
      poll.votedUsers = {}
  end

  table.insert(poll.votedUsers, ARGV[1])

  local idx = tonumber(ARGV[2]) + 1
  if not poll.votes then poll.votes = {} end
  poll.votes[idx] = (poll.votes[idx] or 0) + 1

  local updatedPollStr = cjson.encode(poll)
  redis.call("HSET", KEYS[1], "activePoll", updatedPollStr)

  return updatedPollStr
`;

const transferHost = async (path, fromId, toId) => {
  const result = await pubClient.eval(transferHostScript, {
    keys: [`room:${path}`],
    arguments: [fromId, toId],
  });
  return result === 1;
};

io.on("connection", (socket) => {
  const isAuthorizedHost = async (socket) => {
    const path = socket.roomPath;
    if (!path) return false;
    const hostId = await pubClient.hGet(`room:${path}`, "hostId");
    return hostId === socket.id;
  };

  socket.on("create-meeting", async ({ path, passcode, username }) => {
    console.log("CREATE MEETING CALLED:", path, socket.id);
    if (socket.user?.role !== "user") {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }
    if (!pubClient.isReady) {
      console.log("Redis not ready");
      return;
    }

    path = path.trim().toLowerCase();

    const roomExists = await pubClient.exists(`room:${path}`);
    if (roomExists) {
      socket.emit("room-already-active");
      return;
    }

    const hostUsername = username || socket.user?.username || "Host";
    await pubClient.hSet(`room:${path}`, {
      hostId: socket.id,
      hostUsername: hostUsername,
      passcode: passcode || "",
      isLocked: "false",
      isWhiteboardOpen: "false",
      isScreenLocked: "false",
      startTime: Date.now().toString(),
    });

    const exists = await pubClient.exists(`room:${path}`);
    console.log("ROOM CREATED?", exists, `room:${path}`);

    socket.join(path);
    socket.roomPath = path;
    socket.username = hostUsername;
    await pubClient.sAdd(`room:${path}:users`, socket.id);
    await pubClient.hSet(`socket:${socket.id}`, { username: hostUsername, roomPath: path });
    if (socket.user?.userId) {
      await pubClient.hSet(`room:${path}:identity`, socket.user.userId, socket.id);
    }

    socket.emit("meeting-created");
    io.to(path).emit("update-host-id", socket.id);
    await touchRoomTTL(path);
  });

  socket.on("update-security", async (newSettings) => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    if (!path) return;
    socket.to(path).emit("security-updated", newSettings);
    await pubClient.hSet(`room:${path}`, "security", JSON.stringify(newSettings));
  });

  socket.on("request-join", async ({ path, username, passcode }) => {
    path = path.trim().toLowerCase();

    const roomExists = await pubClient.exists(`room:${path}`);
    if (!roomExists) {
      socket.emit("invalid-meeting");
      return;
    }

    const room = await pubClient.hGetAll(`room:${path}`);

    if (room.isLocked === "true") {
      socket.emit("meeting-locked");
      return;
    }

    if (room.passcode && room.passcode !== passcode) {
      socket.emit("passcode-required");
      return;
    }

    socket.roomPath = path;
    await pubClient.sAdd(`room:${path}:waiting`, socket.id);

    const finalUsername = username || "Guest";
    const socketData = { username: finalUsername, roomPath: path };
    if (!socket.user?.userId) socketData.isGuest = "true";
    await pubClient.hSet(`socket:${socket.id}`, socketData);

    if (room.hostId) {
      const waitingIds = await pubClient.sMembers(`room:${path}:waiting`);
      const waitingUsers = [];
      for (const id of waitingIds) {
        const name = await pubClient.hGet(`socket:${id}`, "username");
        waitingUsers.push({ socketId: id, username: name || "Guest" });
      }
      io.to(room.hostId).emit("update-waiting-list", waitingUsers);
    }
    await touchRoomTTL(path);
  });

  socket.on("join-call", async ({ path, username }) => {
    path = path.trim().toLowerCase();
    console.log("join-call received for", path, "socket:", socket.id);

    const room = await pubClient.hGetAll(`room:${path}`);
    if (!room.hostId) {
      socket.emit("invalid-meeting");
      return;
    }

    if (!socket.rooms.has(path)) socket.join(path);

    socket.roomPath = path;
    const finalUsername = username || socket.user?.username || "Guest";

    await pubClient.sRem(`room:${path}:waiting`, socket.id);
    await pubClient.sAdd(`room:${path}:users`, socket.id);
    await pubClient.hSet(`socket:${socket.id}`, {
      username: finalUsername,
      roomPath: path,
    });

    if (socket.user?.userId) {
      await pubClient.hSet(`room:${path}:identity`, socket.user.userId, socket.id);
    }

    let currentHostId = room.hostId;

    if (socket.user?.userId) {
      const oldSocket = await pubClient.get(`disconnect:${socket.user.userId}:${path}`);
      if (oldSocket) {
        await pubClient.sRem(`room:${path}:users`, oldSocket);
        
        if (currentHostId === oldSocket) {
          await pubClient.del(`room:${path}:host-disconnected`);
          await pubClient.hSet(`room:${path}`, "hostId", socket.id);
          currentHostId = socket.id; 
          io.to(path).emit("update-host-id", socket.id);
        }
      }
    }

    const allUserIds = await pubClient.sMembers(`room:${path}:users`);
    const fullUsers = [];

    for (const id of allUserIds) {
      const userData = await pubClient.hGetAll(`socket:${id}`);
      fullUsers.push({
        socketId: id,
        username: userData.username || "Guest",
        isMuted: false,
        isVideoOff: false,
        isHandRaised: false,
      });
    }

    io.to(path).emit("all-users", fullUsers); 

    socket.to(path).emit("user-joined", {
      socketId: socket.id,
      username: finalUsername,
      isMuted: false,
      isVideoOff: false,
      isHandRaised: false,
    });

    socket.username = finalUsername;

    io.to(path).emit("update-host-id", currentHostId);

    if (room.startTime) {
      const elapsed = Math.floor((Date.now() - parseInt(room.startTime)) / 1000);
      socket.emit("timer-sync", elapsed);
    }
    if (room.activePoll) {
      try { socket.emit("poll-started", JSON.parse(room.activePoll)); } catch (e) {}
    }
    if (room.isWhiteboardOpen === "true") socket.emit("whiteboard-toggle", true);
    if (room.spotlightUser) socket.emit("spotlight-user", room.spotlightUser);

    if (socket.id === currentHostId) {
      const waitingIds = await pubClient.sMembers(`room:${path}:waiting`);
      const waitingUsersList = [];
      for (const id of waitingIds) {
        const name = await pubClient.hGet(`socket:${id}`, "username") || "Guest";
        waitingUsersList.push({ socketId: id, username: name });
      }
      socket.emit("update-waiting-list", waitingUsersList);
    }

    await touchRoomTTL(path);
  });

  socket.on("whiteboard-draw", (data) => {
    socket.to(data.roomId).emit("whiteboard-draw", data);
  });

  socket.on("whiteboard-clear", async (roomId) => {
    await pubClient.hDel(`room:${roomId}`, "whiteboardSnapshot");
    io.to(roomId).emit("whiteboard-clear");
  });

  socket.on("whiteboard-toggle", async ({ roomId, isOpen }) => {
    await pubClient.hSet(`room:${roomId}`, "isWhiteboardOpen", isOpen ? "true" : "false");
    io.to(roomId).emit("whiteboard-toggle", isOpen);
  });

  socket.on("start-poll", async ({ roomId, poll }) => {
    if (!(await isAuthorizedHost(socket))) return;
    if (!poll.votedUsers) poll.votedUsers = [];
    
    const pollString = JSON.stringify(poll);
    await pubClient.hSet(`room:${roomId}`, "activePoll", pollString);
    
    io.to(roomId).emit("poll-started", poll);
  });

  socket.on("vote-poll", async ({ roomId, optionIndex }) => {
    try {
      const updatedPollString = await pubClient.eval(votePollScript, {
        keys: [`room:${roomId}`],
        arguments: [socket.id, optionIndex.toString()],
      });

      if (!updatedPollString) return;

      const updatedPoll = JSON.parse(updatedPollString);
      io.to(roomId).emit("poll-updated", updatedPoll);
      
    } catch (err) {
      console.error("Error processing poll vote:", err);
    }
  });

  socket.on("end-poll", async ({ roomId }) => {
    if (!(await isAuthorizedHost(socket))) return;
    
    await pubClient.hDel(`room:${roomId}`, "activePoll");
    io.to(roomId).emit("poll-ended");
  });

  socket.on("spotlight-user", async (targetId) => {
    const path = socket.roomPath;
    if (!path) return;

    const isHost = await isAuthorizedHost(socket);
    
    if (!isHost && targetId !== socket.id && targetId !== null) {
        return; 
    }

    if (targetId === null) {
      await pubClient.hDel(`room:${path}`, "spotlightUser");
    } else {
      await pubClient.hSet(`room:${path}`, "spotlightUser", targetId);
    }
    
    io.to(path).emit("spotlight-user", targetId);
  });

  socket.on("toggle-lock", async () => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    const current = await pubClient.hGet(`room:${path}`, "isLocked");
    const next = current === "true" ? "false" : "true";
    await pubClient.hSet(`room:${path}`, "isLocked", next);
    io.to(path).emit("lock-update", next === "true");
    await touchRoomTTL(path);
  });

  socket.on("toggle-screen-lock", async () => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    const current = await pubClient.hGet(`room:${path}`, "isScreenLocked");
    const next = current === "true" ? "false" : "true";
    await pubClient.hSet(`room:${path}`, "isScreenLocked", next);
    io.to(path).emit("screen-lock-update", next === "true");
    await touchRoomTTL(path);
  });

  socket.on("transfer-host", async (newHostId) => {
    const path = socket.roomPath;
    if (!path) return;
    const ok = await transferHost(path, socket.id, newHostId);
    if (!ok) return;
    await touchRoomTTL(path);
    io.to(path).emit("update-host-id", newHostId);
  });

  socket.on("kick-user", async (targetSocketId) => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    await pubClient.sRem(`room:${path}:users`, targetSocketId);
    await pubClient.sRem(`room:${path}:waiting`, targetSocketId);
    await pubClient.zRem(`room:${path}:hands`, targetSocketId);
    io.to(targetSocketId).emit("kicked");
    io.to(path).emit("user-left", targetSocketId);
  });

  socket.on("mute-all", async () => {
    if (!(await isAuthorizedHost(socket))) return;
    socket.to(socket.roomPath).emit("force-mute");
  });

  socket.on("stop-video-all", async () => {
    if (!(await isAuthorizedHost(socket))) return;
    socket.to(socket.roomPath).emit("force-stop-video");
  });

  socket.on("end-meeting-for-all", async () => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    io.to(path).emit("meeting-ended");
    await pubClient.del(
      `room:${path}`,
      `room:${path}:users`,
      `room:${path}:waiting`,
      `room:${path}:hands`
    );
    await pubClient.hDel(`room:${path}`, "isWhiteboardOpen");
  });

  socket.on("admit-user", async (targetSocketId) => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    const guestFlag = await pubClient.hGet(`socket:${targetSocketId}`, "isGuest");
    const isGuest = guestFlag === "true";
    await pubClient.sRem(`room:${path}:waiting`, targetSocketId);
    
    if (isGuest) io.to(targetSocketId).emit("guest-admitted", { path });
    else io.to(targetSocketId).emit("admitted");

    const waitingIds = await pubClient.sMembers(`room:${path}:waiting`);
    const waitingUsers = [];
    for (const id of waitingIds) {
      const name = await pubClient.hGet(`socket:${id}`, "username");
      waitingUsers.push({ socketId: id, username: name || "Guest" });
    }
    socket.emit("update-waiting-list", waitingUsers);
    await touchRoomTTL(path);
  });

  socket.on("admit-all", async () => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    const waiting = await pubClient.sMembers(`room:${path}:waiting`);

    for (const id of waiting) {
      const guestFlag = await pubClient.hGet(`socket:${id}`, "isGuest");
      const isGuest = guestFlag === "true";
      if (isGuest) io.to(id).emit("guest-admitted", { path });
      else io.to(id).emit("admitted");
    }

    await pubClient.del(`room:${path}:waiting`);
    socket.emit("update-waiting-list", []);
    await touchRoomTTL(path);
  });

  socket.on("deny-user", async (targetSocketId) => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    const guestFlag = await pubClient.hGet(`socket:${targetSocketId}`, "isGuest");
    const isGuest = guestFlag === "true";
    await pubClient.sRem(`room:${path}:waiting`, targetSocketId);
    
    if (isGuest) io.to(targetSocketId).emit("guest-rejected", { reason: "Host rejected your request" });
    else io.to(targetSocketId).emit("denied");

    const waitingIds = await pubClient.sMembers(`room:${path}:waiting`);
    const waitingUsers = [];
    for (const id of waitingIds) {
      const name = await pubClient.hGet(`socket:${id}`, "username");
      waitingUsers.push({ socketId: id, username: name || "Guest" });
    }
    socket.emit("update-waiting-list", waitingUsers);
  });

  socket.on("toggle-hand", async ({ isRaised }) => {
    const path = socket.roomPath;
    if (!path) return;
    const userData = await pubClient.hGetAll(`socket:${socket.id}`);
    const username = userData.username || "Guest";

    if (isRaised) {
      await pubClient.zAdd(`room:${path}:hands`, { score: Date.now(), value: socket.id });
    } else {
      await pubClient.zRem(`room:${path}:hands`, socket.id);
    }

    io.to(path).emit("hand-toggled", { socketId: socket.id, username, isRaised });

    const queue = await pubClient.zRangeWithScores(`room:${path}:hands`, 0, -1);
    const queueWithNames = [];
    for (const h of queue) {
      const hUserData = await pubClient.hGetAll(`socket:${h.value}`);
      queueWithNames.push({ socketId: h.value, username: hUserData.username || "Guest" });
    }
    io.to(path).emit("hand-queue-update", queueWithNames);
    await touchRoomTTL(path);
  });

  socket.on("toggle-video", async ({ isVideoOff }) => {
    const path = socket.roomPath;
    if (!path) return;
    io.to(path).emit("video-toggled", { socketId: socket.id, isVideoOff, username: socket.username || "User" });
    await touchRoomTTL(path);
  });

  socket.on("toggle-audio", async ({ isMuted }) => {
    const path = socket.roomPath;
    if (!path) return;
    io.to(path).emit("audio-toggled", { socketId: socket.id, isMuted, username: socket.username || "User" });
    await touchRoomTTL(path);
  });

  socket.on("guest-request-join", async ({ meetingCode, username, passcode }) => {
    const path = meetingCode.trim().toLowerCase();

    const roomExists = await pubClient.exists(`room:${path}`);
    if (!roomExists) {
      socket.emit("invalid-meeting");
      socket.disconnect();
      return;
    }

    const room = await pubClient.hGetAll(`room:${path}`);

    if (room.isLocked === "true") {
      socket.emit("meeting-locked");
      socket.disconnect();
      return;
    }
    if (room.passcode && room.passcode !== passcode) {
      socket.emit("passcode-required");
      socket.disconnect();
      return;
    }

    socket.roomPath = path;
    await pubClient.hSet(`socket:${socket.id}`, {
      username: username || "Guest",
      roomPath: path,
      isGuest: "true",
    });

    await pubClient.sAdd(`room:${path}:waiting`, socket.id);

    if (room.hostId) {
      const waitingIds = await pubClient.sMembers(`room:${path}:waiting`);
      const waitingUsers = [];
      for (const id of waitingIds) {
        const name = await pubClient.hGet(`socket:${id}`, "username") || "Guest";
        waitingUsers.push({ socketId: id, username: name });
      }
      io.to(room.hostId).emit("update-waiting-list", waitingUsers);
    }
    await touchRoomTTL(path);
  });

  socket.on("lower-hand", async (targetId) => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    await pubClient.zRem(`room:${path}:hands`, targetId);
    io.to(targetId).emit("hand-lowered");
    
    const queue = await pubClient.zRangeWithScores(`room:${path}:hands`, 0, -1);
    const queueWithNames = [];
    for (const h of queue) {
      const hUserData = await pubClient.hGetAll(`socket:${h.value}`);
      queueWithNames.push({ socketId: h.value, username: hUserData.username || "Guest" });
    }
    io.to(path).emit("hand-queue-update", queueWithNames);
  });

  socket.on("clear-hands", async () => {
    if (!(await isAuthorizedHost(socket))) return;
    const path = socket.roomPath;
    const hands = await pubClient.zRange(`room:${path}:hands`, 0, -1);
    hands.forEach((id) => io.to(id).emit("hand-lowered"));
    await pubClient.del(`room:${path}:hands`);
    io.to(path).emit("hand-queue-update", []);
  });

  socket.on("getRouterRtpCapabilities", async (callback) => {
    try {
      const path = socket.roomPath;
      const router = await getRouter(path);
      callback({ rtpCapabilities: router.rtpCapabilities });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("createWebRtcTransport", async ({ sender }, callback) => {
    try {
      const path = socket.roomPath;
      const { transport, params } = await createWebRtcTransport(path);
      initPeer(path, socket.id);
      addTransport(path, socket.id, transport);
      callback(params);
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("connectTransport", async ({ transportId, dtlsParameters }, callback) => {
    try {
      const path = socket.roomPath;
      const transport = getTransport(path, socket.id, transportId);
      await transport.connect({ dtlsParameters });
      callback({ success: true });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("produce", async ({ transportId, kind, rtpParameters, appData }, callback) => {
    try {
      const path = socket.roomPath;
      const transport = getTransport(path, socket.id, transportId);
      const producer = await transport.produce({ kind, rtpParameters, appData });
      
      addProducer(path, socket.id, producer);
      
      producer.on("transportclose", () => producer.close());

      socket.to(path).emit("newProducer", { 
        producerId: producer.id, 
        socketId: socket.id,
        kind,
        appData
      });

      callback({ id: producer.id });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("consume", async ({ producerId, rtpCapabilities }, callback) => {
    try {
      const path = socket.roomPath;
      const router = await getRouter(path);
      
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        return callback({ error: "Cannot consume" });
      }

      callback({ error: "Must pass transportId" });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("consumeWithTransport", async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
    try {
      const path = socket.roomPath;
      const router = await getRouter(path);
      
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        return callback({ error: "Cannot consume" });
      }

      const transport = getTransport(path, socket.id, consumerTransportId);
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true, // Start paused
      });

      addConsumer(path, socket.id, consumer);

      consumer.on("transportclose", () => consumer.close());
      consumer.on("producerclose", () => {
        socket.emit("producerClosed", { producerId });
        consumer.close();
      });

      callback({
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    } catch (err) {
      console.error(err);
      callback({ error: err.message });
    }
  });

  socket.on("resume", async ({ consumerId }, callback) => {
    try {
      const path = socket.roomPath;
      const peers = getRoomPeers(path);
      const consumer = peers.get(socket.id)?.consumers.get(consumerId);
      if (consumer) {
        await consumer.resume();
      }
      callback({ success: true });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("getProducers", (callback) => {
    try {
      const path = socket.roomPath;
      const peers = getRoomPeers(path);
      const producers = [];
      if (peers) {
        for (const [peerId, peerData] of peers.entries()) {
          if (peerId === socket.id) continue;
          for (const producer of peerData.producers.values()) {
            producers.push({
              producerId: producer.id,
              socketId: peerId,
              kind: producer.kind,
              appData: producer.appData
            });
          }
        }
      }
      callback({ producers });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("send-caption", ({ roomId, caption, username }) => {
    if (!rateLimitSocket(socket, "send-caption")) return;
    socket.to(roomId).emit("receive-caption", { caption, username: username || "Speaker" });
  });

  socket.on("send-message", async (data) => {
    if (!rateLimitSocket(socket, "send-message")) return;
    const path = socket.roomPath;
    if (path) {
      socket.to(path).emit("receive-message", data);
      await touchRoomTTL(path);
    }
  });

  socket.on("send-emoji", ({ emoji }) => {
    if (socket.roomPath) {
      io.to(socket.roomPath).emit("emoji-received", { socketId: socket.id, emoji });
    }
  });

  socket.on("send-reaction", ({ reaction }) => {
    if (!rateLimitSocket(socket, "send-reaction")) return;
    if (socket.roomPath) {
      io.to(socket.roomPath).emit("reaction-received", { socketId: socket.id, reaction });
    }
  });

  const handleUserLeave = async () => {
    const path = socket.roomPath;
    if (!path) return;

    const userData = await pubClient.hGetAll(`socket:${socket.id}`);
    const username = userData.username || "Guest";

    await pubClient.sRem(`room:${path}:users`, socket.id);
    await pubClient.sRem(`room:${path}:waiting`, socket.id);
    await pubClient.zRem(`room:${path}:hands`, socket.id);

    io.to(path).emit("user-left", { socketId: socket.id, username });

    const usersLeft = await pubClient.sMembers(`room:${path}:users`);
    const waitingLeft = await pubClient.sMembers(`room:${path}:waiting`);
    const hostId = await pubClient.hGet(`room:${path}`, "hostId");

    let isHostDisconnecting = false;

    if (hostId === socket.id) {
      isHostDisconnecting = true;
      const key = `room:${path}:host-disconnected`;
      await pubClient.set(key, socket.id);
      await pubClient.expire(key, 15);
    }
    
    if (socket.user?.userId) {
      const key = `disconnect:${socket.user.userId}:${path}`;
      await pubClient.set(key, socket.id);
      await pubClient.expire(key, 15);
    }

    if (usersLeft.length === 0 && waitingLeft.length === 0 && !isHostDisconnecting) {
      await pubClient.del(
        `room:${path}`,
        `room:${path}:users`,
        `room:${path}:waiting`,
        `room:${path}:hands`
      );
    }
    
    removePeer(path, socket.id);
  };

  socket.on("disconnect", () => handleUserLeave().catch(console.error));

  socket.on("leave-room", async () => {
    await handleUserLeave();
    socket.leave(socket.roomPath);
    socket.roomPath = null;
  });
});

const start = async () => {
  try {
    await initWorkers();
    await mongoose.connect(process.env.MONGO_URL);
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

start();