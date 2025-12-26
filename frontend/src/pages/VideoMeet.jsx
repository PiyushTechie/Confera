import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, MonitorOff,
  MessageSquare, PhoneOff, Info, X, Send, Copy, Check,
  Users, LayoutDashboard, ShieldAlert, UserMinus, UserCheck, Gavel, MoreVertical,
  Lock, Hand, Smile, Unlock, Trash2, Pin, PinOff
} from "lucide-react";
import server from "../environment";

const server_url = server;

const peerConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const VideoPlayer = ({ stream, isLocal, isMirrored, className }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
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
  const displayStreamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalysersRef = useRef({});

  const [askForUsername, setAskForUsername] = useState(false);
  const [userName, setUsername] = useState(username || "");
  const [video, setVideo] = useState(isVideoOn ?? true);
  const [audio, setAudio] = useState(isAudioOn ?? true);
  const [screen, setScreen] = useState(false);

  const [videos, setVideos] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);

  const pendingIce = useRef({});

  // Layout State
  const [viewMode, setViewMode] = useState("SPEAKER"); // Default to Speaker View
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [pinnedUserId, setPinnedUserId] = useState(null); // Manual Override

  const [showInfo, setShowInfo] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);

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

  /* --------------------- MEDIA --------------------- */
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getVideoTracks()[0].enabled = video;
      stream.getAudioTracks()[0].enabled = audio;
      localStreamRef.current = stream;
      
      // Init Audio Context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (err) {
      console.error("Media error:", err);
    }
  };

  /* ------------------ ACTIVE SPEAKER LOGIC ------------------ */
  useEffect(() => {
    if (!audioContextRef.current) return;

    videos.forEach((v) => {
      if (!audioAnalysersRef.current[v.socketId] && v.stream.getAudioTracks().length > 0) {
        try {
            const source = audioContextRef.current.createMediaStreamSource(v.stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            audioAnalysersRef.current[v.socketId] = analyser;
        } catch (e) {
            console.error("Audio Context Error:", e);
        }
      }
    });
  }, [videos]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (!audioContextRef.current) return;

        let maxVolume = 0;
        let loudestSpeaker = null;

        Object.entries(audioAnalysersRef.current).forEach(([socketId, analyser]) => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const volume = sum / dataArray.length;

            if (volume > 20 && volume > maxVolume) {
                maxVolume = volume;
                loudestSpeaker = socketId;
            }
        });

        if (loudestSpeaker && loudestSpeaker !== activeSpeakerId) {
            setActiveSpeakerId(loudestSpeaker);
        }
    }, 500);

    return () => clearInterval(interval);
  }, [activeSpeakerId]);

  /* ------------------ HELPERS ------------------ */
  const cleanupAndLeave = () => {
    if(localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if(displayStreamRef.current) displayStreamRef.current.getTracks().forEach(t => t.stop());
    if(audioContextRef.current) audioContextRef.current.close();
    Object.values(connectionsRef.current).forEach(pc => pc.close());
    if(socketRef.current) socketRef.current.disconnect();
    navigate("/");
  };

  // Determine who to show in the big window
  const getMainSocketId = () => {
      // 1. If user manually pinned someone, show them
      if (pinnedUserId) return pinnedUserId;
      // 2. If someone is speaking (and not local user), show them
      if (activeSpeakerId && activeSpeakerId !== socketIdRef.current) return activeSpeakerId;
      // 3. Otherwise show the first remote user
      if (videos.length > 0) return videos[0].socketId;
      // 4. If alone, show local
      return "local";
  };

  /* ------------------ PEER CONNECTION ------------------ */
  const createPeer = (targetId) => {
    const pc = new RTCPeerConnection(peerConfig);
    pc.targetId = targetId;
    connectionsRef.current[targetId] = pc;

    const videoTrack = screen && displayStreamRef.current
      ? displayStreamRef.current.getVideoTracks()[0]
      : localStreamRef.current?.getVideoTracks()[0];
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];

    if (videoTrack) pc.addTrack(videoTrack, localStreamRef.current);
    if (audioTrack) pc.addTrack(audioTrack, localStreamRef.current);

    pc.onicecandidate = e => {
      if (e.candidate) socketRef.current.emit("signal", targetId, JSON.stringify({ ice: e.candidate }));
    };

    pc.ontrack = e => {
      const stream = e.streams[0];
      setVideos(prev => {
        if (prev.some(v => v.socketId === pc.targetId)) return prev;
        return [...prev, { socketId: pc.targetId, stream }];
      });
    };

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

  /* ------------------ SOCKET ------------------ */
  const connectSocket = () => {
    if (socketRef.current && socketRef.current.connected) return;

    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      const payload = { 
        path: window.location.href, 
        username: userName,
        passcode: passcodeInput || passcode 
      };

      if (isHost) socketRef.current.emit("join-call", payload);
      else { socketRef.current.emit("request-join", payload); setIsInWaitingRoom(true); }
    });

    socketRef.current.on("passcode-required", () => {
        setIsInWaitingRoom(false);
        setShowPasscodeModal(true);
        setPasscodeError(true);
        socketRef.current.disconnect();
    });

    socketRef.current.on("invalid-meeting", () => {
        alert("Meeting not found!");
        cleanupAndLeave();
    });

    socketRef.current.on("meeting-ended", () => {
        if (!isHost) {
            alert("The host has ended the meeting.");
            cleanupAndLeave();
        }
    });

    socketRef.current.on("force-mute", () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = false;
            setAudio(false);
            socketRef.current.emit("toggle-audio", { isMuted: true });
        }
        alert("The host has muted everyone.");
    });

    socketRef.current.on("force-stop-video", () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = false;
            setVideo(false);
            socketRef.current.emit("toggle-video", { isVideoOff: true });
        }
        alert("The host has stopped everyone's video.");
    });

    socketRef.current.on("meeting-locked", () => {
        alert("The meeting is locked.");
        cleanupAndLeave();
    });

    socketRef.current.on("kicked", () => {
        alert("You have been removed.");
        cleanupAndLeave();
    });

    socketRef.current.on("lock-update", (isLocked) => setIsMeetingLocked(isLocked));

    socketRef.current.on("admitted", () => {
      setIsInWaitingRoom(false);
      socketRef.current.emit("join-call", { 
          path: window.location.href, 
          username: userName,
          passcode: passcodeInput || passcode 
      });
    });

    socketRef.current.on("update-waiting-list", (users) => { if (isHost) setWaitingUsers(users); });

    socketRef.current.on("all-users", (users) => {
      users.forEach(u => setUserMap(prev => ({ ...prev, [u.socketId]: u })));
    });

    socketRef.current.on("user-joined", (user) => {
      setUserMap(prev => ({ ...prev, [user.socketId]: user }));
      createPeer(user.socketId); 
      initiateOffer(user.socketId);
    });

    socketRef.current.on("hand-toggled", ({ socketId, isRaised }) => {
        if (socketId === socketRef.current.id) setIsHandRaised(isRaised);
        setUserMap(prev => ({
            ...prev,
            [socketId]: { ...prev[socketId], isHandRaised: isRaised }
        }));
    });

    socketRef.current.on("audio-toggled", ({ socketId, isMuted }) => {
        setUserMap(prev => ({
            ...prev,
            [socketId]: { ...prev[socketId], isMuted: isMuted }
        }));
    });

    socketRef.current.on("video-toggled", ({ socketId, isVideoOff }) => {
        setUserMap(prev => ({
            ...prev,
            [socketId]: { ...prev[socketId], isVideoOff: isVideoOff }
        }));
    });

    socketRef.current.on("emoji-received", ({ socketId, emoji }) => {
        setActiveEmojis(prev => ({ ...prev, [socketId]: emoji }));
        setTimeout(() => {
            setActiveEmojis(prev => {
                const newState = { ...prev };
                delete newState[socketId];
                return newState;
            });
        }, 3000);
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
        if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
        else { pendingIce.current[fromId] = pendingIce.current[fromId] || []; pendingIce.current[fromId].push(signal.ice); }
      }
    });

    socketRef.current.on("user-left", (id) => {
      connectionsRef.current[id]?.close();
      delete connectionsRef.current[id];
      setVideos(v => v.filter(x => x.socketId !== id));
      setUserMap(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
    });

    socketRef.current.on("receive-message", (data) => {
      const isMe = data.socketId === socketRef.current.id;
      setMessages(prev => [...prev, { ...data, isMe }]);
    });
  };

  /* ------------------ ACTIONS ------------------ */
  const handleToggleHand = () => {
      const newState = !isHandRaised;
      setIsHandRaised(newState);
      socketRef.current.emit("toggle-hand", { isRaised: newState });
      if(isMobile) setShowMobileMenu(false);
  };

  const handleSendEmoji = (emoji) => {
      setShowEmojiPicker(false);
      if(isMobile) setShowMobileMenu(false);
      setActiveEmojis(prev => ({ ...prev, [socketIdRef.current]: emoji }));
      setTimeout(() => {
          setActiveEmojis(prev => {
              const newState = { ...prev };
              delete newState[socketIdRef.current];
              return newState;
          });
      }, 3000);
      socketRef.current.emit("send-emoji", { emoji });
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !socketRef.current) return;
    const msg = { text: currentMessage, sender: userName, socketId: socketRef.current.id, timestamp: new Date().toISOString() };
    socketRef.current.emit("send-message", msg);
    setMessages(prev => [...prev, { ...msg, isMe: true }]);
    setCurrentMessage("");
  };

  const handleSubmitPasscode = (e) => {
      e.preventDefault();
      if(passcodeInput.trim()) {
         setShowPasscodeModal(false);
         setPasscodeError(false);
         connectSocket(); 
      }
  };

  const handleToggleLock = () => {
      socketRef.current.emit("toggle-lock");
      if(isMobile) setShowMobileMenu(false);
  };

  const handleKickUser = (targetId) => {
      if(window.confirm("Remove this participant?")) socketRef.current.emit("kick-user", targetId);
  };

  const handleMuteAll = () => {
      if(window.confirm("Mute everyone?")) socketRef.current.emit("mute-all");
  };

  const handleStopVideoAll = () => {
      if(window.confirm("Stop everyone's video?")) socketRef.current.emit("stop-video-all");
  };

  const handleEndCall = () => {
    if (isHost) {
        if(window.confirm("Do you want to end the meeting for everyone?")) {
            socketRef.current.emit("end-meeting-for-all");
            cleanupAndLeave();
        }
    } else {
        cleanupAndLeave();
    }
  };

  const handleScreen = async () => {
    if (isMobile) { alert("Not supported on mobile."); return; }
    if (!screen) {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
        displayStreamRef.current = display;
        const track = display.getVideoTracks()[0];
        replaceVideoTrack(track);
        track.onended = () => handleScreen();
        setScreen(true);
      } catch (err) { console.log("Cancelled"); }
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
        socketRef.current.emit("toggle-video", { isVideoOff: video }); 
    }
  };

  const handleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { 
        track.enabled = !audio; 
        setAudio(!audio);
        socketRef.current.emit("toggle-audio", { isMuted: audio }); 
    }
  };

  const handleAdmit = (socketId) => socketRef.current.emit("admit-user", socketId);
  
  // Pinning Logic
  const handleTileClick = (id) => { 
      // If clicking already pinned user, unpin
      if (pinnedUserId === id) {
          setPinnedUserId(null);
      } else {
          setPinnedUserId(id);
      }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    getMedia().then(() => {
      if (bypassLobby || (username && username !== "Guest")) connectSocket();
      else setAskForUsername(true);
    });
    return () => {
        if(localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if(socketRef.current) socketRef.current.disconnect();
        if(audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    if (!showChat && messages.length > 0 && !messages[messages.length - 1].isMe) setUnreadMessages(prev => prev + 1);
  }, [messages]);

  useEffect(() => { if (showChat) setUnreadMessages(0); }, [showChat]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent));
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const connect = () => { setAskForUsername(false); connectSocket(); };

  // --- RENDER HELPERS ---

  // Helper to render Main Window
  const renderMainSpotlight = () => {
      const mainId = getMainSocketId();
      const isLocal = mainId === "local" || mainId === socketIdRef.current;
      
      let user, stream, isCamOff;

      if(isLocal) {
          user = { username: userName, isHandRaised: isHandRaised, isVideoOff: !video };
          stream = localStreamRef.current;
          isCamOff = !video;
      } else {
          user = userMap[mainId] || { username: "Guest" };
          const v = videos.find(v => v.socketId === mainId);
          stream = v?.stream;
          isCamOff = user.isVideoOff;
      }

      return (
          <div className="relative w-full h-full flex items-center justify-center bg-black/90">
              {isCamOff ? (
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-7xl font-bold text-white shadow-2xl">
                      {user.username.charAt(0).toUpperCase()}
                  </div>
              ) : (
                  <VideoPlayer 
                    stream={stream} 
                    isLocal={isLocal} 
                    isMirrored={isLocal && !screen} 
                    className="max-w-full max-h-full object-contain shadow-2xl" 
                  />
              )}

              {/* Overlays */}
              <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                  <span className="font-bold text-white tracking-wide text-lg">{isLocal ? "You" : user.username}</span>
                  {user.isHandRaised && <Hand size={20} className="text-yellow-500 animate-pulse" />}
                  {pinnedUserId === mainId && <Pin size={16} className="text-blue-400 rotate-45" />}
              </div>

              {activeEmojis[mainId] && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in fade-in duration-300">
                      <span className="text-[12rem] filter drop-shadow-2xl">{activeEmojis[mainId]}</span>
                  </div>
              )}
          </div>
      );
  };

  // Helper to render Side Strip
  const renderSideStrip = () => {
      const mainId = getMainSocketId();
      // List of everyone: Local + Remote
      const allParticipants = [
          { socketId: "local", stream: localStreamRef.current, isLocal: true },
          ...videos.map(v => ({ ...v, isLocal: false }))
      ];

      // Filter out whoever is currently in the main window to avoid duplication
      const stripParticipants = allParticipants.filter(p => {
          const pId = p.isLocal ? (socketIdRef.current || "local") : p.socketId;
          const mId = mainId === "local" ? (socketIdRef.current || "local") : mainId;
          return pId !== mId;
      });

      return stripParticipants.map(p => {
          const pId = p.isLocal ? (socketIdRef.current || "local") : p.socketId;
          const user = p.isLocal ? { username: userName, isHandRaised: isHandRaised, isVideoOff: !video } : (userMap[pId] || { username: "Guest" });
          const isCamOff = user.isVideoOff;
          
          return (
              <div 
                key={pId}
                onClick={() => handleTileClick(pId)}
                className={`relative flex-shrink-0 bg-neutral-800 rounded-xl overflow-hidden cursor-pointer transition-all border-2
                    ${isMobile ? 'w-28 h-20' : 'w-full h-32'}
                    ${activeSpeakerId === pId && !p.isLocal ? 'border-green-500' : 'border-transparent hover:border-neutral-500'}
                `}
              >
                  {isCamOff ? (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                          <span className="text-xl font-bold text-gray-300">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                  ) : (
                      <VideoPlayer stream={p.stream} isLocal={p.isLocal} isMirrored={p.isLocal && !screen} className="w-full h-full object-cover" />
                  )}
                  
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 rounded text-[10px] truncate max-w-[90%]">
                      {p.isLocal ? "You" : user.username}
                  </div>
                  {user.isHandRaised && <div className="absolute top-1 right-1 text-yellow-500"><Hand size={14} /></div>}
              </div>
          );
      });
  };

  /* ------------------ MAIN RENDER ------------------ */
  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      
      {/* --- MODALS --- */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-neutral-700 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><Lock size={32} /></div>
                <h2 className="text-2xl font-bold mb-2">Passcode Required</h2>
                <form onSubmit={handleSubmitPasscode}>
                    <input type="password" autoFocus className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-white mb-4" placeholder="Enter Passcode" value={passcodeInput} onChange={e => setPasscodeInput(e.target.value)} />
                    {passcodeError && <p className="text-red-500 text-xs mb-3 text-left">Incorrect passcode.</p>}
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold">Submit</button>
                </form>
            </div>
        </div>
      )}

      {askForUsername && !showPasscodeModal && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Join Meeting</h2>
            <input className="bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg block w-full p-2.5 mb-6" placeholder="Enter name" value={userName} onChange={(e) => setUsername(e.target.value)} />
            <div className="relative mb-6 rounded-lg overflow-hidden bg-black aspect-video"><VideoPlayer stream={localStreamRef.current} isLocal={true} isMirrored={true} className="w-full h-full object-cover" /></div>
            <button onClick={connect} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-3">Join</button>
          </div>
        </div>
      )}

      {isInWaitingRoom && !askForUsername && !showPasscodeModal && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
           <div className="bg-neutral-800 p-10 rounded-2xl shadow-2xl border border-neutral-700 max-w-lg w-full text-center">
             <ShieldAlert size={40} className="text-yellow-500 mx-auto mb-6" />
             <h2 className="text-2xl font-bold mb-2">Waiting for Host</h2>
             <div className="flex justify-center gap-2 mt-4"><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span></div>
           </div>
        </div>
      )}

      {!askForUsername && !isInWaitingRoom && !showPasscodeModal && (
        <div className="flex flex-col h-screen relative">
          
          {/* --- MAIN VIDEO AREA (Zoom Style) --- */}
          <div className="flex-1 flex flex-col md:flex-row bg-black overflow-hidden relative">
            
            {/* 1. Main Spotlight Area */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden order-1 md:order-1">
                {renderMainSpotlight()}
            </div>

            {/* 2. Side Strip (Participants) */}
            <div className={`
                flex 
                bg-neutral-900 border-neutral-800
                md:flex-col md:w-64 md:border-l md:overflow-y-auto md:order-2 md:p-3 md:gap-3
                flex-row w-full overflow-x-auto p-2 gap-2 h-24 border-t order-2 md:h-auto
            `}>
                {renderSideStrip()}
            </div>

          </div>

          {/* --- FOOTER CONTROLS --- */}
          <div className="h-16 md:h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center z-20 px-2 md:px-4 gap-2 md:gap-4 relative">
             <button onClick={handleAudio} className={`p-3 md:p-4 rounded-full transition-all ${audio ? 'bg-neutral-700' : 'bg-red-500'}`}>{audio ? <Mic size={20} className="md:w-6 md:h-6" /> : <MicOff size={20} className="md:w-6 md:h-6" />}</button>
             <button onClick={handleVideo} className={`p-3 md:p-4 rounded-full transition-all ${video ? 'bg-neutral-700' : 'bg-red-500'}`}>{video ? <Video size={20} className="md:w-6 md:h-6" /> : <VideoOff size={20} className="md:w-6 md:h-6" />}</button>
             <button onClick={handleToggleHand} className={`hidden md:block p-4 rounded-full transition-all ${isHandRaised ? 'bg-yellow-500 text-black' : 'bg-neutral-700 text-white'}`}><Hand size={24} /></button>
             <div className="hidden md:block relative">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600"><Smile size={24} /></button>
                {showEmojiPicker && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 p-2 rounded-full flex gap-2 shadow-xl animate-in slide-in-from-bottom-5">
                        {EMOJI_LIST.map(emoji => (<button key={emoji} onClick={() => handleSendEmoji(emoji)} className="text-2xl hover:scale-125 transition-transform p-1">{emoji}</button>))}
                    </div>
                )}
             </div>
             <button onClick={handleScreen} className={`hidden md:block p-3 md:p-4 rounded-full ${screen ? 'bg-blue-600' : 'bg-neutral-700'}`}>{screen ? <MonitorOff size={20} className="md:w-6 md:h-6" /> : <ScreenShare size={20} className="md:w-6 md:h-6" />}</button>
             <button onClick={handleEndCall} className="p-3 md:p-4 rounded-full bg-red-600 text-white"><PhoneOff size={20} className="md:w-6 md:h-6" /></button>
             <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-3 rounded-full bg-neutral-700 text-white relative"><MoreVertical size={20} /></button>
             
             <div className="hidden md:flex absolute right-6 gap-3">
               <button onClick={() => setShowInfo(!showInfo)} className="p-3 rounded-xl bg-neutral-800"><Info size={24} /></button>
               <button onClick={() => setShowParticipants(!showParticipants)} className="p-3 rounded-xl bg-neutral-800 relative"><Users size={24} />{isHost && waitingUsers && waitingUsers.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{waitingUsers.length}</span>}</button>
               <button onClick={() => setShowChat(!showChat)} className="p-3 rounded-xl bg-neutral-800 relative"><MessageSquare size={24} />{unreadMessages > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadMessages}</span>}</button>
             </div>
             
             {showMobileMenu && (
                 <div className="absolute bottom-24 right-4 w-64 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl p-2 flex flex-col gap-2 z-40 md:hidden">
                    <button onClick={handleToggleHand} className={`flex items-center gap-3 p-3 rounded-lg ${isHandRaised ? 'bg-yellow-500 text-black' : 'hover:bg-neutral-700 text-white'}`}><Hand size={20} /> <span>{isHandRaised ? "Lower Hand" : "Raise Hand"}</span></button>
                    <div className="p-2 bg-neutral-900 rounded-lg flex justify-between">{EMOJI_LIST.map(emoji => (<button key={emoji} onClick={() => handleSendEmoji(emoji)} className="text-xl p-1 hover:scale-125 transition-transform">{emoji}</button>))}</div>
                    <div className="h-px bg-neutral-700 my-1"></div>
                    {isHost && (
                        <>
                            <button onClick={handleMuteAll} className="flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-neutral-700"><MicOff size={20} /> Mute All</button>
                            <button onClick={handleStopVideoAll} className="flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-neutral-700"><VideoOff size={20} /> Stop Video</button>
                            <button onClick={handleToggleLock} className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-neutral-700">{isMeetingLocked ? <Lock size={20} /> : <Unlock size={20} />} {isMeetingLocked ? "Unlock" : "Lock"}</button>
                            <div className="h-px bg-neutral-700 my-1"></div>
                        </>
                    )}
                    <button onClick={() => { handleScreen(); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700 text-white"><ScreenShare size={20} /> Share Screen</button>
                    <button onClick={() => { setShowChat(!showChat); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700 relative text-white"><div className="relative"><MessageSquare size={20} />{unreadMessages > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadMessages}</span>}</div><span>Chat</span></button>
                    <button onClick={() => { setShowParticipants(!showParticipants); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700 relative text-white"><div className="relative"><Users size={20} />{isHost && waitingUsers && waitingUsers.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{waitingUsers.length}</span>}</div><span>Participants</span></button>
                    <button onClick={() => { setShowInfo(!showInfo); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700 text-white"><Info size={20} /> Info</button>
                 </div>
             )}
          </div>

          {showParticipants && (
            <div className="absolute right-0 top-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col slide-in-right">
                <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900">
                    <h3 className="font-bold">Participants</h3>
                    {isHost && Object.keys(userMap).length > 0 && (
                        <div className="flex gap-2">
                            <button onClick={handleMuteAll} className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded hover:bg-red-500/30">Mute All</button>
                            <button onClick={handleStopVideoAll} className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded hover:bg-red-500/30">Stop Video</button>
                        </div>
                    )}
                    <button onClick={() => setShowParticipants(false)}><X size={20} /></button>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {/* Waiting Room */}
                    {isHost && waitingUsers && waitingUsers.length > 0 && (
                        <div className="pb-4 border-b border-neutral-700">
                            <h4 className="text-xs font-bold text-yellow-500 uppercase mb-3">Waiting</h4>
                            {waitingUsers.map(u => (
                                <div key={u.socketId} className="flex justify-between items-center bg-neutral-700/50 p-2 rounded mb-2">
                                    <span className="text-sm">{u.username || "Guest"}</span>
                                    <button onClick={() => handleAdmit(u.socketId)} className="p-1 bg-green-600 rounded text-xs"><UserCheck size={14}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-neutral-700/50 p-2 rounded">
                        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">{(userName || "G").charAt(0)}</div><span className="text-sm">{userName} (You)</span></div>
                    </div>
                    {userMap && Object.values(userMap).map(u => (
                        <div key={u.socketId} className="flex justify-between items-center bg-neutral-700/50 p-2 rounded group">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">{(u.username || "G").charAt(0)}</div>
                                <span className="text-sm">{u.username || "Guest"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={u.isVideoOff ? "text-red-500" : "text-gray-400"}>{u.isVideoOff ? <VideoOff size={14} /> : <Video size={14} />}</div>
                                <div className={u.isMuted ? "text-red-500" : "text-gray-400"}>{u.isMuted ? <MicOff size={14} /> : <Mic size={14} />}</div>
                                {isHost && (
                                    <button onClick={() => handleKickUser(u.socketId)} className="text-gray-500 hover:text-red-500 transition-colors" title="Remove">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
          
          {showChat && (
            <div className="absolute right-0 top-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col slide-in-right">
               <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900"><h3 className="font-bold">Chat</h3><button onClick={() => setShowChat(false)}><X size={20} /></button></div>
               <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                          <div className="text-xs text-gray-400 mb-1">{msg.sender}</div>
                          <div className={`px-4 py-2 rounded-lg text-sm ${msg.isMe ? "bg-blue-600" : "bg-neutral-700"}`}>{msg.text}</div>
                      </div>
                  ))}
               </div>
               <div className="p-4 bg-neutral-900 border-t border-neutral-700">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                      <input className="flex-1 bg-neutral-700 rounded-lg p-2 text-sm" value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} placeholder="Type..." />
                      <button type="submit" className="p-2 bg-blue-600 rounded-lg"><Send size={18} /></button>
                  </form>
               </div>
            </div>
          )}
          
          {showInfo && (
              <div className="absolute bottom-20 right-4 w-72 bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl z-30 p-4">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Info</h3><button onClick={() => setShowInfo(false)}><X size={18} /></button></div>
                  <div className="space-y-4">
                      <div><label className="text-xs text-gray-400">Code</label><div className="flex items-center gap-2 font-mono font-bold text-lg">{meetingCode} <button onClick={handleCopyLink} className="text-blue-400"><Copy size={16}/></button></div></div>
                      {isHost && (
                          <div className="pt-2 border-t border-neutral-700">
                              <button onClick={handleToggleLock} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ${isMeetingLocked ? 'bg-red-500/20 text-red-500' : 'bg-neutral-700 text-white'}`}>
                                  {isMeetingLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                  {isMeetingLocked ? "Unlock Meeting" : "Lock Meeting"}
                              </button>
                          </div>
                      )}
                      <button onClick={handleCopyLink} className="w-full bg-blue-600 py-2 rounded-lg text-sm font-medium">Copy Invite Link</button>
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
}