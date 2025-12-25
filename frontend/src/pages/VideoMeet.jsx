import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, MonitorOff,
  MessageSquare, PhoneOff, Info, X, Send, Copy, Check,
  Users, LayoutDashboard, ShieldAlert, UserMinus, UserCheck, Gavel, MoreVertical,
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
  const chatContainerRef = useRef(null);

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

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  
  // --- NEW: Unread Messages State ---
  const [unreadMessages, setUnreadMessages] = useState(0);

  /* --------------------- MEDIA --------------------- */
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getVideoTracks()[0].enabled = video;
      stream.getAudioTracks()[0].enabled = audio;
      localStreamRef.current = stream;
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
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      if (isHost) socketRef.current.emit("join-call", { path: window.location.href, username: userName });
      else { socketRef.current.emit("request-join", { path: window.location.href, username: userName }); setIsInWaitingRoom(true); }
    });

    socketRef.current.on("admitted", () => {
      setIsInWaitingRoom(false);
      socketRef.current.emit("join-call", { path: window.location.href, username: userName });
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

  /* ------------------ CONTROLS ------------------ */
  const handleSendMessage = () => {
    if (!currentMessage.trim() || !socketRef.current) return;
    const msg = { text: currentMessage, sender: userName, socketId: socketRef.current.id, timestamp: new Date().toISOString() };
    socketRef.current.emit("send-message", msg);
    setMessages(prev => [...prev, { ...msg, isMe: true }]);
    setCurrentMessage("");
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
    if (track) { track.enabled = !video; setVideo(!video); }
  };
  const handleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !audio; setAudio(!audio); }
  };
  const handleAdmit = (socketId) => socketRef.current.emit("admit-user", socketId);
  const handleTileClick = (id) => { setSpotlightId(id); setViewMode("SPOTLIGHT"); };
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

  useEffect(() => {
    getMedia().then(() => {
      if (bypassLobby || (username && username !== "Guest")) connectSocket();
      else setAskForUsername(true);
    });
    return () => handleEndCall();
  }, []);

  // Auto-scroll chat and handle badge count
  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    
    // --- NEW: Badge Logic ---
    // If chat is hidden AND we have messages AND the last message wasn't from me
    if (!showChat && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg.isMe) {
        setUnreadMessages(prev => prev + 1);
      }
    }
  }, [messages]); // Dependency on messages ensures this runs every time a new message comes in

  // --- NEW: Reset Badge Logic ---
  useEffect(() => {
    if (showChat) {
      setUnreadMessages(0);
    }
  }, [showChat]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent));
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      {askForUsername && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Join Meeting</h2>
            <input className="bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg block w-full p-2.5 mb-6" placeholder="Enter name" value={userName} onChange={(e) => setUsername(e.target.value)} />
            <div className="relative mb-6 rounded-lg overflow-hidden bg-black aspect-video">
              <video ref={node => { if(node && localStreamRef.current) node.srcObject = localStreamRef.current }} autoPlay muted playsInline className="w-full h-full object-cover" />
            </div>
            <button onClick={connect} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-3">Join</button>
          </div>
        </div>
      )}

      {isInWaitingRoom && !askForUsername && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
           <div className="bg-neutral-800 p-10 rounded-2xl shadow-2xl border border-neutral-700 max-w-lg w-full text-center">
             <ShieldAlert size={40} className="text-yellow-500 mx-auto mb-6" />
             <h2 className="text-2xl font-bold mb-2">Waiting for Host</h2>
             <div className="flex justify-center gap-2 mt-4"><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span></div>
           </div>
        </div>
      )}

      {!askForUsername && !isInWaitingRoom && (
        <div className="flex flex-col h-screen relative">
          <div className="flex-1 bg-black relative flex overflow-hidden">
            {viewMode === "SPOTLIGHT" && spotlightId && (
              <div className="flex-1 flex items-center justify-center p-4 bg-neutral-900">
                {spotlightId === "local" ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <video ref={node => { if(node && localStreamRef.current) node.srcObject = localStreamRef.current }} autoPlay muted playsInline className={`max-w-full max-h-full object-contain ${!screen ? "-scale-x-100" : ""}`} />
                        <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-full font-bold">You</div>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <video ref={(ref) => { const v = videos.find(v => v.socketId === spotlightId); if (ref && v?.stream) ref.srcObject = v.stream; }} autoPlay playsInline className="max-w-full max-h-full object-contain" />
                        <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-full font-bold">{userMap[spotlightId]?.username || "Guest"}</div>
                    </div>
                )}
              </div>
            )}

            <div className={`${viewMode === "SPOTLIGHT" ? "hidden md:flex w-64 border-l border-neutral-800 flex-col" : "flex-1 flex flex-wrap items-center justify-center"} p-4 gap-4 bg-black overflow-y-auto`}>
               {spotlightId !== "local" && (
                   <div onClick={() => handleTileClick("local")} className="relative bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 w-full md:max-w-xl aspect-video cursor-pointer">
                       <video ref={node => { if(node && localStreamRef.current) node.srcObject = localStreamRef.current }} autoPlay muted playsInline className={`w-full h-full object-cover ${!screen ? "-scale-x-100" : ""}`} />
                       <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">You</div>
                   </div>
               )}
               {videos.map(v => (
                   <div key={v.socketId} onClick={() => handleTileClick(v.socketId)} className="relative bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 w-full md:max-w-xl aspect-video cursor-pointer">
                       <video ref={ref => { if (ref && v.stream) ref.srcObject = v.stream; }} autoPlay playsInline className="w-full h-full object-cover" />
                       <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">{userMap[v.socketId]?.username || "Guest"}</div>
                   </div>
               ))}
            </div>
          </div>
          
          {viewMode === "SPOTLIGHT" && spotlightId !== "local" && (
            <div className="absolute w-32 md:w-48 aspect-video bg-neutral-800 rounded-lg overflow-hidden shadow-2xl border border-neutral-700 z-50 bottom-24 right-4 md:right-6">
               <video ref={node => { if(node && localStreamRef.current) node.srcObject = localStreamRef.current }} autoPlay muted playsInline className={`w-full h-full object-cover ${!screen ? "-scale-x-100" : ""}`} />
               <div className="absolute bottom-1 left-1 bg-black/50 px-1 rounded text-[10px]">You</div>
            </div>
          )}
          
          {viewMode === "SPOTLIGHT" && spotlightId === "local" && (
            <div className="absolute w-32 md:w-48 aspect-video bg-neutral-800 rounded-lg overflow-hidden shadow-2xl border border-neutral-700 z-50 cursor-move" style={{ left: `${position.x}px`, top: `${position.y}px` }} onMouseDown={handleMouseDown}>
               <video ref={node => { if(node && localStreamRef.current) node.srcObject = localStreamRef.current }} autoPlay muted playsInline className="w-full h-full object-cover pointer-events-none" />
            </div>
          )}

          <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center z-20 px-4 gap-4 relative">
             <button onClick={handleAudio} className={`p-4 rounded-full ${audio ? 'bg-neutral-700' : 'bg-red-500'}`}>{audio ? <Mic size={24} /> : <MicOff size={24} />}</button>
             <button onClick={handleVideo} className={`p-4 rounded-full ${video ? 'bg-neutral-700' : 'bg-red-500'}`}>{video ? <Video size={24} /> : <VideoOff size={24} />}</button>
             <button onClick={handleScreen} className={`hidden md:block p-4 rounded-full ${screen ? 'bg-blue-600' : 'bg-neutral-700'}`}>{screen ? <MonitorOff size={24} /> : <ScreenShare size={24} />}</button>
             <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600"><PhoneOff size={24} /></button>
             
             <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-4 rounded-full bg-neutral-700 relative ml-2"><MoreVertical size={24} /></button>
             
             <div className="hidden md:flex absolute right-6 gap-3">
               <button onClick={() => setShowInfo(!showInfo)} className="p-3 rounded-xl bg-neutral-800"><Info size={24} /></button>
               <button onClick={() => setShowParticipants(!showParticipants)} className="p-3 rounded-xl bg-neutral-800"><Users size={24} /></button>
               
               {/* --- UPDATED CHAT BUTTON WITH BADGE --- */}
               <button onClick={() => setShowChat(!showChat)} className="p-3 rounded-xl bg-neutral-800 relative">
                 <MessageSquare size={24} />
                 {unreadMessages > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px]">
                     {unreadMessages}
                   </span>
                 )}
               </button>
             </div>
             
             {showMobileMenu && (
                 <div className="absolute bottom-24 right-4 w-64 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl p-2 flex flex-col gap-2 z-40 md:hidden">
                    <button onClick={() => { handleScreen(); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700"><ScreenShare size={20} /> Share Screen</button>
                    <button onClick={() => { setViewMode(viewMode === "GRID" ? "SPOTLIGHT" : "GRID"); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700"><LayoutDashboard size={20} /> Layout</button>
                    
                    {/* --- UPDATED MOBILE CHAT BUTTON WITH BADGE --- */}
                    <button onClick={() => { setShowChat(!showChat); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700 relative">
                      <div className="relative">
                        <MessageSquare size={20} />
                        {unreadMessages > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadMessages}
                          </span>
                        )}
                      </div>
                      <span>Chat</span>
                    </button>
                    
                    <button onClick={() => { setShowParticipants(!showParticipants); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700"><Users size={20} /> Participants</button>
                    <button onClick={() => { setShowInfo(!showInfo); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700"><Info size={20} /> Info</button>
                 </div>
             )}
          </div>

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