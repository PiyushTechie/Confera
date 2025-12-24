// VideoMeetComponent.jsx
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
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
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
    } catch (err) {
      console.error("Media error:", err);
    }
  };

  /* ------------------ PEER CONNECTION ------------------ */

const createPeer = (targetId) => {
  const pc = new RTCPeerConnection(peerConfig);
  pc.targetId = targetId;
  connectionsRef.current[targetId] = pc;

  // Add current tracks
  const videoTrack = screen && displayStreamRef.current
    ? displayStreamRef.current.getVideoTracks()[0]
    : localStreamRef.current?.getVideoTracks()[0];

  const audioTrack = localStreamRef.current?.getAudioTracks()[0];

  if (videoTrack) pc.addTrack(videoTrack, localStreamRef.current);
  if (audioTrack) pc.addTrack(audioTrack, localStreamRef.current);

  pc.onicecandidate = e => {
    if (e.candidate) {
      socketRef.current.emit("signal", targetId, JSON.stringify({ ice: e.candidate }));
    }
  };

  pc.ontrack = e => {
    const stream = e.streams[0];
    setVideos(prev => {
      if (prev.some(v => v.socketId === pc.targetId)) return prev;
      return [...prev, { socketId: pc.targetId, stream }];
    });
  };

  // === CRITICAL FIX: Manually create and send offer ===
  pc.createOffer()
    .then(offer => pc.setLocalDescription(offer))
    .then(() => {
      socketRef.current.emit("signal", targetId, JSON.stringify({ sdp: pc.localDescription }));
    })
    .catch(err => console.error("Manual offer error:", err));

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

      if (isHost) {
        socketRef.current.emit("join-call", {
          path: window.location.href,
          username: userName,
          isHost: true,
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
      if (isHost) setWaitingUsers(users);
    });

    socketRef.current.on("admitted", () => {
      setIsInWaitingRoom(false);
      socketRef.current.emit("join-call", {
        path: window.location.href,
        username: userName,
        isHost: false,
      });
    });

    socketRef.current.on("user-joined", (users) => {
      users.forEach(u => {
        if (u.socketId === socketIdRef.current) return;

        setUserMap(prev => ({ ...prev, [u.socketId]: u }));

        if (!connectionsRef.current[u.socketId]) {
          createPeer(u.socketId);
        }
      });
    });

    socketRef.current.on("signal", async (fromId, msg) => {
      const signal = JSON.parse(msg);
      let pc = connectionsRef.current[fromId];

      if (!pc) pc = createPeer(fromId);

      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: pc.localDescription }));
        }
        if (pendingIce.current[fromId]) {
          pendingIce.current[fromId].forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
          delete pendingIce.current[fromId];
        }
      } else if (signal.ice) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
        } else {
          pendingIce.current[fromId] = pendingIce.current[fromId] || [];
          pendingIce.current[fromId].push(signal.ice);
        }
      }
    });

    socketRef.current.on("user-left", (id) => {
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
    if (!screen) {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
        displayStreamRef.current = display;
        const track = display.getVideoTracks()[0];

        replaceVideoTrack(track);

        track.onended = () => handleScreen();

        setScreen(true);
      } catch (err) {
        console.log("Screen share cancelled");
      }
    } else {
      displayStreamRef.current?.getTracks().forEach(t => t.stop());
      displayStreamRef.current = null;

      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) replaceVideoTrack(camTrack);

      setScreen(false);
    }
  };

  const handleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !video;
      setVideo(!video);
    }
  };

  const handleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !audio;
      setAudio(!audio);
    }
  };

  const handleAdmit = (socketId) => {
    socketRef.current.emit("admit-user", socketId);
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

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Username Prompt */}
      {askForUsername && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Join Meeting</h2>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-300">Display Name</label>
              <input
                type="text"
                className="bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg block w-full p-2.5"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative mb-6 rounded-lg overflow-hidden bg-black aspect-video">
              <video ref={localGridRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-4 flex gap-4">
                <button onClick={handleAudio} className={`p-3 rounded-full ${audio ? 'bg-neutral-600' : 'bg-red-500'}`}>
                  {audio ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button onClick={handleVideo} className={`p-3 rounded-full ${video ? 'bg-neutral-600' : 'bg-red-500'}`}>
                  {video ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              </div>
            </div>
            <button onClick={connect} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-3">
              Join Call
            </button>
          </div>
        </div>
      )}

      {/* Waiting Room */}
      {isInWaitingRoom && !askForUsername && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 p-4 text-center">
          <div className="bg-neutral-800 p-10 rounded-2xl shadow-2xl border border-neutral-700 max-w-lg w-full">
            <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={40} className="text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Waiting for Host</h2>
            <p className="text-gray-400 mb-8">You will join automatically once admitted.</p>
            <div className="flex justify-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        </div>
      )}

      {/* Main Meeting UI */}
      {!askForUsername && !isInWaitingRoom && (
        <div className="flex flex-col h-screen relative">
          {/* Video Area */}
          <div className="flex-1 bg-black relative flex overflow-hidden">
            {/* Spotlight */}
            {viewMode === "SPOTLIGHT" && spotlightId && (
              <div className="flex-1 flex items-center justify-center p-4 bg-neutral-900">
                {spotlightId === "local" ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={localSpotlightRef}
                      autoPlay
                      muted
                      playsInline
                      className={`max-w-full max-h-full object-contain ${!screen ? "-scale-x-100" : ""}`}
                    />
                    <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-full text-lg font-semibold">
                      {userName} (You)
                    </div>
                  </div>
                ) : (
                  videos.find(v => v.socketId === spotlightId) && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        ref={(ref) => {
                          const v = videos.find(v => v.socketId === spotlightId);
                          if (ref && v?.stream) ref.srcObject = v.stream;
                        }}
                        autoPlay
                        playsInline
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-full text-lg font-semibold">
                        {userMap[spotlightId]?.username || "Guest"}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Grid / Sidebar */}
            <div className={`${viewMode === "SPOTLIGHT" ? "hidden md:flex w-64 border-l border-neutral-800 flex-col overflow-y-auto" : "flex-1 flex flex-wrap items-center justify-center"} p-4 gap-4 bg-black`}>
              {/* Local */}
              {spotlightId !== "local" && (
                <div
                  onClick={() => handleTileClick("local")}
                  className={`relative bg-neutral-800 rounded-xl overflow-hidden border cursor-pointer hover:border-blue-500 transition-all ${viewMode === "SPOTLIGHT" ? "w-full aspect-video" : "w-full md:max-w-xl aspect-video"} border-neutral-700`}
                >
                  <video
                    ref={localGridRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${!screen ? "-scale-x-100" : ""}`}
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                    <span className="text-xs font-semibold text-white">You {isHost && "(Host)"}</span>
                  </div>
                </div>
              )}

              {/* Remotes */}
              {videos.map(v => {
                if (spotlightId === v.socketId) return null;
                const user = userMap[v.socketId] || { username: "Guest" };
                return (
                  <div
                    key={v.socketId}
                    onClick={() => handleTileClick(v.socketId)}
                    className={`relative bg-neutral-800 rounded-xl overflow-hidden border cursor-pointer hover:border-blue-500 transition-all ${viewMode === "SPOTLIGHT" ? "w-full aspect-video" : "w-full md:max-w-xl aspect-video"} border-neutral-700`}
                  >
                    <video
                      ref={ref => { if (ref && v.stream) ref.srcObject = v.stream; }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                      <span className="text-xs font-semibold text-white">{user.username}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Local Video */}
          {viewMode === "SPOTLIGHT" && spotlightId === "local" && (
            <div
              className="absolute w-32 md:w-48 aspect-video bg-neutral-800 rounded-lg overflow-hidden shadow-2xl border border-neutral-700 z-50 cursor-move"
              style={{ left: `${position.x}px`, top: `${position.y}px`, transition: isDragging ? 'none' : 'all 0.3s' }}
              onMouseDown={handleMouseDown}
            >
              <video
                ref={localFloatingRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover pointer-events-none ${!screen ? "-scale-x-100" : ""}`}
              />
            </div>
          )}

          {/* Bottom Bar */}
          <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center z-20 px-4 relative">
            <div className="flex items-center gap-4">
              <button onClick={handleAudio} className={`p-4 rounded-full ${audio ? 'bg-neutral-700' : 'bg-red-500'}`}>
                {audio ? <Mic size={24} /> : <MicOff size={24} />}
              </button>
              <button onClick={handleVideo} className={`p-4 rounded-full ${video ? 'bg-neutral-700' : 'bg-red-500'}`}>
                {video ? <Video size={24} /> : <VideoOff size={24} />}
              </button>
              <button onClick={handleScreen} className={`hidden md:block p-4 rounded-full ${screen ? 'bg-blue-600' : 'bg-neutral-700'}`}>
                {screen ? <MonitorOff size={24} /> : <ScreenShare size={24} />}
              </button>
              <button onClick={() => setViewMode(viewMode === "GRID" ? "SPOTLIGHT" : "GRID")} className="hidden md:block p-4 rounded-full bg-neutral-700 hover:bg-neutral-600">
                <LayoutDashboard size={24} />
              </button>
              <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 ml-2">
                <PhoneOff size={24} />
              </button>

              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 relative ml-2">
                <MoreVertical size={24} />
              </button>
            </div>

            <div className="hidden md:flex absolute right-6 items-center gap-3">
              <button onClick={() => setShowInfo(!showInfo)} className={`p-3 rounded-xl ${showInfo ? "bg-blue-600" : "bg-neutral-800"}`}>
                <Info size={24} />
              </button>
              <button onClick={() => setShowParticipants(!showParticipants)} className={`p-3 rounded-xl relative ${showParticipants ? "bg-blue-600" : "bg-neutral-800"}`}>
                <Users size={24} />
                {isHost && waitingUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold">
                    {waitingUsers.length}
                  </span>
                )}
              </button>
              <button onClick={() => setShowChat(!showChat)} className={`p-3 rounded-xl relative ${showChat ? "bg-blue-600" : "bg-neutral-800"}`}>
                <MessageSquare size={24} />
              </button>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="absolute bottom-24 right-4 w-64 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl p-2 flex flex-col gap-2 z-40 md:hidden">
                <button onClick={() => { handleScreen(); setShowMobileMenu(false); }} className={`flex items-center gap-3 p-3 rounded-lg ${screen ? 'bg-blue-600 text-white' : 'hover:bg-neutral-700 text-gray-200'}`}>
                  {screen ? <MonitorOff size={20} /> : <ScreenShare size={20} />} <span>Share Screen</span>
                </button>
                <button onClick={() => { setViewMode(viewMode === "GRID" ? "SPOTLIGHT" : "GRID"); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700 text-gray-200">
                  <LayoutDashboard size={20} /> <span>Switch Layout</span>
                </button>
                <div className="h-px bg-neutral-700 my-1"></div>
                <button onClick={() => { setShowInfo(!showInfo); setShowMobileMenu(false); }} className={`flex items-center gap-3 p-3 rounded-lg ${showInfo ? "bg-blue-600 text-white" : "hover:bg-neutral-700 text-gray-200"}`}>
                  <Info size={20} /> <span>Meeting Info</span>
                </button>
                <button onClick={() => { setShowParticipants(!showParticipants); setShowMobileMenu(false); }} className={`flex items-center gap-3 p-3 rounded-lg relative ${showParticipants ? "bg-blue-600 text-white" : "hover:bg-neutral-700 text-gray-200"}`}>
                  <Users size={20} /> <span>Participants</span>
                </button>
                <button onClick={() => { setShowChat(!showChat); setShowMobileMenu(false); }} className={`flex items-center gap-3 p-3 rounded-lg relative ${showChat ? "bg-blue-600 text-white" : "hover:bg-neutral-700 text-gray-200"}`}>
                  <MessageSquare size={20} /> <span>Chat</span>
                </button>
              </div>
            )}
          </div>

          {/* Info Panel */}
          {showInfo && (
            <div className="absolute bottom-20 md:bottom-24 right-4 md:right-6 w-72 md:w-80 bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl z-30">
              <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                <h3 className="font-bold">Meeting Details</h3>
                <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400">Meeting Code</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-mono font-bold">{meetingCode}</span>
                    <button onClick={handleCopyLink} className="text-blue-400">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400">Host</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-200">{isHost ? `${userName} (You)` : "Unknown Host"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400">Invite Link</label>
                  <div className="mt-1 p-2 bg-neutral-900 rounded-lg text-xs text-gray-400 truncate border border-neutral-700">
                    {window.location.href}
                  </div>
                  <button onClick={handleCopyLink} className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                    <Copy size={16} /> Copy Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Participants Panel */}
          {showParticipants && (
            <div className="absolute right-0 top-0 h-[calc(100vh-5rem)] md:h-[calc(100vh-80px)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col">
              <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900">
                <h3 className="font-bold text-lg">
                  Participants ({Object.values(userMap).length + 1})
                </h3>
                <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Waiting Room (Host only) */}
                {isHost && waitingUsers.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-neutral-700">
                    <h4 className="text-xs font-bold text-yellow-500 uppercase mb-3 flex items-center gap-2">
                      <Gavel size={12} /> Waiting Room
                    </h4>
                    {waitingUsers.map(u => (
                      <div key={u.socketId} className="flex items-center justify-between p-2 rounded-lg bg-neutral-700/50 mb-2">
                        <span className="font-medium text-sm">{u.username}</span>
                        <button
                          onClick={() => handleAdmit(u.socketId)}
                          className="p-1.5 bg-green-600 hover:bg-green-700 rounded text-xs text-white flex items-center gap-1"
                        >
                          <UserCheck size={14} /> Admit
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* You */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{userName} (You)</span>
                  </div>
                  <div className={!audio ? "text-red-500" : "text-gray-400"}>
                    {!audio ? <MicOff size={16} /> : <Mic size={16} />}
                  </div>
                </div>

                {/* Others */}
                {Object.entries(userMap).map(([id, user]) => (
                  <div key={id} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-700 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{user.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={user.isMuted ? "text-red-500" : "text-gray-400"}>
                        {user.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                      </div>
                      {isHost && (
                        <button className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove User">
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showChat && (
                <div className="absolute right-0 top-0 h-[calc(100vh-5rem)] md:h-[calc(100vh-80px)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col slide-in-right">
                    <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900"><h3 className="font-bold text-lg">In-Call Messages</h3><button onClick={toggleChat} className="text-gray-400 hover:text-white"><X size={20} /></button></div>
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-600">
                        {messages.length === 0 ? <div className="text-center text-neutral-500 text-sm mt-10">No messages yet</div> : messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}><div className={`text-xs text-gray-400 mb-1 ${msg.isMe ? "text-right" : "text-left"}`}>{msg.sender}</div><div className={`px-4 py-2 rounded-lg max-w-[85%] break-words text-sm ${msg.isMe ? "bg-blue-600 text-white" : "bg-neutral-700 text-gray-100"}`}>{msg.text}</div></div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-neutral-700 bg-neutral-900">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2"><input type="text" className="flex-1 bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Send a message..." value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} /><button type="submit" className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"><Send size={18} /></button></form>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
}