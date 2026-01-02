import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, MonitorOff, MessageSquare, PhoneOff,
  Info, X, Send, Copy, Check, Users, ShieldAlert, UserMinus, UserCheck, Lock,
  Hand, Smile, Unlock, Trash2, Pin, Settings, Volume2, Power, Crown, ChevronLeft,
  ChevronRight, Loader2, Captions, Disc, MoreVertical, Ban, UserCog
} from "lucide-react";
import server from "../environment";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

const server_url = server;

const peerConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* --------------------- AVATAR HELPERS --------------------- */
const getAvatarColor = (name) => {
  const colors = ["bg-red-600", "bg-orange-600", "bg-amber-600", "bg-green-600", "bg-emerald-600", "bg-teal-600", "bg-cyan-600", "bg-blue-600", "bg-indigo-600", "bg-violet-600", "bg-purple-600", "bg-fuchsia-600", "bg-pink-600", "bg-rose-600"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const AvatarFallback = ({ username, className = "" }) => {
  const initial = (username || "Guest").charAt(0).toUpperCase();
  const colorClass = getAvatarColor(username || "Guest");
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-neutral-800/80 backdrop-blur-md ${className}`}>
      <div className={`${colorClass} rounded-full flex items-center justify-center text-white font-bold shadow-2xl aspect-square w-[35%] max-w-[150px] min-w-[80px] border-4 border-white/10`}>
        <span className="text-[clamp(2rem,6vw,5rem)] leading-none">{initial}</span>
      </div>
    </div>
  );
};

/* --------------------- VIDEO PLAYER --------------------- */
const VideoPlayer = ({ stream, isLocal, isMirrored, className, audioOutputId, username }) => {
  const videoRef = useRef(null);
  const [isTrackMuted, setIsTrackMuted] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch((e) => console.warn("Autoplay blocked", e));
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setIsTrackMuted(!videoTrack.enabled || videoTrack.muted);
        const handleMute = () => setIsTrackMuted(true);
        const handleUnmute = () => setIsTrackMuted(false);
        const handleEnded = () => setIsTrackMuted(true);
        videoTrack.addEventListener("mute", handleMute);
        videoTrack.addEventListener("unmute", handleUnmute);
        videoTrack.addEventListener("ended", handleEnded);
        return () => {
          videoTrack.removeEventListener("mute", handleMute);
          videoTrack.removeEventListener("unmute", handleUnmute);
          videoTrack.removeEventListener("ended", handleEnded);
        };
      }
    } else if (!stream) {
      setIsTrackMuted(true);
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && audioOutputId && typeof videoRef.current.setSinkId === "function") {
      videoRef.current.setSinkId(audioOutputId).catch((err) => console.warn("Audio Sink Error:", err));
    }
  }, [audioOutputId]);

  if (isTrackMuted) return <AvatarFallback username={username} className={className} />;
  return <video ref={videoRef} autoPlay muted={isLocal} playsInline className={`${className} ${isMirrored ? "-scale-x-100" : ""}`} />;
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { url: meetingCode } = useParams();
  const { bypassLobby = false, isAudioOn = true, isVideoOn = true, username = "Guest", isHost = false, passcode = null } = location.state || {};

  // Refs
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const connectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const displayStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalysersRef = useRef({});
  const chatContainerRef = useRef(null);
  const pendingIce = useRef({});
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  // State
  const [loading, setLoading] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [askForUsername, setAskForUsername] = useState(false);
  const [userName, setUsername] = useState(username || "Guest");
  const [video, setVideo] = useState(isVideoOn ?? true);
  const [audio, setAudio] = useState(isAudioOn ?? true);
  const [screen, setScreen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [roomHostId, setRoomHostId] = useState(null);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState("GRID");
  const [gridPage, setGridPage] = useState(0);
  const GRID_PAGE_SIZE = 4;
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Features
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojis, setActiveEmojis] = useState({});
  const [showCaptions, setShowCaptions] = useState(false);
  const [remoteCaption, setRemoteCaption] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Devices
  const [devices, setDevices] = useState({ audioInputs: [], videoInputs: [], audioOutputs: [] });
  const [selectedDevices, setSelectedDevices] = useState({ audioInput: "", videoInput: "", audioOutput: "" });
  const [isAudioConnected, setIsAudioConnected] = useState(true);

  const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "👏", "🎉"];
  const amIHost = roomHostId && socketIdRef.current ? roomHostId === socketIdRef.current : isHost;

  const { startListening, stopListening, captions: localCaption } = useSpeechRecognition(socketInstance, meetingCode, userName);

  // --- INITIALIZATION ---
  useEffect(() => {
    let mounted = true;
    const init = async () => {
        try {
            await getMedia();
            if (mounted) {
                if (bypassLobby || (username && username !== "Guest")) {
                    connectSocket();
                } else {
                    setAskForUsername(true);
                }
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };
    init();
    return () => {
        mounted = false;
        if(localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if(socketRef.current) socketRef.current.disconnect();
        if(audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const addToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!video) stream.getVideoTracks().forEach(t => t.enabled = false);
      if (!audio) stream.getAudioTracks().forEach(t => t.enabled = false);
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      await getDeviceList();
    } catch (err) { console.error(err); addToast("Camera/Mic access denied", "error"); }
  };

  const getDeviceList = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        audioInputs: devices.filter(d => d.kind === "audioinput"),
        videoInputs: devices.filter(d => d.kind === "videoinput"),
        audioOutputs: devices.filter(d => d.kind === "audiooutput")
      });
    } catch (e) { console.error(e); }
  };

  // --- SOCKET LOGIC ---
  const connectSocket = () => {
    if (socketRef.current?.connected) return;
    const token = localStorage.getItem("token");
    socketRef.current = io(server_url, { auth: { token }, transports: ["websocket", "polling"] });

    socketRef.current.on("connect", () => {
      setSocketInstance(socketRef.current);
      socketIdRef.current = socketRef.current.id;
      const payload = { path: meetingCode, username: userName, passcode: passcodeInput || passcode, isVideoOff: !video, isMuted: !audio };
      if (isHost) socketRef.current.emit("join-call", payload);
      else { socketRef.current.emit("request-join", payload); setIsInWaitingRoom(true); }
    });

    socketRef.current.on("all-users", users => users.forEach(u => setUserMap(prev => ({...prev, [u.socketId]: u}))));
    socketRef.current.on("user-joined", user => { setUserMap(prev => ({...prev, [user.socketId]: user})); const pc = createPeer(user.socketId); initiateOffer(user.socketId, pc); addToast(`${user.username} joined`); });
    socketRef.current.on("user-left", id => { connectionsRef.current[id]?.close(); delete connectionsRef.current[id]; setVideos(v => v.filter(x => x.socketId !== id)); setUserMap(prev => { const copy = {...prev}; delete copy[id]; return copy; }); });
    socketRef.current.on("signal", async (fromId, msg) => {
        const signal = JSON.parse(msg);
        let pc = connectionsRef.current[fromId];
        if(!pc) pc = createPeer(fromId);
        if(signal.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            if(signal.sdp.type === 'offer') {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketRef.current.emit('signal', fromId, JSON.stringify({sdp: pc.localDescription}));
            }
            if(pendingIce.current[fromId]) {
                pendingIce.current[fromId].forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
                delete pendingIce.current[fromId];
            }
        } else if(signal.ice) {
            if(pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
            else {
                pendingIce.current[fromId] = pendingIce.current[fromId] || [];
                pendingIce.current[fromId].push(signal.ice);
            }
        }
    });
    socketRef.current.on("receive-message", data => { setMessages(prev => [...prev, {...data, isMe: data.socketId === socketRef.current.id}]); if(!showChat && data.socketId !== socketRef.current.id) setUnreadMessages(prev => prev + 1); });
    socketRef.current.on("admitted", () => { setIsInWaitingRoom(false); socketRef.current.emit("join-call", { path: meetingCode, username: userName, passcode: passcodeInput || passcode, isVideoOff: !video, isMuted: !audio }); addToast("You have been admitted!", "success"); });
    socketRef.current.on("update-waiting-list", users => { if(amIHost) setWaitingUsers(users); });
    socketRef.current.on("hand-toggled", ({socketId, isRaised}) => setUserMap(prev => ({...prev, [socketId]: {...prev[socketId], isHandRaised: isRaised}})));
    socketRef.current.on("audio-toggled", ({socketId, isMuted}) => setUserMap(prev => ({...prev, [socketId]: {...prev[socketId], isMuted: isMuted}})));
    socketRef.current.on("video-toggled", ({socketId, isVideoOff}) => setUserMap(prev => ({...prev, [socketId]: {...prev[socketId], isVideoOff: isVideoOff}})));
    socketRef.current.on("emoji-received", ({socketId, emoji}) => { setActiveEmojis(prev => ({...prev, [socketId]: emoji})); setTimeout(() => setActiveEmojis(prev => { const n = {...prev}; delete n[socketId]; return n; }), 3000); });
    socketRef.current.on("receive-caption", (data) => { if(showCaptions) { setRemoteCaption(data); setTimeout(() => setRemoteCaption(null), 4000); } });
    
    // Error Handling
    socketRef.current.on("connect_error", (err) => { if (err.message.includes("token")) addToast("Connection refused", "error"); });
    socketRef.current.on("passcode-required", () => { setIsInWaitingRoom(false); setShowPasscodeModal(true); setPasscodeError(true); socketRef.current.disconnect(); });
    socketRef.current.on("invalid-meeting", () => { addToast("Meeting not found!", "error"); setTimeout(cleanupAndLeave, 2000); });
    socketRef.current.on("meeting-ended", () => { if (!amIHost) { addToast("Host ended meeting", "error"); setTimeout(cleanupAndLeave, 1500); } });
    socketRef.current.on("force-mute", () => { if (localStreamRef.current) localStreamRef.current.getAudioTracks()[0].enabled = false; setAudio(false); socketRef.current.emit("toggle-audio", { isMuted: true }); addToast("Host muted everyone", "info"); });
    socketRef.current.on("force-stop-video", () => { if (localStreamRef.current) localStreamRef.current.getVideoTracks()[0].enabled = false; setVideo(false); socketRef.current.emit("toggle-video", { isVideoOff: true }); addToast("Host stopped all video", "info"); });
    socketRef.current.on("update-host-id", (hostId) => setRoomHostId(hostId));
    socketRef.current.on("lock-update", (isLocked) => { setIsMeetingLocked(isLocked); addToast(isLocked ? "Meeting Locked 🔒" : "Meeting Unlocked 🔓", "info"); });
  };

  const createPeer = (targetId) => {
      const pc = new RTCPeerConnection(peerConfig);
      pc.targetId = targetId;
      connectionsRef.current[targetId] = pc;
      const videoTrack = screen && displayStreamRef.current ? displayStreamRef.current.getVideoTracks()[0] : localStreamRef.current?.getVideoTracks()[0];
      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      if(videoTrack) pc.addTrack(videoTrack, localStreamRef.current);
      if(audioTrack && isAudioConnected) pc.addTrack(audioTrack, localStreamRef.current);
      pc.onicecandidate = e => { if(e.candidate) socketRef.current.emit('signal', targetId, JSON.stringify({ice: e.candidate})); };
      pc.ontrack = e => setVideos(prev => { if(prev.some(v => v.socketId === targetId)) return prev; return [...prev, {socketId: targetId, stream: e.streams[0]}]; });
      return pc;
  };

  const initiateOffer = async (targetId, pc) => {
      if(!pc) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('signal', targetId, JSON.stringify({sdp: pc.localDescription}));
      } catch(err) { console.error(err); }
  };

  const cleanupAndLeave = () => {
      if(localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if(displayStreamRef.current) displayStreamRef.current.getTracks().forEach(t => t.stop());
      if(audioContextRef.current) audioContextRef.current.close();
      Object.values(connectionsRef.current).forEach(pc => pc.close());
      if(socketRef.current) { socketRef.current.emit("leave-room"); socketRef.current.disconnect(); }
      navigate("/");
  };

  // --- ACTIONS ---
  const handleToggleHand = () => { const newState = !isHandRaised; setIsHandRaised(newState); socketRef.current.emit("toggle-hand", {isRaised: newState}); if(isMobile) setShowMobileMenu(false); };
  const handleSendEmoji = (emoji) => { setShowEmojiPicker(false); setActiveEmojis(prev => ({...prev, [socketIdRef.current]: emoji})); setTimeout(() => setActiveEmojis(prev => { const n = {...prev}; delete n[socketIdRef.current]; return n; }), 3000); socketRef.current.emit("send-emoji", {emoji}); };
  const handleSendMessage = () => { if(!currentMessage.trim()) return; const msg = { text: currentMessage, sender: userName, socketId: socketRef.current.id, timestamp: new Date().toISOString() }; socketRef.current.emit("send-message", msg); setMessages(prev => [...prev, {...msg, isMe: true}]); setCurrentMessage(""); };
  const handleSubmitPasscode = (e) => { e.preventDefault(); if(passcodeInput.trim()) { setShowPasscodeModal(false); setPasscodeError(false); connectSocket(); } };
  const handleToggleLock = () => { socketRef.current.emit("toggle-lock"); if(isMobile) setShowMobileMenu(false); };
  const handleKickUser = (id) => { if(window.confirm("Kick user?")) { socketRef.current.emit("kick-user", id); addToast("User removed", "error"); } };
  const handleMuteAll = () => { if(window.confirm("Mute all?")) { socketRef.current.emit("mute-all"); addToast("Muted everyone"); } };
  const handleStopVideoAll = () => { if(window.confirm("Stop all video?")) { socketRef.current.emit("stop-video-all"); addToast("Stopped videos"); } };
  const handleTransferHost = (id) => { if(window.confirm("Transfer host rights?")) { socketRef.current.emit("transfer-host", id); addToast("Host transferred"); } };
  const handleEndCall = () => { if(amIHost && window.confirm("End meeting for everyone?")) { socketRef.current.emit("end-meeting-for-all"); setTimeout(cleanupAndLeave, 100); } else cleanupAndLeave(); };
  
  // --- FIXED: ADDED handleToggleRecord ---
  const handleToggleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addToast("Recording saved", "success");
    } else {
      const stream = displayStreamRef.current || localStreamRef.current;
      if (!stream) return addToast("No stream to record", "error");
      const options = { mimeType: "video/webm; codecs=vp9" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.style.display = "none"; a.href = url; a.download = `recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); recordedChunksRef.current = [];
      };
      mediaRecorderRef.current = mediaRecorder; // Ensure ref is set
      mediaRecorder.start();
      setIsRecording(true);
      addToast("Recording started", "info");
    }
  };

  const toggleCaptions = () => {
    if (!showCaptions) { startListening(); setShowCaptions(true); addToast("Captions enabled", "success"); } 
    else { stopListening(); setShowCaptions(false); addToast("Captions disabled", "info"); }
  };

  const handleScreen = async () => { if(isMobile) return addToast("Not supported on mobile", "error"); if(!screen) { try { const display = await navigator.mediaDevices.getDisplayMedia({video:true}); displayStreamRef.current = display; const track = display.getVideoTracks()[0]; Object.values(connectionsRef.current).forEach(pc => { const sender = pc.getSenders().find(s => s.track.kind === "video"); if(sender) sender.replaceTrack(track); }); track.onended = () => handleScreen(); setScreen(true); } catch(err){ console.log("Cancelled"); } } else { displayStreamRef.current?.getTracks().forEach(t => t.stop()); displayStreamRef.current = null; const track = localStreamRef.current?.getVideoTracks()[0]; Object.values(connectionsRef.current).forEach(pc => { const sender = pc.getSenders().find(s => s.track.kind === "video"); if(sender) sender.replaceTrack(track); }); setScreen(false); } };
  const handleVideo = () => { const track = localStreamRef.current?.getVideoTracks()[0]; if(track) { track.enabled = !video; setVideo(!video); socketRef.current.emit("toggle-video", {isVideoOff: video}); } };
  const handleAudio = () => { if(!isAudioConnected) { setShowSettings(true); return; } const track = localStreamRef.current?.getAudioTracks()[0]; if(track) { track.enabled = !audio; setAudio(!audio); socketRef.current.emit("toggle-audio", {isMuted: audio}); } };
  const handleAdmit = (id) => { socketRef.current.emit("admit-user", id); addToast("Admitted"); };
  const handleTileClick = (id) => setPinnedUserId(id === pinnedUserId ? null : id);
  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); addToast("Link copied"); };
  const handleDeviceChange = async (type, deviceId) => { setSelectedDevices(prev => ({...prev, [type]: deviceId})); };

  useEffect(() => { if(chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [messages]);
  useEffect(() => { if(showChat) setUnreadMessages(0); }, [showChat]);
  useEffect(() => { const checkMobile = () => setIsMobile(window.innerWidth < 768); checkMobile(); window.addEventListener("resize", checkMobile); return () => window.removeEventListener("resize", checkMobile); }, []);
  const connect = () => { setAskForUsername(false); connectSocket(); };

  // --- AUDIO LEVEL ANALYZER ---
  useEffect(() => {
    if (!audioContextRef.current) return;
    videos.forEach(v => {
        if(v.stream && v.stream.active && v.stream.getAudioTracks().length > 0 && !audioAnalysersRef.current[v.socketId]) {
            try {
                const source = audioContextRef.current.createMediaStreamSource(v.stream);
                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 512;
                source.connect(analyser);
                audioAnalysersRef.current[v.socketId] = analyser;
            } catch(e) {}
        }
    });
  }, [videos]);

  useEffect(() => {
    const interval = setInterval(() => {
        if(!audioContextRef.current) return;
        let maxVolume = 0; let speaker = null;
        Object.entries(audioAnalysersRef.current).forEach(([id, analyser]) => {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const volume = data.reduce((a,b) => a+b, 0) / data.length;
            if(volume > 20 && volume > maxVolume) { maxVolume = volume; speaker = id; }
        });
        if(speaker && speaker !== activeSpeakerId) setActiveSpeakerId(speaker);
    }, 500);
    return () => clearInterval(interval);
  }, [activeSpeakerId]);

  // --- RENDER HELPERS ---
  const getMainSocketId = () => pinnedUserId || activeSpeakerId || (videos.length > 0 ? videos[0].socketId : "local");

  const renderPaginatedGrid = () => {
      const allParticipants = [{ socketId: "local", stream: localStream, isLocal: true }, ...videos.map(v => ({...v, isLocal: false}))];
      const visible = isMobile ? allParticipants : allParticipants.slice(gridPage * GRID_PAGE_SIZE, (gridPage + 1) * GRID_PAGE_SIZE);
      const totalPages = Math.ceil(allParticipants.length / GRID_PAGE_SIZE);
      
      let gridClass = "grid-cols-1";
      if(visible.length === 2) gridClass = "grid-cols-1 md:grid-cols-2";
      if(visible.length >= 3) gridClass = "grid-cols-2";
      if(!isMobile && visible.length >= 5) gridClass = "grid-cols-2 lg:grid-cols-3";

      return (
          <div className="relative w-full h-full bg-black p-2 flex flex-col items-center justify-center">
              <div className={`grid ${gridClass} gap-2 w-full max-w-6xl h-full transition-all`}>
                  {visible.map(p => {
                      const pId = p.isLocal ? socketIdRef.current || "local" : p.socketId;
                      const user = p.isLocal ? {username: userName, isMuted: !audio, isVideoOff: !video} : userMap[pId] || {username: "Guest"};
                      const isCamOff = p.isLocal ? !video : user.isVideoOff;
                      
                      return (
                          <div key={pId} className={`relative bg-neutral-800 rounded-xl overflow-hidden border-2 w-full h-full ${activeSpeakerId === pId && !p.isLocal ? "border-green-500" : "border-neutral-700"}`}>
                              {isCamOff ? <AvatarFallback username={user.username}/> : <VideoPlayer stream={p.stream} isLocal={p.isLocal} isMirrored={p.isLocal && !screen} className="w-full h-full object-cover" username={user.username}/>}
                              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                                  {user.isMuted ? <MicOff size={12} className="text-red-500"/> : <Mic size={12} className="text-white"/>}
                                  {p.isLocal ? "You" : user.username}
                              </div>
                          </div>
                      );
                  })}
              </div>
              {!isMobile && totalPages > 1 && (
                  <>
                    {gridPage > 0 && <button onClick={() => setGridPage(p => p-1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full"><ChevronLeft/></button>}
                    {gridPage < totalPages - 1 && <button onClick={() => setGridPage(p => p+1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full"><ChevronRight/></button>}
                  </>
              )}
          </div>
      );
  };

  const renderMainSpotlight = () => {
      const mainId = getMainSocketId();
      const isLocal = mainId === "local" || mainId === socketIdRef.current;
      const user = isLocal ? {username: userName, isVideoOff: !video, isMuted: !audio} : userMap[mainId] || {username: "Guest"};
      const stream = isLocal ? localStream : videos.find(v => v.socketId === mainId)?.stream;
      const isCamOff = isLocal ? !video : user.isVideoOff;

      return (
          <div className="relative w-full h-full flex items-center justify-center bg-black/90">
              {isCamOff ? <AvatarFallback username={user.username}/> : <VideoPlayer stream={stream} isLocal={isLocal} isMirrored={isLocal && !screen} className="max-w-full max-h-full object-contain" username={user.username}/>}
              
              {showCaptions && (remoteCaption || localCaption) && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-2 rounded-xl text-white text-center max-w-2xl">
                      <p className="text-gray-400 text-xs font-bold mb-1">{remoteCaption ? remoteCaption.username : "You"}</p>
                      <p>{remoteCaption ? remoteCaption.caption : localCaption}</p>
                  </div>
              )}
              
              <div className="absolute bottom-6 left-6 bg-black/60 px-4 py-2 rounded-xl flex items-center gap-3">
                  {user.isMuted ? <MicOff size={16} className="text-red-500"/> : <Mic size={16} className="text-white"/>}
                  <span className="font-bold">{user.username} {isLocal && "(You)"}</span>
                  {user.isHandRaised && <Hand size={16} className="text-yellow-500"/>}
              </div>
          </div>
      );
  };

  const renderSideStrip = () => {
      const mainId = getMainSocketId();
      const all = [{ socketId: "local", stream: localStream, isLocal: true }, ...videos.map(v => ({...v, isLocal: false}))];
      return all.filter(p => (p.isLocal ? socketIdRef.current || "local" : p.socketId) !== mainId).map(p => {
          const pId = p.isLocal ? socketIdRef.current || "local" : p.socketId;
          const user = p.isLocal ? {username: userName, isVideoOff: !video} : userMap[pId] || {username: "Guest"};
          return (
              <div key={pId} onClick={() => setPinnedUserId(pId)} className="w-48 aspect-video bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-700 cursor-pointer relative">
                  {p.isLocal && !video || !p.isLocal && user.isVideoOff ? <AvatarFallback username={user.username}/> : <VideoPlayer stream={p.stream} isLocal={p.isLocal} isMirrored={p.isLocal && !screen} className="w-full h-full object-cover" username={user.username}/>}
                  <div className="absolute bottom-1 left-1 text-xs bg-black/60 px-1 rounded">{user.username}</div>
              </div>
          );
      });
  };

  // --- RENDER ---
  if (loading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Preparing meeting...</div>;

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => <div key={t.id} className={`bg-neutral-800 border-l-4 ${t.type==='error'?'border-red-500':'border-blue-500'} p-4 rounded shadow-2xl flex items-center gap-3 pointer-events-auto`}>{t.msg}</div>)}
      </div>

      {showSettings && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
              <div className="bg-neutral-800 p-6 rounded-2xl max-w-md w-full border border-neutral-700">
                  <div className="flex justify-between mb-6"><h2 className="text-xl font-bold flex gap-2"><Settings/> Settings</h2><button onClick={()=>setShowSettings(false)}><X/></button></div>
                  <div className="space-y-4">
                      <div><label className="text-sm text-gray-400">Microphone</label><select className="w-full bg-neutral-900 border border-neutral-600 rounded p-2" value={selectedDevices.audioInput} onChange={e=>handleDeviceChange("audioInput", e.target.value)}>{devices.audioInputs.map(d=><option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}</select></div>
                      <div><label className="text-sm text-gray-400">Camera</label><select className="w-full bg-neutral-900 border border-neutral-600 rounded p-2" value={selectedDevices.videoInput} onChange={e=>handleDeviceChange("videoInput", e.target.value)}>{devices.videoInputs.map(d=><option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}</select></div>
                  </div>
              </div>
          </div>
      )}

      {showPasscodeModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
              <div className="bg-neutral-800 p-8 rounded-2xl max-w-sm w-full text-center">
                  <Lock size={32} className="mx-auto mb-6 text-red-500"/>
                  <h2 className="text-2xl font-bold mb-4">Passcode Required</h2>
                  <form onSubmit={handleSubmitPasscode}>
                      <input type="password" autoFocus className="w-full bg-neutral-900 border border-neutral-600 rounded p-3 mb-4" placeholder="Enter Passcode" value={passcodeInput} onChange={e=>setPasscodeInput(e.target.value)}/>
                      {passcodeError && <p className="text-red-500 text-xs mb-3">Incorrect passcode</p>}
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold">Submit</button>
                  </form>
              </div>
          </div>
      )}

      {askForUsername && !showPasscodeModal && (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <div className="bg-neutral-800 p-8 rounded-xl max-w-md w-full border border-neutral-700">
                  <h2 className="text-2xl font-bold mb-6 text-center">Join Meeting</h2>
                  <input className="bg-neutral-700 border border-neutral-600 text-white rounded block w-full p-2.5 mb-6" placeholder="Name" value={userName} onChange={e=>setUsername(e.target.value)}/>
                  <div className="bg-black aspect-video rounded overflow-hidden mb-6 relative">{localStream ? <VideoPlayer stream={localStream} isLocal={true} isMirrored={true} className="w-full h-full object-cover"/> : <div className="absolute inset-0 flex items-center justify-center">Loading...</div>}</div>
                  <button onClick={connect} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded p-3">Join</button>
              </div>
          </div>
      )}

      {isInWaitingRoom && !askForUsername && !showPasscodeModal && (
          <div className="flex items-center justify-center min-h-screen bg-neutral-900"><div className="text-center"><ShieldAlert size={40} className="mx-auto text-yellow-500 mb-6"/><h2 className="text-2xl font-bold">Waiting for Host</h2></div></div>
      )}

      {!askForUsername && !isInWaitingRoom && !showPasscodeModal && (
        <div className="flex flex-col h-screen relative">
          <div className="flex-1 flex flex-col md:flex-row bg-black overflow-hidden relative">
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="flex-1 bg-black flex items-center justify-center relative">
                    {viewMode === 'GRID' ? renderPaginatedGrid() : renderMainSpotlight()}
                </div>
                {viewMode !== 'GRID' && !isMobile && <div className="h-28 border-t border-neutral-800 bg-neutral-900 flex overflow-x-auto p-2 gap-2">{renderSideStrip()}</div>}
            </div>

            {/* --- PARTICIPANTS SIDEBAR --- */}
            {showParticipants && (
                <div className="w-full md:w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col absolute inset-0 md:static z-40 animate-in slide-in-from-right duration-200">
                    <div className="p-4 border-b border-neutral-800 flex justify-between items-center"><h3 className="font-bold">Participants ({Object.keys(userMap).length + 1})</h3><button onClick={()=>setShowParticipants(false)}><X size={20}/></button></div>
                    {amIHost && (
                        <div className="p-4 border-b border-neutral-800 flex gap-2">
                            <button onClick={handleMuteAll} className="flex-1 bg-neutral-800 hover:bg-neutral-700 py-2 rounded text-xs text-red-400 font-bold border border-red-900/50">Mute All</button>
                            <button onClick={handleStopVideoAll} className="flex-1 bg-neutral-800 hover:bg-neutral-700 py-2 rounded text-xs text-red-400 font-bold border border-red-900/50">Stop Video</button>
                        </div>
                    )}
                    {amIHost && waitingUsers.length > 0 && (
                        <div className="p-4 bg-yellow-900/10 border-b border-yellow-900/30">
                            <h4 className="text-xs font-bold text-yellow-500 uppercase mb-2">Waiting Room</h4>
                            {waitingUsers.map(u => (
                                <div key={u.socketId} className="flex justify-between items-center mb-2 last:mb-0">
                                    <span className="text-sm">{u.username}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAdmit(u.socketId)} className="p-1 bg-green-600 rounded"><UserCheck size={14}/></button>
                                        <button onClick={() => handleKickUser(u.socketId)} className="p-1 bg-red-600 rounded"><UserMinus size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">{userName.charAt(0)}</div><span>{userName} (You)</span></div></div>
                        {Object.values(userMap).map(u => (
                            <div key={u.socketId} className="flex justify-between items-center relative">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center font-bold">{u.username.charAt(0)}</div>
                                    <span>{u.username}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {u.isMuted && <MicOff size={14} className="text-red-500"/>}
                                    {u.isVideoOff && <VideoOff size={14} className="text-red-500"/>}
                                    {amIHost && (
                                        <div className="relative">
                                            <button onClick={() => setActiveMenuId(activeMenuId === u.socketId ? null : u.socketId)} className="p-1 hover:bg-neutral-800 rounded"><MoreVertical size={14}/></button>
                                            {activeMenuId === u.socketId && (
                                                <div className="absolute right-0 top-6 w-32 bg-neutral-800 border border-neutral-700 rounded shadow-xl z-50 flex flex-col">
                                                    <button onClick={() => {handleKickUser(u.socketId); setActiveMenuId(null)}} className="px-3 py-2 text-left text-xs hover:bg-red-900/50 text-red-400 flex items-center gap-2"><Ban size={12}/> Remove</button>
                                                    <button onClick={() => {handleTransferHost(u.socketId); setActiveMenuId(null)}} className="px-3 py-2 text-left text-xs hover:bg-neutral-700 flex items-center gap-2"><UserCog size={12}/> Make Host</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showChat && (
                <div className="w-full md:w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col absolute inset-0 md:static z-40 animate-in slide-in-from-right duration-200">
                    <div className="p-4 border-b border-neutral-800 flex justify-between items-center"><h3 className="font-bold">Chat</h3><button onClick={()=>setShowChat(false)}><X size={20}/></button></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-xl p-3 ${m.isMe ? 'bg-blue-600' : 'bg-neutral-800'}`}>
                                    {!m.isMe && <p className="text-xs font-bold text-gray-400 mb-1">{m.sender}</p>}
                                    <p className="text-sm">{m.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-neutral-800 relative">
                        <input className="w-full bg-neutral-800 rounded-full py-3 pl-4 pr-12 text-sm outline-none" placeholder="Send a message..." value={currentMessage} onChange={e=>setCurrentMessage(e.target.value)} onKeyPress={e=>e.key==='Enter' && handleSendMessage()}/>
                        <button onClick={handleSendMessage} className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400"><Send size={18}/></button>
                    </div>
                </div>
            )}

            {showInfo && (
                <div className="absolute top-4 right-4 z-50 bg-neutral-800 border border-neutral-700 p-6 rounded-xl shadow-2xl max-w-sm animate-in fade-in zoom-in">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Meeting Info</h3><button onClick={() => setShowInfo(false)}><X size={18}/></button></div>
                    <div className="space-y-4">
                        <div><p className="text-xs text-gray-400 uppercase mb-1">Meeting Link</p><div className="flex gap-2"><input readOnly value={window.location.href} className="w-full bg-neutral-900 border border-neutral-600 rounded p-2 text-xs text-gray-300"/><button onClick={handleCopyLink} className="p-2 bg-blue-600 rounded hover:bg-blue-500"><Copy size={14}/></button></div></div>
                        <div><p className="text-xs text-gray-400 uppercase mb-1">Meeting Code</p><p className="font-mono text-xl font-bold tracking-wider">{meetingCode}</p></div>
                    </div>
                </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="hidden md:flex h-20 bg-neutral-900 border-t border-neutral-800 items-center justify-center z-20 px-4 gap-4 relative">
             <button onClick={() => setShowSettings(true)} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 absolute left-4 flex flex-col items-center gap-1 group"><Settings size={20}/><span className="text-[10px] text-gray-400 group-hover:text-white">Settings</span></button>
             
             <button onClick={handleAudio} className="flex flex-col items-center gap-1 group"><div className={`p-3 rounded-xl ${audio ? 'bg-neutral-800 group-hover:bg-neutral-700' : 'bg-red-500 text-white'}`}>{audio ? <Mic size={24}/> : <MicOff size={24}/>}</div><span className="text-[10px] text-gray-400">Mic</span></button>
             <button onClick={handleVideo} className="flex flex-col items-center gap-1 group"><div className={`p-3 rounded-xl ${video ? 'bg-neutral-800 group-hover:bg-neutral-700' : 'bg-red-500 text-white'}`}>{video ? <Video size={24}/> : <VideoOff size={24}/>}</div><span className="text-[10px] text-gray-400">Cam</span></button>
             <button onClick={handleToggleHand} className="flex flex-col items-center gap-1 group"><div className={`p-3 rounded-xl ${isHandRaised ? 'bg-yellow-500 text-black' : 'bg-neutral-800 group-hover:bg-neutral-700'}`}><Hand size={24}/></div><span className="text-[10px] text-gray-400">Hand</span></button>
             <button onClick={handleScreen} className="flex flex-col items-center gap-1 group"><div className={`p-3 rounded-xl ${screen ? 'bg-blue-600 text-white' : 'bg-neutral-800 group-hover:bg-neutral-700'}`}>{screen ? <MonitorOff size={24}/> : <ScreenShare size={24}/>}</div><span className="text-[10px] text-gray-400">Share</span></button>
             <button onClick={toggleCaptions} className="flex flex-col items-center gap-1 group"><div className={`p-3 rounded-xl ${showCaptions ? 'bg-indigo-600 text-white' : 'bg-neutral-800 group-hover:bg-neutral-700'}`}><Captions size={24}/></div><span className="text-[10px] text-gray-400">Captions</span></button>
             <button onClick={handleToggleRecord} className="flex flex-col items-center gap-1 group"><div className={`p-3 rounded-xl ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-neutral-800 group-hover:bg-neutral-700'}`}><Disc size={24}/></div><span className="text-[10px] text-gray-400">Record</span></button>
             
             <button onClick={handleEndCall} className="p-3 rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700 transition-colors text-white">End Call</button>

             <div className="absolute right-4 flex gap-3">
                 <button onClick={() => setShowInfo(!showInfo)} className="flex flex-col items-center gap-1 group">
                    <div className={`p-3 rounded-xl ${showInfo ? 'bg-blue-600' : 'bg-neutral-800 group-hover:bg-neutral-700'}`}>
                        <Info size={24}/>
                    </div>
                    <span className="text-[10px] text-gray-400 group-hover:text-white">Info</span>
                 </button>

                 <button onClick={() => setShowParticipants(!showParticipants)} className="flex flex-col items-center gap-1 group relative">
                    <div className={`p-3 rounded-xl ${showParticipants ? 'bg-blue-600' : 'bg-neutral-800 group-hover:bg-neutral-700'}`}>
                        <Users size={24}/>
                    </div>
                    {amIHost && waitingUsers.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-900"></span>}
                    <span className="text-[10px] text-gray-400 group-hover:text-white">People</span>
                 </button>

                 <button onClick={() => setShowChat(!showChat)} className="flex flex-col items-center gap-1 group relative">
                    <div className={`p-3 rounded-xl ${showChat ? 'bg-blue-600' : 'bg-neutral-800 group-hover:bg-neutral-700'}`}>
                        <MessageSquare size={24}/>
                    </div>
                    {unreadMessages > 0 && <span className="absolute top-0 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-900"></span>}
                    <span className="text-[10px] text-gray-400 group-hover:text-white">Chat</span>
                 </button>
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
}