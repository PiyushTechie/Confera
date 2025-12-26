import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, MonitorOff,
  MessageSquare, PhoneOff, Info, X, Send, Copy, Check,
  Users, LayoutDashboard, ShieldAlert, UserMinus, UserCheck, Gavel, MoreVertical,
  Lock, Hand, Smile, Unlock, Trash2, Pin, Settings, Volume2, Power, Crown,
  ChevronLeft, ChevronRight, Loader2, UserCog, MoreHorizontal // Changed MoreVertical to MoreHorizontal
} from "lucide-react";
import server from "../environment";

const server_url = server;

const peerConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const VideoPlayer = ({ stream, isLocal, isMirrored, className, audioOutputId }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
        videoEl.srcObject = stream;
        videoEl.play().catch(e => console.warn("Autoplay blocked", e));
    }
  }, [stream]);
  useEffect(() => {
    if (videoRef.current && audioOutputId && typeof videoRef.current.setSinkId === 'function') {
        videoRef.current.setSinkId(audioOutputId).catch(err => console.warn("Audio Sink Error:", err));
    }
  }, [audioOutputId]);
  return <video ref={videoRef} autoPlay muted={isLocal} playsInline className={`${className} ${isMirrored ? "-scale-x-100" : ""}`} />;
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
    passcode = null 
  } = location.state || {};

  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const connectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  
  const displayStreamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalysersRef = useRef({});

  const [askForUsername, setAskForUsername] = useState(false);
  const [userName, setUsername] = useState(username || "Guest");
  const [video, setVideo] = useState(isVideoOn ?? true);
  const [audio, setAudio] = useState(isAudioOn ?? true);
  const [screen, setScreen] = useState(false);

  const [videos, setVideos] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [roomHostId, setRoomHostId] = useState(null);

  const amIHost = roomHostId && socketIdRef.current ? roomHostId === socketIdRef.current : isHost;

  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState({ audioInputs: [], videoInputs: [], audioOutputs: [] });
  const [selectedDevices, setSelectedDevices] = useState({ audioInput: "", videoInput: "", audioOutput: "" });
  const [isAudioConnected, setIsAudioConnected] = useState(true);

  const [viewMode, setViewMode] = useState("GRID");
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [gridPage, setGridPage] = useState(0);
  const GRID_PAGE_SIZE = 4;

  const [showInfo, setShowInfo] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "👏", "🎉"];
  const pendingIce = useRef({});

  /* --------------------- MEDIA --------------------- */
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!video) stream.getVideoTracks().forEach(t => t.enabled = false);
      if (!audio) stream.getAudioTracks().forEach(t => t.enabled = false);
      localStreamRef.current = stream;
      setLocalStream(stream); 
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      await getDeviceList();
    } catch (err) { console.error("Media error:", err); }
  };

  const getDeviceList = async () => {
      try {
          const deviceInfos = await navigator.mediaDevices.enumerateDevices();
          setDevices({
              audioInputs: deviceInfos.filter(d => d.kind === 'audioinput'),
              videoInputs: deviceInfos.filter(d => d.kind === 'videoinput'),
              audioOutputs: deviceInfos.filter(d => d.kind === 'audiooutput')
          });
          // Set initial selection logic here if needed
      } catch (err) { console.error("Error fetching devices:", err); }
  };

  const handleDeviceChange = async (type, deviceId) => {
      setSelectedDevices(prev => ({ ...prev, [type]: deviceId }));
      if (type === 'audioOutput') return;
      const constraints = {
          audio: type === 'audioInput' ? { deviceId: { exact: deviceId } } : undefined,
          video: type === 'videoInput' ? { deviceId: { exact: deviceId } } : undefined
      };
      if (type === 'audioInput' && video) constraints.video = true;
      if (type === 'videoInput' && isAudioConnected) constraints.audio = true;

      try {
          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          const newTrack = type === 'audioInput' ? newStream.getAudioTracks()[0] : newStream.getVideoTracks()[0];
          const oldTrack = type === 'audioInput' ? localStreamRef.current.getAudioTracks()[0] : localStreamRef.current.getVideoTracks()[0];
          if(oldTrack) { localStreamRef.current.removeTrack(oldTrack); oldTrack.stop(); }
          localStreamRef.current.addTrack(newTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks())); 
          Object.values(connectionsRef.current).forEach(pc => {
              const sender = pc.getSenders().find(s => s.track && s.track.kind === (type === 'audioInput' ? 'audio' : 'video'));
              if(sender) sender.replaceTrack(newTrack);
          });
          if (type === 'audioInput') newTrack.enabled = audio;
          if (type === 'videoInput') newTrack.enabled = video;
      } catch (err) { console.error("Device switch failed", err); }
  };

  const toggleAudioConnection = async () => {
      if (isAudioConnected) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; t.stop(); });
          setIsAudioConnected(false);
          setAudio(false);
          socketRef.current.emit("toggle-audio", { isMuted: true });
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedDevices.audioInput ? { exact: selectedDevices.audioInput } : undefined } });
              const newTrack = stream.getAudioTracks()[0];
              localStreamRef.current.addTrack(newTrack);
              setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
              Object.values(connectionsRef.current).forEach(pc => {
                  const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
                  if (sender) sender.replaceTrack(newTrack);
                  else pc.addTrack(newTrack, localStreamRef.current);
              });
              setIsAudioConnected(true);
              setAudio(true);
              socketRef.current.emit("toggle-audio", { isMuted: false });
          } catch(e) { console.error("Audio Reconnect Failed", e); }
      }
  };

  /* ------------------ ACTIVE SPEAKER ------------------ */
  useEffect(() => {
    if (!audioContextRef.current) return;
    videos.forEach((v) => {
      if (v.stream && v.stream.active && v.stream.getAudioTracks().length > 0 && !audioAnalysersRef.current[v.socketId]) {
        try {
            const source = audioContextRef.current.createMediaStreamSource(v.stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            audioAnalysersRef.current[v.socketId] = analyser;
        } catch (e) { console.error("Audio Context Error:", e); }
      }
    });
    const currentSocketIds = videos.map(v => v.socketId);
    Object.keys(audioAnalysersRef.current).forEach(id => {
        if (!currentSocketIds.includes(id)) delete audioAnalysersRef.current[id];
    });
  }, [videos]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (!audioContextRef.current) return;
        let maxVolume = 0;
        let loudestSpeaker = null;
        Object.entries(audioAnalysersRef.current).forEach(([socketId, analyser]) => {
            try {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const volume = sum / dataArray.length;
                if (volume > 20 && volume > maxVolume) { maxVolume = volume; loudestSpeaker = socketId; }
            } catch(e) {}
        });
        if (loudestSpeaker && loudestSpeaker !== activeSpeakerId) setActiveSpeakerId(loudestSpeaker);
    }, 500);
    return () => clearInterval(interval);
  }, [activeSpeakerId]);

  /* ------------------ SOCKET & PEER ------------------ */
  const createPeer = (targetId) => {
    const pc = new RTCPeerConnection(peerConfig);
    pc.targetId = targetId;
    connectionsRef.current[targetId] = pc;
    const videoTrack = screen && displayStreamRef.current ? displayStreamRef.current.getVideoTracks()[0] : localStreamRef.current?.getVideoTracks()[0];
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (videoTrack) pc.addTrack(videoTrack, localStreamRef.current);
    if (audioTrack && isAudioConnected) pc.addTrack(audioTrack, localStreamRef.current);
    pc.onicecandidate = e => { if (e.candidate) socketRef.current.emit("signal", targetId, JSON.stringify({ ice: e.candidate })); };
    pc.ontrack = e => { setVideos(prev => { if (prev.some(v => v.socketId === pc.targetId)) return prev; return [...prev, { socketId: pc.targetId, stream: e.streams[0] }]; }); };
    return pc;
  };

  const initiateOffer = async (targetId) => {
    const pc = connectionsRef.current[targetId];
    if (!pc) return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("signal", targetId, JSON.stringify({ sdp: pc.localDescription }));
    } catch (err) { console.error(err); }
  };

  const replaceVideoTrack = (newTrack) => {
    Object.values(connectionsRef.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      if (sender) sender.replaceTrack(newTrack);
    });
  };

  const connectSocket = () => {
    if (socketRef.current && socketRef.current.connected) return;
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      const payload = { path: window.location.href, username: userName, passcode: passcodeInput || passcode };
      if (isHost) socketRef.current.emit("join-call", payload);
      else { socketRef.current.emit("request-join", payload); setIsInWaitingRoom(true); }
    });

    socketRef.current.on("passcode-required", () => { setIsInWaitingRoom(false); setShowPasscodeModal(true); setPasscodeError(true); socketRef.current.disconnect(); });
    socketRef.current.on("invalid-meeting", () => { alert("Meeting not found!"); cleanupAndLeave(); });
    socketRef.current.on("meeting-ended", () => { if (!amIHost) { alert("The host has ended the meeting."); cleanupAndLeave(); } });
    
    // Audio Fix
    socketRef.current.on("force-mute", () => { 
        if (localStreamRef.current) { 
            const t = localStreamRef.current.getAudioTracks()[0]; 
            if(t) t.enabled = false; 
            setAudio(false); 
            socketRef.current.emit("toggle-audio", { isMuted: true }); 
        } 
        alert("The host has muted everyone."); 
    });
    
    socketRef.current.on("force-stop-video", () => { if (localStreamRef.current) { const t = localStreamRef.current.getVideoTracks()[0]; if(t) t.enabled = false; setVideo(false); socketRef.current.emit("toggle-video", { isVideoOff: true }); } alert("The host has stopped everyone's video."); });
    socketRef.current.on("update-host-id", (hostId) => setRoomHostId(hostId));
    socketRef.current.on("lock-update", (isLocked) => setIsMeetingLocked(isLocked));
    socketRef.current.on("admitted", () => { setIsInWaitingRoom(false); socketRef.current.emit("join-call", { path: window.location.href, username: userName, passcode: passcodeInput || passcode }); });
    socketRef.current.on("update-waiting-list", (users) => { if (amIHost) setWaitingUsers(users); });
    socketRef.current.on("all-users", (users) => { users.forEach(u => setUserMap(prev => ({ ...prev, [u.socketId]: u }))); });
    socketRef.current.on("user-joined", (user) => { setUserMap(prev => ({ ...prev, [user.socketId]: user })); createPeer(user.socketId); initiateOffer(user.socketId); });
    socketRef.current.on("hand-toggled", ({ socketId, isRaised }) => { if (socketId === socketRef.current.id) setIsHandRaised(isRaised); setUserMap(prev => ({ ...prev, [socketId]: { ...prev[socketId], isHandRaised: isRaised } })); });
    socketRef.current.on("audio-toggled", ({ socketId, isMuted }) => { setUserMap(prev => ({ ...prev, [socketId]: { ...prev[socketId], isMuted: isMuted } })); });
    socketRef.current.on("video-toggled", ({ socketId, isVideoOff }) => { setUserMap(prev => ({ ...prev, [socketId]: { ...prev[socketId], isVideoOff: isVideoOff } })); });
    socketRef.current.on("emoji-received", ({ socketId, emoji }) => { setActiveEmojis(prev => ({ ...prev, [socketId]: emoji })); setTimeout(() => { setActiveEmojis(prev => { const newState = { ...prev }; delete newState[socketId]; return newState; }); }, 3000); });
    socketRef.current.on("signal", async (fromId, msg) => { const signal = JSON.parse(msg); let pc = connectionsRef.current[fromId]; if (!pc) pc = createPeer(fromId); if (signal.sdp) { await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)); if (signal.sdp.type === "offer") { const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: pc.localDescription })); } if (pendingIce.current[fromId]) { pendingIce.current[fromId].forEach(c => pc.addIceCandidate(new RTCIceCandidate(c))); delete pendingIce.current[fromId]; } } else if (signal.ice) { if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(signal.ice)); else { pendingIce.current[fromId] = pendingIce.current[fromId] || []; pendingIce.current[fromId].push(signal.ice); } } });
    socketRef.current.on("user-left", (id) => { connectionsRef.current[id]?.close(); delete connectionsRef.current[id]; setVideos(v => v.filter(x => x.socketId !== id)); setUserMap(prev => { const copy = { ...prev }; delete copy[id]; return copy; }); });
    socketRef.current.on("receive-message", (data) => { const isMe = data.socketId === socketRef.current.id; setMessages(prev => [...prev, { ...data, isMe }]); });
  };

  const cleanupAndLeave = () => {
    if(localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if(displayStreamRef.current) displayStreamRef.current.getTracks().forEach(t => t.stop());
    if(audioContextRef.current) audioContextRef.current.close();
    Object.values(connectionsRef.current).forEach(pc => pc.close());
    if(socketRef.current) socketRef.current.disconnect();
    navigate("/");
  };

  /* ------------------ ACTIONS ------------------ */
  const handleToggleHand = () => { const newState = !isHandRaised; setIsHandRaised(newState); socketRef.current.emit("toggle-hand", { isRaised: newState }); if(isMobile) setShowMobileMenu(false); };
  const handleSendEmoji = (emoji) => { setShowEmojiPicker(false); if(isMobile) setShowMobileMenu(false); setActiveEmojis(prev => ({ ...prev, [socketIdRef.current]: emoji })); setTimeout(() => { setActiveEmojis(prev => { const newState = { ...prev }; delete newState[socketIdRef.current]; return newState; }); }, 3000); socketRef.current.emit("send-emoji", { emoji }); };
  const handleSendMessage = () => { if (!currentMessage.trim() || !socketRef.current) return; const msg = { text: currentMessage, sender: userName, socketId: socketRef.current.id, timestamp: new Date().toISOString() }; socketRef.current.emit("send-message", msg); setMessages(prev => [...prev, { ...msg, isMe: true }]); setCurrentMessage(""); };
  const handleSubmitPasscode = (e) => { e.preventDefault(); if(passcodeInput.trim()) { setShowPasscodeModal(false); setPasscodeError(false); connectSocket(); } };
  const handleToggleLock = () => { socketRef.current.emit("toggle-lock"); if(isMobile) setShowMobileMenu(false); };
  
  const handleTransferHost = (targetId) => {
      if(window.confirm("Make this user the Host? You will lose admin controls.")) {
          socketRef.current.emit("transfer-host", targetId);
      }
  };

  const handleKickUser = (targetId) => { if(window.confirm("Remove this participant?")) socketRef.current.emit("kick-user", targetId); };
  const handleMuteAll = () => { if(window.confirm("Mute everyone?")) socketRef.current.emit("mute-all"); };
  const handleStopVideoAll = () => { if(window.confirm("Stop everyone's video?")) socketRef.current.emit("stop-video-all"); };
  const handleEndCall = () => { if (amIHost) { if(window.confirm("Do you want to end the meeting for everyone?")) { socketRef.current.emit("end-meeting-for-all"); cleanupAndLeave(); } } else { cleanupAndLeave(); } };
  
  const handleScreen = async () => {
    if (isMobile) { alert("Not supported on mobile."); return; }
    if (!screen) { try { const display = await navigator.mediaDevices.getDisplayMedia({ video: true }); displayStreamRef.current = display; const track = display.getVideoTracks()[0]; 
        Object.values(connectionsRef.current).forEach(pc => { const sender = pc.getSenders().find(s => s.track.kind === 'video'); if(sender) sender.replaceTrack(track); });
        track.onended = () => handleScreen(); setScreen(true); } catch (err) { console.log("Cancelled"); } } 
    else { displayStreamRef.current?.getTracks().forEach(t => t.stop()); displayStreamRef.current = null; const camTrack = localStreamRef.current?.getVideoTracks()[0]; 
        Object.values(connectionsRef.current).forEach(pc => { const sender = pc.getSenders().find(s => s.track.kind === 'video'); if(sender) sender.replaceTrack(camTrack); });
        setScreen(false); }
  };

  const handleVideo = () => { const track = localStreamRef.current?.getVideoTracks()[0]; if (track) { track.enabled = !video; setVideo(!video); socketRef.current.emit("toggle-video", { isVideoOff: video }); } };
  
  const handleAudio = () => { 
      if (!isAudioConnected) { setShowSettings(true); return; } 
      const track = localStreamRef.current?.getAudioTracks()[0]; 
      if (track) { 
          // Explicitly set the enabled state based on desired action
          track.enabled = !audio; 
          setAudio(!audio); 
          socketRef.current.emit("toggle-audio", { isMuted: audio }); 
      } 
  };

  const handleAdmit = (socketId) => socketRef.current.emit("admit-user", socketId);
  const handleTileClick = (id) => { if (pinnedUserId === id) setPinnedUserId(null); else setPinnedUserId(id); };
  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  useEffect(() => { getMedia().then(() => { if (bypassLobby || (username && username !== "Guest")) connectSocket(); else setAskForUsername(true); }); return () => { if(localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop()); if(socketRef.current) socketRef.current.disconnect(); if(audioContextRef.current) audioContextRef.current.close(); }; }, []);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; if (!showChat && messages.length > 0 && !messages[messages.length - 1].isMe) setUnreadMessages(prev => prev + 1); }, [messages]);
  useEffect(() => { if (showChat) setUnreadMessages(0); }, [showChat]);
  useEffect(() => { const checkMobile = () => setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768); checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile); }, []);
  const connect = () => { setAskForUsername(false); connectSocket(); };
  
  const handleMouseDown = (e) => {
    if (viewMode !== "SPOTLIGHT" || spotlightId !== "local") return;
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;
    const onMove = (e) => setPosition({ x: e.clientX - startX, y: e.clientY - startY });
    const onUp = () => { setIsDragging(false); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const getMainSocketId = () => {
      if (pinnedUserId) return pinnedUserId;
      if (activeSpeakerId && activeSpeakerId !== socketIdRef.current && videos.some(v => v.socketId === activeSpeakerId)) return activeSpeakerId;
      if (videos.length > 0) return videos[0].socketId;
      return "local";
  };

  /* ------------------ RENDER HELPERS ------------------ */
  const renderMainSpotlight = () => {
      const mainId = getMainSocketId();
      const isLocal = mainId === "local" || mainId === socketIdRef.current;
      let user, stream, isCamOff, displayName, isThisHost;

      if(isLocal) { 
          user = { username: userName, isHandRaised: isHandRaised, isVideoOff: !video }; 
          stream = localStream; // Use State
          isCamOff = !video; 
          displayName = `${userName} (You)`; 
          isThisHost = amIHost; 
      } else { 
          user = userMap[mainId] || { username: "Guest" }; 
          const v = videos.find(v => v.socketId === mainId); 
          stream = v?.stream; 
          isCamOff = user.isVideoOff; 
          displayName = user.username;
          isThisHost = mainId === roomHostId;
      }

      return (
          <div className="relative w-full h-full flex items-center justify-center bg-black/90">
              {isCamOff ? (
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-7xl font-bold text-white shadow-2xl">
                      {displayName.charAt(0).toUpperCase()}
                  </div>
              ) : (
                  <VideoPlayer stream={stream} isLocal={isLocal} isMirrored={isLocal && !screen} className="max-w-full max-h-full object-contain shadow-2xl" audioOutputId={selectedDevices.audioOutput} />
              )}
              <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                  <span className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
                      {displayName}
                      {isThisHost && <Crown size={16} className="text-yellow-400 fill-yellow-400" />}
                  </span>
                  {user.isHandRaised && <Hand size={20} className="text-yellow-500 animate-pulse" />}
                  {pinnedUserId === mainId && <Pin size={16} className="text-blue-400 rotate-45" />}
              </div>
              {activeEmojis[mainId] && <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in fade-in duration-300"><span className="text-[12rem] filter drop-shadow-2xl">{activeEmojis[mainId]}</span></div>}
          </div>
      );
  };

  const renderSideStrip = () => {
      const mainId = getMainSocketId();
      const allParticipants = [{ socketId: "local", stream: localStream, isLocal: true }, ...videos.map(v => ({ ...v, isLocal: false }))];
      const stripParticipants = allParticipants.filter(p => { const pId = p.isLocal ? (socketIdRef.current || "local") : p.socketId; const mId = mainId === "local" ? (socketIdRef.current || "local") : mainId; return pId !== mId; });

      return stripParticipants.map(p => {
          const pId = p.isLocal ? (socketIdRef.current || "local") : p.socketId;
          const user = p.isLocal ? { username: userName, isHandRaised: isHandRaised, isVideoOff: !video } : (userMap[pId] || { username: "Guest" });
          const isCamOff = user.isVideoOff;
          const displayName = p.isLocal ? `${userName} (You)` : user.username;
          const isThisHost = p.isLocal ? amIHost : pId === roomHostId;

          return (
              <div key={pId} onClick={() => handleTileClick(pId)} className={`relative flex-shrink-0 bg-neutral-800 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${isMobile ? 'w-28 h-20' : 'w-full h-32'} ${activeSpeakerId === pId && !p.isLocal ? 'border-green-500' : 'border-transparent hover:border-neutral-500'}`}>
                  {isCamOff ? <div className="w-full h-full flex items-center justify-center bg-neutral-700"><span className="text-xl font-bold text-gray-300">{displayName.charAt(0).toUpperCase()}</span></div> : <VideoPlayer stream={p.stream} isLocal={p.isLocal} isMirrored={p.isLocal && !screen} className="w-full h-full object-cover" audioOutputId={selectedDevices.audioOutput} />}
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 rounded text-[10px] truncate max-w-[90%] flex items-center gap-1">
                      {displayName}
                      {isThisHost && <Crown size={10} className="text-yellow-400 fill-yellow-400" />}
                  </div>
                  {user.isHandRaised && <div className="absolute top-1 right-1 text-yellow-500"><Hand size={14} /></div>}
              </div>
          );
      });
  };

  const renderPaginatedGrid = () => {
      const allParticipants = [{ socketId: "local", stream: localStream, isLocal: true }, ...videos.map(v => ({ ...v, isLocal: false }))];
      const totalPages = Math.ceil(allParticipants.length / GRID_PAGE_SIZE);
      const startIndex = gridPage * GRID_PAGE_SIZE;
      const visibleParticipants = allParticipants.slice(startIndex, startIndex + GRID_PAGE_SIZE);
      const count = visibleParticipants.length;
      let gridClass = "grid-cols-1"; 
      if (count === 2) gridClass = "grid-cols-1 md:grid-cols-2";
      else if (count >= 3) gridClass = "grid-cols-2";

      return (
          <div className="relative w-full h-full bg-black p-4 flex flex-col items-center justify-center">
              <div className={`grid ${gridClass} gap-4 w-full h-full max-w-6xl max-h-full transition-all duration-300`}>
                  {visibleParticipants.map(p => {
                      const pId = p.isLocal ? (socketIdRef.current || "local") : p.socketId;
                      const user = p.isLocal ? { username: userName, isHandRaised: isHandRaised, isVideoOff: !video } : (userMap[pId] || { username: "Guest" });
                      const displayName = p.isLocal ? `${userName} (You)` : user.username;
                      const isThisHost = p.isLocal ? amIHost : pId === roomHostId;
                      const isCamOff = user.isVideoOff;

                      return (
                          <div key={pId} className={`relative bg-neutral-800 rounded-xl overflow-hidden border-2 w-full h-full ${activeSpeakerId === pId && !p.isLocal ? 'border-green-500' : 'border-neutral-700'}`}>
                              {isCamOff ? (
                                  <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                                      <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                                          {displayName.charAt(0).toUpperCase()}
                                      </div>
                                  </div>
                              ) : (
                                  <VideoPlayer stream={p.stream} isLocal={p.isLocal} isMirrored={p.isLocal && !screen} className="w-full h-full object-cover" audioOutputId={selectedDevices.audioOutput} />
                              )}
                              
                              <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1.5 rounded-lg text-sm font-medium text-white flex items-center gap-2">
                                  {displayName}
                                  {isThisHost && <Crown size={14} className="text-yellow-400 fill-yellow-400" />}
                              </div>
                              {user.isHandRaised && <div className="absolute top-3 right-3 bg-yellow-500 p-2 rounded-full text-black shadow-lg animate-bounce"><Hand size={20} /></div>}
                              {activeEmojis[pId] && <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in fade-in duration-300"><span className="text-8xl filter drop-shadow-lg">{activeEmojis[pId]}</span></div>}
                          </div>
                      );
                  })}
              </div>
              {totalPages > 1 && (
                  <>
                      {gridPage > 0 && <button onClick={() => setGridPage(p => p - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full hover:bg-black/80 text-white transition-all z-20"><ChevronLeft size={32} /></button>}
                      {gridPage < totalPages - 1 && <button onClick={() => setGridPage(p => p + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full hover:bg-black/80 text-white transition-all z-20"><ChevronRight size={32} /></button>}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-xs font-medium text-gray-300">Page {gridPage + 1} / {totalPages}</div>
                  </>
              )}
          </div>
      );
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      
      {showSettings && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-neutral-800 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-neutral-700">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20} /> Audio & Video Settings</h2>
                      <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                      <div><label className="block text-sm text-gray-400 mb-1">Microphone</label><select className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2.5 text-sm outline-none" value={selectedDevices.audioInput} onChange={(e) => handleDeviceChange('audioInput', e.target.value)}>{devices.audioInputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId}`}</option>)}</select></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Camera</label><select className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2.5 text-sm outline-none" value={selectedDevices.videoInput} onChange={(e) => handleDeviceChange('videoInput', e.target.value)}>{devices.videoInputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Cam ${d.deviceId}`}</option>)}</select></div>
                      <div><label className="block text-sm text-gray-400 mb-1">Speaker</label><select className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2.5 text-sm outline-none" value={selectedDevices.audioOutput} onChange={(e) => handleDeviceChange('audioOutput', e.target.value)} disabled={!devices.audioOutputs.length}>{devices.audioOutputs.length > 0 ? devices.audioOutputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId}`}</option>) : <option>Default</option>}</select></div>
                      <div className="pt-4 border-t border-neutral-700"><button onClick={toggleAudioConnection} className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${isAudioConnected ? 'bg-red-500/20 text-red-500' : 'bg-green-600 text-white'}`}>{isAudioConnected ? <><Power size={18} /> Leave Audio</> : <><Volume2 size={18} /> Join Audio</>}</button></div>
                  </div>
              </div>
          </div>
      )}

      {showPasscodeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-neutral-700 text-center"><div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><Lock size={32} /></div><h2 className="text-2xl font-bold mb-2">Passcode Required</h2><form onSubmit={handleSubmitPasscode}><input type="password" autoFocus className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-white mb-4" placeholder="Enter Passcode" value={passcodeInput} onChange={e => setPasscodeInput(e.target.value)} />{passcodeError && <p className="text-red-500 text-xs mb-3 text-left">Incorrect.</p>}<button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold">Submit</button></form></div>
        </div>
      )}

      {askForUsername && !showPasscodeModal && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Join Meeting</h2>
            <input className="bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg block w-full p-2.5 mb-6" placeholder="Enter name" value={userName} onChange={(e) => setUsername(e.target.value)} />
            <div className="relative mb-6 rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                {localStream ? <VideoPlayer stream={localStream} isLocal={true} isMirrored={true} className="w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><Loader2 size={32} className="animate-spin mb-2"/> Loading Camera...</div>}
            </div>
            <button onClick={connect} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-3">Join</button>
          </div>
        </div>
      )}

      {isInWaitingRoom && !askForUsername && !showPasscodeModal && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900"><div className="bg-neutral-800 p-10 rounded-2xl shadow-2xl border border-neutral-700 max-w-lg w-full text-center"><ShieldAlert size={40} className="text-yellow-500 mx-auto mb-6" /><h2 className="text-2xl font-bold mb-2">Waiting for Host</h2><div className="flex justify-center gap-2 mt-4"><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span></div></div></div>
      )}

      {!askForUsername && !isInWaitingRoom && !showPasscodeModal && (
        <div className="flex flex-col h-screen relative">
          
          <div className="flex-1 flex flex-col md:flex-row bg-black overflow-hidden relative">
            {viewMode === "GRID" ? renderPaginatedGrid() : (
                <>
                    <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden order-1 md:order-1">{renderMainSpotlight()}</div>
                    <div className={`flex bg-neutral-900 border-neutral-800 md:flex-col md:w-64 md:border-l md:overflow-y-auto md:order-2 md:p-3 md:gap-3 flex-row w-full overflow-x-auto p-2 gap-2 h-24 border-t order-2 md:h-auto`}>{renderSideStrip()}</div>
                </>
            )}
          </div>

          {/* DESKTOP FOOTER */}
          <div className="hidden md:flex h-20 bg-neutral-900 border-t border-neutral-800 items-center justify-center z-20 px-4 gap-4 relative">
             <button onClick={() => setShowSettings(true)} className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 absolute left-4"><Settings size={24} /></button>
             <button onClick={handleAudio} className={`p-4 rounded-full transition-all ${audio ? 'bg-neutral-700' : 'bg-red-500'}`}>{audio ? <Mic size={24} /> : <MicOff size={24} />}</button>
             <button onClick={handleVideo} className={`p-4 rounded-full transition-all ${video ? 'bg-neutral-700' : 'bg-red-500'}`}>{video ? <Video size={24} /> : <VideoOff size={24} />}</button>
             <button onClick={handleToggleHand} className={`p-4 rounded-full transition-all ${isHandRaised ? 'bg-yellow-500 text-black' : 'bg-neutral-700 text-white'}`}><Hand size={24} /></button>
             <div className="relative"><button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600"><Smile size={24} /></button>{showEmojiPicker && ( <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 p-2 rounded-full flex gap-2 shadow-xl animate-in slide-in-from-bottom-5">{EMOJI_LIST.map(emoji => (<button key={emoji} onClick={() => handleSendEmoji(emoji)} className="text-2xl hover:scale-125 transition-transform p-1">{emoji}</button>))}</div> )}</div>
             <button onClick={handleScreen} className={`p-4 rounded-full ${screen ? 'bg-blue-600' : 'bg-neutral-700'}`}>{screen ? <MonitorOff size={24} /> : <ScreenShare size={24} />}</button>
             <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 text-white"><PhoneOff size={24} /></button>
             <div className="absolute right-6 gap-3 flex">
               <button onClick={() => setShowInfo(!showInfo)} className="p-3 rounded-xl bg-neutral-800"><Info size={24} /></button>
               <button onClick={() => setShowParticipants(!showParticipants)} className="p-3 rounded-xl bg-neutral-800 relative"><Users size={24} />{amIHost && waitingUsers && waitingUsers.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{waitingUsers.length}</span>}</button>
               <button onClick={() => setShowChat(!showChat)} className="p-3 rounded-xl bg-neutral-800 relative"><MessageSquare size={24} />{unreadMessages > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadMessages}</span>}</button>
             </div>
          </div>

          {/* MOBILE SLIDER (FOOTER) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-neutral-900 border-t border-neutral-800 flex items-center overflow-x-auto px-4 gap-4 no-scrollbar z-50">
             <button onClick={handleAudio} className={`flex-shrink-0 p-4 rounded-full ${audio ? 'bg-neutral-700' : 'bg-red-500'}`}>{audio ? <Mic size={24} /> : <MicOff size={24} />}</button>
             <button onClick={handleVideo} className={`flex-shrink-0 p-4 rounded-full ${video ? 'bg-neutral-700' : 'bg-red-500'}`}>{video ? <Video size={24} /> : <VideoOff size={24} />}</button>
             <button onClick={handleToggleHand} className={`flex-shrink-0 p-4 rounded-full ${isHandRaised ? 'bg-yellow-500 text-black' : 'bg-neutral-700'}`}><Hand size={24} /></button>
             <button onClick={() => setShowChat(!showChat)} className="flex-shrink-0 p-4 rounded-full bg-neutral-700 relative"><MessageSquare size={24} />{unreadMessages > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full"></span>}</button>
             <button onClick={() => setShowParticipants(!showParticipants)} className="flex-shrink-0 p-4 rounded-full bg-neutral-700 relative"><Users size={24} />{amIHost && waitingUsers.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full"></span>}</button>
             
             {/* Host Controls Inline for Mobile */}
             {amIHost && (
                 <>
                    <button onClick={handleMuteAll} className="flex-shrink-0 p-4 rounded-full bg-red-500/20 text-red-500"><MicOff size={24} /></button>
                    <button onClick={handleStopVideoAll} className="flex-shrink-0 p-4 rounded-full bg-red-500/20 text-red-500"><VideoOff size={24} /></button>
                    <button onClick={handleToggleLock} className={`flex-shrink-0 p-4 rounded-full ${isMeetingLocked ? 'bg-red-500' : 'bg-neutral-700'}`}>{isMeetingLocked ? <Lock size={24} /> : <Unlock size={24} />}</button>
                 </>
             )}

             <button onClick={() => setShowMobileMenu(true)} className="flex-shrink-0 p-4 rounded-full bg-neutral-700"><MoreHorizontal size={24} /></button>
             <button onClick={handleEndCall} className="flex-shrink-0 p-4 rounded-full bg-red-600 ml-auto"><PhoneOff size={24} /></button>
          </div>
             
          {showMobileMenu && (
             <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowMobileMenu(false)}>
                 <div className="bg-neutral-900 w-full rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-lg">More Options</h3><button onClick={() => setShowMobileMenu(false)}><X size={24} /></button></div>
                    <button onClick={() => { handleScreen(); setShowMobileMenu(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800"><ScreenShare size={24} /> Share Screen</button>
                    <button onClick={() => { setViewMode(viewMode === "GRID" ? "SPEAKER" : "GRID"); setShowMobileMenu(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800"><LayoutDashboard size={24} /> Change Layout</button>
                    <button onClick={() => { setShowSettings(true); setShowMobileMenu(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800"><Settings size={24} /> Settings</button>
                    <button onClick={() => { setShowInfo(true); setShowMobileMenu(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800"><Info size={24} /> Meeting Info</button>
                    
                    {/* Emoji Bar Mobile */}
                    <div className="flex justify-between bg-neutral-800 p-4 rounded-xl">
                        {EMOJI_LIST.map(emoji => (
                            <button key={emoji} onClick={() => { handleSendEmoji(emoji); setShowMobileMenu(false); }} className="text-3xl hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                    </div>
                 </div>
             </div>
          )}

          {showParticipants && (
            <div className="absolute right-0 top-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col slide-in-right">
                <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900">
                    <h3 className="font-bold">Participants</h3>{amIHost && Object.keys(userMap).length > 0 && (<div className="flex gap-2"><button onClick={handleMuteAll} className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded hover:bg-red-500/30">Mute All</button><button onClick={handleStopVideoAll} className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded hover:bg-red-500/30">Stop Video</button></div>)}<button onClick={() => setShowParticipants(false)}><X size={20} /></button></div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {amIHost && waitingUsers && waitingUsers.length > 0 && (<div className="pb-4 border-b border-neutral-700"><h4 className="text-xs font-bold text-yellow-500 uppercase mb-3">Waiting</h4>{waitingUsers.map(u => (<div key={u.socketId} className="flex justify-between items-center bg-neutral-700/50 p-2 rounded mb-2"><span className="text-sm">{u.username || "Guest"}</span><button onClick={() => handleAdmit(u.socketId)} className="p-1 bg-green-600 rounded text-xs"><UserCheck size={14}/></button></div>))}</div>)}
                    <div className="flex justify-between items-center bg-neutral-700/50 p-2 rounded"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">{(userName || "G").charAt(0)}</div><span className="text-sm">{userName} (You) {amIHost && <Crown size={12} className="text-yellow-400 fill-yellow-400 inline ml-1" />}</span></div></div>
                    {userMap && Object.values(userMap).map(u => {
                        const isUserHost = u.socketId === roomHostId;
                        return (
                            <div key={u.socketId} className="flex justify-between items-center bg-neutral-700/50 p-2 rounded group">
                                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">{(u.username || "G").charAt(0)}</div><span className="text-sm">{u.username || "Guest"} {isUserHost && <Crown size={12} className="text-yellow-400 fill-yellow-400 inline ml-1" />}</span></div>
                                <div className="flex items-center gap-2">
                                    <div className={u.isVideoOff ? "text-red-500" : "text-gray-400"}>{u.isVideoOff ? <VideoOff size={14} /> : <Video size={14} />}</div>
                                    <div className={u.isMuted ? "text-red-500" : "text-gray-400"}>{u.isMuted ? <MicOff size={14} /> : <Mic size={14} />}</div>
                                    
                                    {amIHost && (
                                        <>
                                            <button onClick={() => handleTransferHost(u.socketId)} className="text-gray-500 hover:text-blue-500 transition-colors" title="Make Host"><UserCog size={14} /></button>
                                            <button onClick={() => handleKickUser(u.socketId)} className="text-gray-500 hover:text-red-500 transition-colors" title="Remove"><Trash2 size={14} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}
          
          {showChat && (
            <div className="absolute right-0 top-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col slide-in-right">
               <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900"><h3 className="font-bold">Chat</h3><button onClick={() => setShowChat(false)}><X size={20} /></button></div>
               <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((msg, i) => (<div key={i} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}><div className="text-xs text-gray-400 mb-1">{msg.sender}</div><div className={`px-4 py-2 rounded-lg text-sm ${msg.isMe ? "bg-blue-600" : "bg-neutral-700"}`}>{msg.text}</div></div>))}</div>
               <div className="p-4 bg-neutral-900 border-t border-neutral-700"><form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2"><input className="flex-1 bg-neutral-700 rounded-lg p-2 text-sm" value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} placeholder="Type..." /><button type="submit" className="p-2 bg-blue-600 rounded-lg"><Send size={18} /></button></form></div>
            </div>
          )}
          
          {showInfo && (<div className="absolute bottom-20 right-4 w-72 bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl z-30 p-4"><div className="flex justify-between items-center mb-4"><h3 className="font-bold">Info</h3><button onClick={() => setShowInfo(false)}><X size={18} /></button></div><div className="space-y-4"><div><label className="text-xs text-gray-400">Code</label><div className="flex items-center gap-2 font-mono font-bold text-lg">{meetingCode} <button onClick={handleCopyLink} className="text-blue-400"><Copy size={16}/></button></div></div>{amIHost && (<div className="pt-2 border-t border-neutral-700"><button onClick={handleToggleLock} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ${isMeetingLocked ? 'bg-red-500/20 text-red-500' : 'bg-neutral-700 text-white'}`}>{isMeetingLocked ? <Lock size={16} /> : <Unlock size={16} />} {isMeetingLocked ? "Unlock Meeting" : "Lock Meeting"}</button></div>)}<button onClick={handleCopyLink} className="w-full bg-blue-600 py-2 rounded-lg text-sm font-medium">Copy Invite Link</button></div></div>)}
        </div>
      )}
    </div>
  );
}