import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, MonitorOff,
  MessageSquare, PhoneOff, Info, X, Send, Copy, Check,
  Users, GripHorizontal, LayoutDashboard,
  ShieldAlert, UserMinus, UserCheck, Gavel, MoreVertical,
} from "lucide-react";
import server from "../environment";

const server_url = server;

const peerConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp"
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { url: meetingCode } = useParams();

  const {
    bypassLobby = false,
    isAudioOn = true,
    isVideoOn = true,
    username = "Guest",
    isHost = false,
  } = location.state || {};

  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const connectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const displayStreamRef = useRef(null);

  const localGridRef = useRef(null);
  const localSpotlightRef = useRef(null);
  const localFloatingRef = useRef(null);

  const [askForUsername, setAskForUsername] = useState(false);
  const [userName, setUsername] = useState(username || "");
  const [video, setVideo] = useState(isVideoOn ?? true);
  const [audio, setAudio] = useState(isAudioOn ?? true);
  const [screen, setScreen] = useState(false);

  const [videos, setVideos] = useState([]); // { socketId, stream }
  const [userMap, setUserMap] = useState({}); // socketId -> { username, isHost }
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);

  const pendingIce = useRef({});

  const [viewMode, setViewMode] = useState("GRID");
  const [spotlightId, setSpotlightId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* --------------------- MEDIA --------------------- */

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stream.getVideoTracks()[0].enabled = video;
      stream.getAudioTracks()[0].enabled = audio;
      localStreamRef.current = stream;

      [localGridRef, localSpotlightRef, localFloatingRef].forEach(ref => {
        if (ref.current) ref.current.srcObject = stream;
      });
      console.log("Local media obtained");
    } catch (err) {
      console.error("Media error:", err);
    }
  };

  /* ------------------ PEER CONNECTION ------------------ */

  const createPeer = (targetId) => {
    console.log("Creating peer for:", targetId);
    const pc = new RTCPeerConnection(peerConfig);
    pc.targetId = targetId;
    connectionsRef.current[targetId] = pc;

    // Add current tracks (camera or screen)
    const videoTrack = screen && displayStreamRef.current
      ? displayStreamRef.current.getVideoTracks()[0]
      : localStreamRef.current?.getVideoTracks()[0];

    const audioTrack = localStreamRef.current?.getAudioTracks()[0];

    if (videoTrack) pc.addTrack(videoTrack, localStreamRef.current);
    if (audioTrack) pc.addTrack(audioTrack, localStreamRef.current);

    pc.onicecandidate = e => {
      if (e.candidate) {
        socketRef.current.emit("signal", targetId, JSON.stringify({ ice: e.candidate }));
        console.log("Sent ICE to:", targetId);
      }
    };

    pc.ontrack = e => {
      console.log("Received remote stream from:", targetId);
      const stream = e.streams[0];
      setVideos(prev => {
        if (prev.some(v => v.socketId === pc.targetId)) return prev;
        return [...prev, { socketId: pc.targetId, stream }];
      });
    };

    // Debug connection states
    pc.onconnectionstatechange = () => console.log(`Connection state for ${targetId}:`, pc.connectionState);
    pc.oniceconnectionstatechange = () => console.log(`ICE state for ${targetId}:`, pc.iceConnectionState);

    // CRITICAL FIX: Manually create and send offer (don't rely on onnegotiationneeded)
    const initiateOffer = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit("signal", targetId, JSON.stringify({ sdp: pc.localDescription }));
        console.log("Manually sent offer to:", targetId);
      } catch (err) {
        console.error("Manual offer error:", err);
      }
    };

    pc.onsignalingstatechange = () => console.log(`Signaling state for ${targetId}:`, pc.signalingState);
    pc.onnegotiationneeded = () => console.log(`Negotiation needed for ${targetId}`);

    initiateOffer();

    return pc;
  };

  const replaceVideoTrack = (newTrack) => {
    Object.values(connectionsRef.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      if (sender) sender.replaceTrack(newTrack);
    });
  };

  /* ------------------ SOCKET ------------------ */

  const connectSocket = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      console.log("Socket connected, ID:", socketIdRef.current);

      if (isHost) {
        socketRef.current.emit("join-call", {
          path: window.location.href,
          username: userName,
        });
      } else {
        socketRef.current.emit("request-join", {
          path: window.location.href,
          username: userName,
        });
        setIsInWaitingRoom(true);
      }
    });

    socketRef.current.on("update-waiting-list", (users) => {
      console.log("Waiting users updated:", users);
      if (isHost) setWaitingUsers(users);
    });

    socketRef.current.on("admitted", () => {
      console.log("Admitted by host");
      setIsInWaitingRoom(false);
      socketRef.current.emit("join-call", {
        path: window.location.href,
        username: userName,
      });
    });

    socketRef.current.on("user-joined", (users) => {
      console.log("User joined event:", users);
      users.forEach(u => {
        if (u.socketId === socketIdRef.current) return;

        setUserMap(prev => ({ ...prev, [u.socketId]: u }));

        if (!connectionsRef.current[u.socketId]) {
          createPeer(u.socketId);
        }
      });
    });

    socketRef.current.on("signal", async (fromId, msg) => {
      console.log("Received signal from:", fromId, msg);
      const signal = JSON.parse(msg);
      let pc = connectionsRef.current[fromId];

      if (!pc) pc = createPeer(fromId);

      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: pc.localDescription }));
          console.log("Sent answer to:", fromId);
        }
        if (pendingIce.current[fromId]) {
          pendingIce.current[fromId].forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
          delete pendingIce.current[fromId];
        }
      } else if (signal.ice) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
          console.log("Added ICE from:", fromId);
        } else {
          pendingIce.current[fromId] = pendingIce.current[fromId] || [];
          pendingIce.current[fromId].push(signal.ice);
        }
      }
    });

    socketRef.current.on("user-left", (id) => {
      console.log("User left:", id);
      connectionsRef.current[id]?.close();
      delete connectionsRef.current[id];
      setVideos(v => v.filter(x => x.socketId !== id));
      setUserMap(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    });
  };

  /* ------------------ CONTROLS ------------------ */

  const handleScreen = async () => {
    if (isMobile) {
      alert("Screen sharing is not supported on mobile browsers due to current limitations in Chrome and Safari.\n\nPlease use a desktop or laptop computer for screen sharing.");
      return;
    }

    if (!screen) {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: false
        });
        displayStreamRef.current = display;
        const track = display.getVideoTracks()[0];

        replaceVideoTrack(track);

        track.onended = () => {
          handleScreen(); 
        };

        setScreen(true);
        console.log("Screen sharing started");
      } catch (err) {
        if (err.name !== "NotAllowedError") {
          console.error("Screen share error:", err);
          alert("Unable to start screen sharing. Please try again or check browser permissions.");
        }
        console.log("Screen share cancelled or denied");
      }
    } else {
      // Stop sharing
      displayStreamRef.current?.getTracks().forEach(t => t.stop());
      displayStreamRef.current = null;

      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) replaceVideoTrack(camTrack);

      setScreen(false);
      console.log("Screen sharing stopped");
    }
  };

  const handleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !video;
      setVideo(!video);
      console.log("Video toggled:", !video);
    }
  };

  const handleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !audio;
      setAudio(!audio);
      console.log("Audio toggled:", !audio);
    }
  };

  const handleAdmit = (socketId) => {
    socketRef.current.emit("admit-user", socketId);
    console.log("Admitted:", socketId);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    displayStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(connectionsRef.current).forEach(pc => pc.close());
    socketRef.current?.disconnect();
    navigate("/");
  };

  const handleTileClick = (id) => {
    setSpotlightId(id);
    setViewMode("SPOTLIGHT");
  };

  /* ------------------ INIT ------------------ */

  useEffect(() => {
    getMedia().then(() => {
      if (bypassLobby || (username && username !== "Guest")) {
        connectSocket();
      } else {
        setAskForUsername(true);
      }
    });

    return () => handleEndCall();
  }, []);

  const connect = () => {
    setAskForUsername(false);
    connectSocket();
  };

  const handleMouseDown = (e) => {
    if (viewMode !== "SPOTLIGHT" || spotlightId !== "local") return;
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const onMove = (e) => setPosition({ x: e.clientX - startX, y: e.clientY - startY });
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     'ontouchstart' in window ||
                     navigator.maxTouchPoints > 0;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

 return (
  <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col overflow-hidden">
    {/* ===== USERNAME PROMPT ===== */}
    {askForUsername && (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-neutral-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-700">
          <h2 className="text-3xl font-bold mb-8 text-center">Join Meeting</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative mb-8 rounded-xl overflow-hidden bg-black aspect-video">
            <video ref={localGridRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
              <button onClick={handleAudio} className={`p-4 rounded-full ${audio ? 'bg-neutral-600' : 'bg-red-600'}`}>
                {audio ? <Mic size={24} /> : <MicOff size={24} />}
              </button>
              <button onClick={handleVideo} className={`p-4 rounded-full ${video ? 'bg-neutral-600' : 'bg-red-600'}`}>
                {video ? <Video size={24} /> : <VideoOff size={24} />}
              </button>
            </div>
          </div>

          <button
            onClick={connect}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition"
          >
            Join Call
          </button>
        </div>
      </div>
    )}

    {/* ===== WAITING ROOM ===== */}
    {isInWaitingRoom && !askForUsername && (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-neutral-800 p-12 rounded-3xl shadow-2xl text-center max-w-md border border-neutral-700">
          <div className="w-24 h-24 mx-auto mb-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
            <ShieldAlert size={48} className="text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Waiting for Host</h2>
          <p className="text-gray-400 mb-10 text-lg">The host will let you in soon.</p>
          <div className="flex justify-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-150" />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-300" />
          </div>
        </div>
      </div>
    )}

    {/* ===== MAIN MEETING INTERFACE ===== */}
    {!askForUsername && !isInWaitingRoom && (
      <div className="flex flex-col h-screen">
        {/* Video + Panels Container */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Video Area */}
          <div className={`flex-1 bg-black flex flex-col transition-all duration-300 ${showChat || showParticipants ? 'md:mr-80' : ''}`}>
            {/* Video Grid / Spotlight */}
            <div className="flex-1 relative overflow-hidden">
              {viewMode === "SPOTLIGHT" && spotlightId ? (
                <div className="h-full flex items-center justify-center p-4">
                  {spotlightId === "local" ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        ref={localSpotlightRef}
                        autoPlay
                        muted
                        playsInline
                        className={`max-w-full max-h-full object-contain ${!screen ? "-scale-x-100" : ""}`}
                      />
                      <div className="absolute bottom-6 left-6 bg-black/70 px-5 py-3 rounded-full text-xl font-semibold backdrop-blur">
                        {userName} (You)
                      </div>
                    </div>
                  ) : (
                    videos.find(v => v.socketId === spotlightId) && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <video
                          ref={(el) => {
                            const v = videos.find(v => v.socketId === spotlightId);
                            if (el && v?.stream) el.srcObject = v.stream;
                          }}
                          autoPlay
                          playsInline
                          className="max-w-full max-h-full object-contain"
                        />
                        <div className="absolute bottom-6 left-6 bg-black/70 px-5 py-3 rounded-full text-xl font-semibold backdrop-blur">
                          {userMap[spotlightId]?.username || "Guest"}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-wrap items-center justify-center p-4 gap-6 overflow-y-auto">
                  {/* Local Video Tile */}
                  {spotlightId !== "local" && (
                    <div
                      onClick={() => handleTileClick("local")}
                      className="relative bg-neutral-800 rounded-2xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-500 transition-all aspect-video w-full max-w-2xl border border-neutral-700"
                    >
                      <video
                        ref={localGridRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover ${!screen ? "-scale-x-100" : ""}`}
                      />
                      <div className="absolute bottom-3 left-3 bg-black/70 px-4 py-2 rounded-full backdrop-blur">
                        <span className="text-sm font-semibold">You {isHost && "(Host)"}</span>
                      </div>
                    </div>
                  )}

                  {/* Remote Video Tiles */}
                  {videos.map((v) => {
                    if (spotlightId === v.socketId) return null;
                    const user = userMap[v.socketId] || { username: "Guest" };
                    return (
                      <div
                        key={v.socketId}
                        onClick={() => handleTileClick(v.socketId)}
                        className="relative bg-neutral-800 rounded-2xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-500 transition-all aspect-video w-full max-w-2xl border border-neutral-700"
                      >
                        <video
                          ref={(el) => el && v.stream && (el.srcObject = v.stream)}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/70 px-4 py-2 rounded-full backdrop-blur">
                          <span className="text-sm font-semibold">{user.username}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PIP Local Video in Spotlight Mode */}
            {viewMode === "SPOTLIGHT" && spotlightId === "local" && (
              <div
                className="absolute bottom-8 left-8 w-64 aspect-video bg-neutral-800 rounded-2xl overflow-hidden shadow-2xl border border-neutral-600 z-50 cursor-move"
                style={{ transition: isDragging ? 'none' : 'all 0.3s' }}
                onMouseDown={handleMouseDown}
              >
                <video
                  ref={localFloatingRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${!screen ? "-scale-x-100" : ""}`}
                />
              </div>
            )}
          </div>

          {/* Side Panels (Participants & Chat) */}
          {(showParticipants || showChat) && (
            <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-neutral-800 border-l border-neutral-700 z-40 flex flex-col shadow-2xl md:relative">
              {/* Panel Header */}
              <div className="p-5 border-b border-neutral-700 flex items-center justify-between bg-neutral-900">
                <h3 className="text-xl font-bold">
                  {showParticipants ? `Participants (${Object.values(userMap).length + 1})` : "Chat"}
                </h3>
                <button
                  onClick={() => {
                    setShowParticipants(false);
                    setShowChat(false);
                  }}
                  className="p-2 hover:bg-neutral-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {showParticipants ? (
                  <>
                    {/* Waiting Room */}
                    {isHost && waitingUsers.length > 0 && (
                      <div className="mb-6 pb-6 border-b border-neutral-700">
                        <h4 className="text-sm font-bold text-yellow-500 uppercase mb-4 flex items-center gap-2">
                          <Gavel size={16} /> Waiting Room
                        </h4>
                        {waitingUsers.map((u) => (
                          <div key={u.socketId} className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg mb-3">
                            <span className="font-medium">{u.username}</span>
                            <button
                              onClick={() => handleAdmit(u.socketId)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                              <UserCheck size={16} /> Admit
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Current Participants */}
                    <div className="space-y-3">
                      {/* You */}
                      <div className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                            {userName[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium">{userName} (You)</span>
                        </div>
                        {audio ? <Mic size={18} className="text-gray-400" /> : <MicOff size={18} className="text-red-500" />}
                      </div>

                      {/* Others */}
                      {Object.entries(userMap).map(([id, user]) => (
                        <div key={id} className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg hover:bg-neutral-700 transition">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                              {user.username[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium">{user.username}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {user.isMuted ? <MicOff size={18} className="text-red-500" /> : <Mic size={18} className="text-gray-400" />}
                            {isHost && (
                              <button className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300">
                                <UserMinus size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  // Chat Panel Placeholder (you can expand this later)
                  <div className="text-center text-gray-500 mt-20">
                    <MessageSquare size={64} className="mx-auto mb-4 opacity-30" />
                    <p>Chat coming soon!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-6 z-30">
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleAudio}
              className={`p-4 rounded-full transition ${audio ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-red-600'}`}
            >
              {audio ? <Mic size={28} /> : <MicOff size={28} />}
            </button>

            <button
              onClick={handleVideo}
              className={`p-4 rounded-full transition ${video ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-red-600'}`}
            >
              {video ? <Video size={28} /> : <VideoOff size={28} />}
            </button>

            {!isMobile && (
              <button
                onClick={handleScreen}
                className={`p-4 rounded-full transition ${screen ? 'bg-blue-600' : 'bg-neutral-700 hover:bg-neutral-600'}`}
                title={screen ? "Stop sharing" : "Share screen"}
              >
                {screen ? <MonitorOff size={28} /> : <ScreenShare size={28} />}
              </button>
            )}

            {!isMobile && (
              <button
                onClick={() => setViewMode(viewMode === "GRID" ? "SPOTLIGHT" : "GRID")}
                className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 transition"
              >
                <LayoutDashboard size={28} />
              </button>
            )}
          </div>

          {/* Center: Meeting Info (optional) */}
          <div className="hidden md:block text-sm text-gray-400">
            Meeting: <span className="font-mono font-bold">{meetingCode}</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition">
              <PhoneOff size={28} />
            </button>

            {/* Mobile Menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 transition"
            >
              <MoreVertical size={28} />
            </button>

            {/* Desktop Side Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={`p-3 rounded-xl transition ${showInfo ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                <Info size={24} />
              </button>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-3 rounded-xl relative transition ${showParticipants ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                <Users size={24} />
                {isHost && waitingUsers.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {waitingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-3 rounded-xl transition ${showChat ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                <MessageSquare size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center md:hidden">
            <div className="w-full max-w-md bg-neutral-800 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
              <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-6" />
              
              <div className="space-y-4">
                <button
                  onClick={() => { handleScreen(); setShowMobileMenu(false); }}
                  disabled={isMobile}
                  className={`w-full flex items-center justify-center gap-4 py-4 rounded-xl transition ${
                    isMobile 
                      ? 'bg-neutral-700/50 text-gray-500' 
                      : screen ? 'bg-blue-600' : 'bg-neutral-700 hover:bg-neutral-600'
                  }`}
                >
                  {screen ? <MonitorOff size={24} /> : <ScreenShare size={24} />}
                  <span className="font-medium">Share Screen {isMobile && "(Not available on mobile)"}</span>
                </button>

                <button
                  onClick={() => { setViewMode(viewMode === "GRID" ? "SPOTLIGHT" : "GRID"); setShowMobileMenu(false); }}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition"
                >
                  <LayoutDashboard size={24} />
                  <span className="font-medium">Switch Layout</span>
                </button>

                <div className="h-px bg-neutral-700" />

                <button
                  onClick={() => { setShowInfo(true); setShowMobileMenu(false); }}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition"
                >
                  <Info size={24} />
                  <span className="font-medium">Meeting Info</span>
                </button>

                <button
                  onClick={() => { setShowParticipants(true); setShowMobileMenu(false); }}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition"
                >
                  <Users size={24} />
                  <span className="font-medium">Participants</span>
                </button>

                <button
                  onClick={() => { setShowChat(true); setShowMobileMenu(false); }}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition"
                >
                  <MessageSquare size={24} />
                  <span className="font-medium">Chat</span>
                </button>
              </div>

              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-full mt-6 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-semibold"
              >
                Close Menu
              </button>
            </div>
          </div>
        )}

        {/* Meeting Info Panel (Desktop) */}
        {showInfo && !showMobileMenu && (
          <div className="fixed bottom-24 right-6 w-80 bg-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl z-40 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Meeting Details</h3>
              <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-neutral-700 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-400 mb-1">Meeting Code</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold">{meetingCode}</span>
                  <button onClick={handleCopyLink} className="p-2 text-blue-400 hover:bg-neutral-700 rounded">
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Invite Link</p>
                <p className="text-xs bg-neutral-900 p-3 rounded border border-neutral-700 truncate mb-3">
                  {window.location.href}
                </p>
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Copy size={18} /> Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);
}
