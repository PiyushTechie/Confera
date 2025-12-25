import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, MonitorOff,
  MessageSquare, PhoneOff, Info, X, Send, Copy,
  Users, LayoutDashboard, ShieldAlert, UserCheck, MoreVertical, Circle
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

  // Refs
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const connectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const displayStreamRef = useRef(null);

  const localGridRef = useRef(null);
  const localSpotlightRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Touch handling for swipe
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  // State
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

  const [spotlightId, setSpotlightId] = useState(null); // The "Main Speaker"
  const [showInfo, setShowInfo] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile View Mode: 0 = Speaker View, 1 = Gallery View
  const [mobilePage, setMobilePage] = useState(0); 

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  /* --------------------- MEDIA --------------------- */
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getVideoTracks()[0].enabled = video;
      stream.getAudioTracks()[0].enabled = audio;
      localStreamRef.current = stream;

      // Assign to refs initially
      if (localGridRef.current) localGridRef.current.srcObject = stream;
      if (localSpotlightRef.current) localSpotlightRef.current.srcObject = stream;
    } catch (err) {
      console.error("Media error:", err);
    }
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

    return pc;
  };

  const initiateOffer = async (targetId) => {
    const pc = connectionsRef.current[targetId];
    if (!pc) return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("signal", targetId, JSON.stringify({ sdp: pc.localDescription }));
    } catch (err) {
      console.error("Offer error:", err);
    }
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
      // Default spotlight to self initially
      setSpotlightId("local"); 
      
      if (isHost) {
        socketRef.current.emit("join-call", { path: window.location.href, username: userName });
      } else {
        socketRef.current.emit("request-join", { path: window.location.href, username: userName });
        setIsInWaitingRoom(true);
      }
    });

    socketRef.current.on("admitted", () => {
      setIsInWaitingRoom(false);
      socketRef.current.emit("join-call", { path: window.location.href, username: userName });
    });

    socketRef.current.on("update-waiting-list", (users) => {
      if (isHost) setWaitingUsers(users);
    });

    socketRef.current.on("all-users", (users) => {
      users.forEach(u => setUserMap(prev => ({ ...prev, [u.socketId]: u })));
    });

    socketRef.current.on("user-joined", (user) => {
      setUserMap(prev => ({ ...prev, [user.socketId]: user }));
      createPeer(user.socketId); 
      initiateOffer(user.socketId); 
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
        else {
          pendingIce.current[fromId] = pendingIce.current[fromId] || [];
          pendingIce.current[fromId].push(signal.ice);
        }
      }
    });

    socketRef.current.on("user-left", (id) => {
      connectionsRef.current[id]?.close();
      delete connectionsRef.current[id];
      setVideos(v => v.filter(x => x.socketId !== id));
      setUserMap(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      // If the spotlight user leaves, revert to local
      if (spotlightId === id) setSpotlightId("local");
    });

    socketRef.current.on("receive-message", (data) => {
      const isMe = data.socketId === socketRef.current.id;
      setMessages(prev => [...prev, { ...data, isMe }]);
    });
  };

  /* ------------------ CONTROLS ------------------ */
  const handleSendMessage = () => {
    if (!currentMessage.trim() || !socketRef.current) return;
    const msg = { text: currentMessage, sender: userName, socketId: socketRef.current.id, timestamp: new Date().toISOString() };
    socketRef.current.emit("send-message", msg);
    setMessages(prev => [...prev, { ...msg, isMe: true }]);
    setCurrentMessage("");
  };

  const handleScreen = async () => {
    if (isMobile) { alert("Screen sharing is not supported on mobile."); return; }
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
    if (track) { track.enabled = !video; setVideo(!video); }
  };
  const handleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !audio; setAudio(!audio); }
  };
  const handleAdmit = (socketId) => socketRef.current.emit("admit-user", socketId);
  const handleEndCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    socketRef.current?.disconnect();
    navigate("/");
  };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- SWIPE LOGIC ---
  const onTouchStart = (e) => {
    touchEndRef.current = null; 
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe Left -> Go to Gallery (Page 1)
      setMobilePage(1);
    } else if (distance < -minSwipeDistance) {
      // Swipe Right -> Go to Speaker (Page 0)
      setMobilePage(0);
    }
  };

  // Set spotlight when clicking a tile
  const setMainSpeaker = (id) => {
    setSpotlightId(id);
    if (isMobile) setMobilePage(0); // On mobile, jump to speaker view
  };

  /* ------------------ EFFECTS ------------------ */
  useEffect(() => {
    getMedia().then(() => {
      if (bypassLobby || (username && username !== "Guest")) connectSocket();
      else setAskForUsername(true);
    });
    return () => handleEndCall();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages, showChat]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const connect = () => { setAskForUsername(false); connectSocket(); };

  /* ------------------ RENDER HELPERS ------------------ */
  
  // Renders the main spotlight video (Desktop & Mobile Page 0)
  const renderSpotlight = () => {
    if (spotlightId === "local" || !spotlightId) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video ref={localSpotlightRef} autoPlay muted playsInline className={`max-w-full max-h-full object-contain ${!screen ? "-scale-x-100" : ""}`} />
          <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-full font-bold text-white">You (Main)</div>
        </div>
      );
    }
    const remote = videos.find(v => v.socketId === spotlightId);
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {remote ? (
           <video ref={ref => { if(ref) ref.srcObject = remote.stream; }} autoPlay playsInline className="max-w-full max-h-full object-contain" />
        ) : (
           <div className="flex items-center justify-center text-gray-500">User disconnected</div>
        )}
        <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-full font-bold text-white">
           {userMap[spotlightId]?.username || "Speaker"}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      {/* 1. JOIN SCREEN */}
      {askForUsername && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Join Meeting</h2>
            <input className="bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg block w-full p-2.5 mb-6" placeholder="Enter name" value={userName} onChange={(e) => setUsername(e.target.value)} />
            <div className="relative mb-6 rounded-lg overflow-hidden bg-black aspect-video">
              <video ref={localGridRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            </div>
            <button onClick={connect} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-3">Join</button>
          </div>
        </div>
      )}

      {/* 2. WAITING ROOM */}
      {isInWaitingRoom && !askForUsername && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
           <div className="bg-neutral-800 p-10 rounded-2xl shadow-2xl border border-neutral-700 max-w-lg w-full text-center">
             <ShieldAlert size={40} className="text-yellow-500 mx-auto mb-6" />
             <h2 className="text-2xl font-bold mb-2">Waiting for Host</h2>
             <div className="flex justify-center gap-2 mt-4"><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span></div>
           </div>
        </div>
      )}

      {/* 3. MAIN APP */}
      {!askForUsername && !isInWaitingRoom && (
        <div className="flex flex-col h-screen relative">
          
          {/* --- VIDEO AREA --- */}
          <div 
            className="flex-1 bg-black relative flex overflow-hidden"
            onTouchStart={isMobile ? onTouchStart : undefined}
            onTouchMove={isMobile ? onTouchMove : undefined}
            onTouchEnd={isMobile ? onTouchEnd : undefined}
          >
             {isMobile ? (
               /* === MOBILE LAYOUT === */
               <div className="w-full h-full relative">
                 {/* Page 0: SPEAKER VIEW */}
                 <div className={`absolute inset-0 transition-transform duration-300 ${mobilePage === 0 ? "translate-x-0" : "-translate-x-full"}`}>
                    {renderSpotlight()}
                 </div>

                 {/* Page 1: GALLERY VIEW (GRID) */}
                 <div className={`absolute inset-0 bg-neutral-900 transition-transform duration-300 p-2 overflow-y-auto grid grid-cols-2 auto-rows-min gap-2 content-start ${mobilePage === 1 ? "translate-x-0" : "translate-x-full"}`}>
                    {/* Local Tile */}
                    <div onClick={() => setMainSpeaker("local")} className={`relative bg-neutral-800 rounded-lg overflow-hidden aspect-square border ${spotlightId === "local" ? "border-blue-500" : "border-neutral-700"}`}>
                       <video ref={localGridRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!screen ? "-scale-x-100" : ""}`} />
                       <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px]">You</div>
                    </div>
                    {/* Remote Tiles */}
                    {videos.map(v => (
                       <div key={v.socketId} onClick={() => setMainSpeaker(v.socketId)} className={`relative bg-neutral-800 rounded-lg overflow-hidden aspect-square border ${spotlightId === v.socketId ? "border-blue-500" : "border-neutral-700"}`}>
                          <video ref={ref => { if(ref) ref.srcObject = v.stream; }} autoPlay playsInline className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[90%]">{userMap[v.socketId]?.username}</div>
                       </div>
                    ))}
                 </div>

                 {/* Pagination Dots */}
                 <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
                    <div className={`w-2 h-2 rounded-full transition-colors ${mobilePage === 0 ? "bg-white" : "bg-white/30"}`} />
                    <div className={`w-2 h-2 rounded-full transition-colors ${mobilePage === 1 ? "bg-white" : "bg-white/30"}`} />
                 </div>
               </div>
             ) : (
               /* === DESKTOP LAYOUT (Zoom Style: Spotlight Left, Filmstrip Right) === */
               <div className="w-full h-full flex">
                 {/* Main Stage */}
                 <div className="flex-1 bg-black flex items-center justify-center p-2">
                    {renderSpotlight()}
                 </div>
                 
                 {/* Sidebar Filmstrip */}
                 <div className="w-64 bg-neutral-900 border-l border-neutral-800 flex flex-col p-2 gap-2 overflow-y-auto">
                    {/* Local Tile in Filmstrip */}
                    <div onClick={() => setMainSpeaker("local")} className={`relative rounded-lg overflow-hidden aspect-video cursor-pointer border-2 ${spotlightId === "local" ? "border-blue-500" : "border-transparent hover:border-neutral-600"}`}>
                       <video ref={localGridRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!screen ? "-scale-x-100" : ""}`} />
                       <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px]">You</div>
                    </div>
                    {/* Remotes in Filmstrip */}
                    {videos.map(v => (
                      <div key={v.socketId} onClick={() => setMainSpeaker(v.socketId)} className={`relative rounded-lg overflow-hidden aspect-video cursor-pointer border-2 ${spotlightId === v.socketId ? "border-blue-500" : "border-transparent hover:border-neutral-600"}`}>
                         <video ref={ref => { if(ref) ref.srcObject = v.stream; }} autoPlay playsInline className="w-full h-full object-cover" />
                         <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px]">{userMap[v.socketId]?.username}</div>
                      </div>
                    ))}
                 </div>
               </div>
             )}
          </div>

          {/* --- FOOTER CONTROLS --- */}
          <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center z-20 px-4 gap-4 relative">
             <button onClick={handleAudio} className={`p-4 rounded-full ${audio ? 'bg-neutral-700' : 'bg-red-500'}`}>{audio ? <Mic size={24} /> : <MicOff size={24} />}</button>
             <button onClick={handleVideo} className={`p-4 rounded-full ${video ? 'bg-neutral-700' : 'bg-red-500'}`}>{video ? <Video size={24} /> : <VideoOff size={24} />}</button>
             <button onClick={handleScreen} className={`hidden md:block p-4 rounded-full ${screen ? 'bg-blue-600' : 'bg-neutral-700'}`}>{screen ? <MonitorOff size={24} /> : <ScreenShare size={24} />}</button>
             <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600"><PhoneOff size={24} /></button>
             
             {/* Mobile More Button */}
             <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-4 rounded-full bg-neutral-700 relative ml-2"><MoreVertical size={24} /></button>
             
             {/* Desktop Right Controls */}
             <div className="hidden md:flex absolute right-6 gap-3">
               <button onClick={() => setShowInfo(!showInfo)} className="p-3 rounded-xl bg-neutral-800"><Info size={24} /></button>
               <button onClick={() => setShowParticipants(!showParticipants)} className="p-3 rounded-xl bg-neutral-800"><Users size={24} /></button>
               <button onClick={() => setShowChat(!showChat)} className="p-3 rounded-xl bg-neutral-800"><MessageSquare size={24} /></button>
             </div>
             
             {/* Mobile Menu Popup */}
             {showMobileMenu && (
                 <div className="absolute bottom-24 right-4 w-64 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl p-2 flex flex-col gap-2 z-40 md:hidden">
                    <button onClick={() => { handleScreen(); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700"><ScreenShare size={20} /> Share Screen</button>
                    <button onClick={() => { setShowChat(!showChat); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700"><MessageSquare size={20} /> Chat</button>
                    <button onClick={() => { setShowParticipants(!showParticipants); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700"><Users size={20} /> Participants</button>
                    <button onClick={() => { setShowInfo(!showInfo); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700"><Info size={20} /> Info</button>
                 </div>
             )}
          </div>

          {/* --- SLIDE-OVER PANELS (Chat, Participants, Info) --- */}
          {showChat && (
            <div className="absolute right-0 top-0 h-[calc(100vh-5rem)] md:h-[calc(100vh-80px)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col">
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

          {showParticipants && (
            <div className="absolute right-0 top-0 h-[calc(100vh-5rem)] md:h-[calc(100vh-80px)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col">
                <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900"><h3 className="font-bold">Participants</h3><button onClick={() => setShowParticipants(false)}><X size={20} /></button></div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {isHost && waitingUsers.length > 0 && (
                        <div className="pb-4 border-b border-neutral-700">
                            <h4 className="text-xs font-bold text-yellow-500 uppercase mb-3">Waiting</h4>
                            {waitingUsers.map(u => (
                                <div key={u.socketId} className="flex justify-between items-center bg-neutral-700/50 p-2 rounded mb-2">
                                    <span className="text-sm">{u.username}</span>
                                    <button onClick={() => handleAdmit(u.socketId)} className="p-1 bg-green-600 rounded text-xs"><UserCheck size={14}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-neutral-700/50 p-2 rounded">
                        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">{userName.charAt(0)}</div><span className="text-sm">{userName} (You)</span></div>
                    </div>
                    {Object.values(userMap).map(u => (
                        <div key={u.socketId} className="flex justify-between items-center bg-neutral-700/50 p-2 rounded">
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">{u.username.charAt(0)}</div><span className="text-sm">{u.username}</span></div>
                            <div className={u.isMuted ? "text-red-500" : "text-gray-400"}>{u.isMuted ? <MicOff size={14} /> : <Mic size={14} />}</div>
                        </div>
                    ))}
                </div>
            </div>
          )}
          
          {showInfo && (
              <div className="absolute bottom-20 right-4 w-72 bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl z-30 p-4">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Info</h3><button onClick={() => setShowInfo(false)}><X size={18} /></button></div>
                  <div className="space-y-4">
                      <div><label className="text-xs text-gray-400">Code</label><div className="flex items-center gap-2 font-mono font-bold text-lg">{meetingCode} <button onClick={handleCopyLink} className="text-blue-400"><Copy size={16}/></button></div></div>
                      <button onClick={handleCopyLink} className="w-full bg-blue-600 py-2 rounded-lg text-sm font-medium">Copy Invite Link</button>
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
}