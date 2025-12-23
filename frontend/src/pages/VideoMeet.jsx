import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, MonitorOff, 
  MessageSquare, PhoneOff, Info, X, Send, Copy, Check, 
  Users, GripHorizontal, LayoutDashboard, 
  // NEW ICONS
  ShieldAlert, UserMinus, UserCheck, Gavel, MoreVertical,
} from "lucide-react";
import server from "../environment";

const server_url = server;

const peerConfigConnecions = {
  iceServers: [ { urls: "stun:stun.l.google.com:19302" } ],
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { bypassLobby, isAudioOn, isVideoOn, username: passedUsername, isHost } = location.state || {};
  const meetingCode = window.location.pathname.replace("/", "");

  const connectionsRef = useRef({});
  const socketRef = useRef();
  const socketIdRef = useRef();
  
  const localGridRef = useRef(null);
  const localSpotlightRef = useRef(null);
  const localFloatingRef = useRef(null);

  const chatContainerRef = useRef(); 
  const moutedRef = useRef(false);
  const draggableRef = useRef(null);
  
  const audioContextRef = useRef(null);
  const audioAnalysersRef = useRef({}); 
  const animationFrameRef = useRef(null);

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(isVideoOn !== undefined ? isVideoOn : true);
  let [audio, setAudio] = useState(isAudioOn !== undefined ? isAudioOn : true);
  let [screen, setScreen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  let [messages, setMessages] = useState([]); 
  let [currentMessage, setCurrentMessage] = useState("");
  let [showChat, setShowChat] = useState(false);
  let [showParticipants, setShowParticipants] = useState(false);
  let [newMessagesCount, setNewMessagesCount] = useState(0);
  let [showInfo, setShowInfo] = useState(false);
  let [copied, setCopied] = useState(false);

  let [askForUsername, setAskForUsername] = useState(!bypassLobby);
  let [userName, setUsername] = useState(passedUsername || "");
  let [videos, setVideos] = useState([]);
  let [userMap, setUserMap] = useState({}); 

  const [viewMode, setViewMode] = useState("GRID"); 
  const [spotlightId, setSpotlightId] = useState(null); 
  const [activeSpeakerId, setActiveSpeakerId] = useState(null); 

  const [position, setPosition] = useState({ x: window.innerWidth - 260, y: 20 }); 
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [waitingUsers, setWaitingUsers] = useState([]); // List of users waiting (Host view)
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false); // Guest view

  const setupAudioAnalysis = (stream, socketId) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    audioAnalysersRef.current[socketId] = analyser;
  };

  const monitorAudioLevels = () => {
    let maxVolume = 0;
    let loudestSpeaker = null;

    Object.entries(audioAnalysersRef.current).forEach(([id, analyser]) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        if (volume > 20 && volume > maxVolume) {
            maxVolume = volume;
            loudestSpeaker = id;
        }
    });

    if (loudestSpeaker && loudestSpeaker !== activeSpeakerId) {
        setActiveSpeakerId(loudestSpeaker);
    } else if (!loudestSpeaker && activeSpeakerId) {
        setTimeout(() => setActiveSpeakerId(null), 1000); 
    }
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevels);
  };

  useEffect(() => {
    monitorAudioLevels();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  useEffect(() => {
    if (!window.localStream) return;
    const attachStream = (ref) => {
      if (ref?.current && ref.current.srcObject !== window.localStream) {
        ref.current.srcObject = window.localStream;
      }
    };
    attachStream(localGridRef);
    attachStream(localSpotlightRef);
    attachStream(localFloatingRef);
  }, [viewMode, spotlightId, screen, isInWaitingRoom]); 

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;

      if (isHost) {
          socketRef.current.emit("join-call", { path: window.location.href, username: userName });
      } else {
          socketRef.current.emit("request-join", { path: window.location.href, username: userName });
          setIsInWaitingRoom(true);
      }
    });

    socketRef.current.on("update-waiting-list", (users) => {
        if(isHost) setWaitingUsers(users);
    });

    socketRef.current.on("admitted", () => {
        setIsInWaitingRoom(false);
        socketRef.current.emit("join-call", { path: window.location.href, username: userName });
    });

    socketRef.current.on("kicked", () => {
        alert("You have been removed from the meeting.");
        handleEndCall();
    });

    socketRef.current.on("user-joined", (participants) => {
        const connections = connectionsRef.current;
        const newUserMap = {};
        participants.forEach(p => { newUserMap[p.socketId] = { username: p.username, isMuted: p.isMuted }; });
        setUserMap(prev => ({ ...prev, ...newUserMap }));

        participants.forEach((participant) => {
            const targetId = participant.socketId;
            if (targetId === socketIdRef.current) return;
            if (!connections[targetId]) {
                connections[targetId] = new RTCPeerConnection(peerConfigConnecions);
                connections[targetId].onicecandidate = (event) => {
                    if (event.candidate) socketRef.current.emit("signal", targetId, JSON.stringify({ ice: event.candidate }));
                };
                connections[targetId].ontrack = (event) => {
                    const remoteStream = event.streams[0];
                    setVideos((prev) => {
                        if (prev.find(v => v.socketId === targetId)) return prev;
                        return [...prev, { socketId: targetId, stream: remoteStream }];
                    });
                    if (remoteStream.getAudioTracks().length > 0) {
                        setupAudioAnalysis(remoteStream, targetId);
                    }
                };
                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => connections[targetId].addTrack(track, window.localStream));
                }
                connections[targetId].createOffer().then((description) => {
                    connections[targetId].setLocalDescription(description).then(() => {
                        socketRef.current.emit("signal", targetId, JSON.stringify({ sdp: connections[targetId].localDescription }));
                    });
                }).catch(e => console.error("Offer Error:", e));
            }
        });
    });

    socketRef.current.on("audio-toggled", ({ socketId, isMuted }) => {
        setUserMap(prev => ({ ...prev, [socketId]: { ...prev[socketId], isMuted: isMuted } }));
    });

    socketRef.current.on("signal", (fromId, message) => {
        const signal = JSON.parse(message);
        const connections = connectionsRef.current;
        if (fromId !== socketIdRef.current) {
            if (!connections[fromId]) {
                connections[fromId] = new RTCPeerConnection(peerConfigConnecions);
                connections[fromId].onicecandidate = (event) => { if (event.candidate) socketRef.current.emit("signal", fromId, JSON.stringify({ ice: event.candidate })); };
                connections[fromId].ontrack = (event) => {
                    const remoteStream = event.streams[0];
                    setVideos((prev) => {
                        if (prev.find(v => v.socketId === fromId)) return prev;
                        return [...prev, { socketId: fromId, stream: remoteStream, autoPlay: true }];
                    });
                    if (remoteStream.getAudioTracks().length > 0) {
                        setupAudioAnalysis(remoteStream, fromId);
                    }
                };
                if (window.localStream) window.localStream.getTracks().forEach(track => connections[fromId].addTrack(track, window.localStream));
            }
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === "offer") {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
                            });
                        });
                    }
                });
            }
            if (signal.ice) connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
        }
    });

    useEffect(() => {
        if (!socketRef.current) return;
        const handleChat = (data, sender) => {
            setMessages((prev) => [...prev, { sender: sender, text: data, isMe: false }]);
            setShowChat((isOpen) => {
                if (!isOpen) setNewMessagesCount((count) => count + 1);
                return isOpen;
            });
        };
        socketRef.current.on("chat-message", handleChat);
        return () => { socketRef.current.off("chat-message", handleChat); };
    }, [socketRef.current]); 

    socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
        setUserMap(prev => { const newMap = { ...prev }; delete newMap[id]; return newMap; });
        if (audioAnalysersRef.current[id]) delete audioAnalysersRef.current[id]; 
        if (spotlightId === id) { setSpotlightId(null); setViewMode("GRID"); } 
        if(connectionsRef.current[id]) { connectionsRef.current[id].close(); delete connectionsRef.current[id]; }
    });
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoAvailable(!!videoPermission);
      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAvailable(!!audioPermission);

      if (videoAvailable || audioAvailable) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
        if (video === false) stream.getVideoTracks()[0].enabled = false;
        if (audio === false) stream.getAudioTracks()[0].enabled = false;
        window.localStream = stream;
        
        if (localGridRef.current) localGridRef.current.srcObject = stream;
        if (localSpotlightRef.current) localSpotlightRef.current.srcObject = stream;
        if (localFloatingRef.current) localFloatingRef.current.srcObject = stream;
        
        if (stream.getAudioTracks().length > 0) setupAudioAnalysis(stream, "local");
        if (bypassLobby) connectToSocketServer();
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (moutedRef.current) return;
    moutedRef.current = true;
    getPermissions();
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = draggableRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const bottomBarHeight = 90; 
    const padding = 20;
    const elementWidth = draggableRef.current ? draggableRef.current.offsetWidth : 200;
    const elementHeight = draggableRef.current ? draggableRef.current.offsetHeight : 150;
    let newX = Math.max(padding, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - elementWidth - padding));
    let newY = Math.max(padding, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - elementHeight - bottomBarHeight));
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const bottomBarHeight = 90;
    const padding = 20;
    const elementWidth = draggableRef.current ? draggableRef.current.offsetWidth : 200;
    const elementHeight = draggableRef.current ? draggableRef.current.offsetHeight : 150;
    const corners = [ { x: padding, y: padding }, { x: window.innerWidth - elementWidth - padding, y: padding }, { x: padding, y: window.innerHeight - elementHeight - bottomBarHeight }, { x: window.innerWidth - elementWidth - padding, y: window.innerHeight - elementHeight - bottomBarHeight } ];
    let closest = corners.reduce((prev, curr) => Math.hypot(curr.x - position.x, curr.y - position.y) < Math.hypot(prev.x - position.x, prev.y - position.y) ? curr : prev );
    setPosition(closest);
  };

  useEffect(() => {
    if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); } 
    else { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, position]);

  const connect = () => { setAskForUsername(false); connectToSocketServer(); };
  const handleVideo = () => {
    setVideo(!video);
    if (window.localStream) window.localStream.getVideoTracks()[0].enabled = !video;
  };
  const handleAudio = () => {
    const newAudioState = !audio;
    setAudio(newAudioState);
    if (window.localStream) window.localStream.getAudioTracks()[0].enabled = newAudioState;
    if (socketRef.current) socketRef.current.emit("toggle-audio", { roomId: window.location.href, isMuted: !newAudioState });
  };

  const handleEndCall = () => {
    try {
        if (window.localStream) { 
            window.localStream.getTracks().forEach(track => track.stop()); 
        }
        if (socketRef.current) { 
            socketRef.current.disconnect(); 
        }
    } catch (e) { 
        console.error("Error ending call:", e); 
    }
    
    if (localStorage.getItem("token")) { 
        navigate("/home", { replace: true }); 
    } else { 
        navigate("/", { replace: true }); 
    }
  };

useEffect(() => { 
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener('popstate', function (event) {
        window.history.pushState(null, document.title, window.location.href);
    });
}, []);
  
  const handleScreen = async () => {
    if (screen) {
        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const cameraVideoTrack = cameraStream.getVideoTracks()[0];
            
            Object.values(connectionsRef.current).forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track.kind === "video");
                if (sender) sender.replaceTrack(cameraVideoTrack);
            });

            const newStream = new MediaStream([cameraVideoTrack, window.localStream.getAudioTracks()[0]]);
            window.localStream = newStream;
            
            if (localGridRef.current) {
                localGridRef.current.srcObject = newStream;
            }

            cameraVideoTrack.enabled = video; 
            setScreen(false); 
            setViewMode("GRID");
        } catch (e) { console.error(e); }
    } else {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            const screenTrack = displayStream.getVideoTracks()[0];
            
            screenTrack.onended = () => { if (screen) handleScreen(); };
            
            Object.values(connectionsRef.current).forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track.kind === "video");
                if (sender) sender.replaceTrack(screenTrack);
            });

            const mixedStream = new MediaStream([screenTrack, window.localStream.getAudioTracks()[0]]);
            window.localStream = mixedStream;
            
            if (localGridRef.current) {
                localGridRef.current.srcObject = mixedStream;
            }

            setScreen(true); 
            setViewMode("SPOTLIGHT"); 
            setSpotlightId("local");
        } catch (e) { console.error(e); }
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() === "") return;
    socketRef.current.emit("chat-message", currentMessage, userName);
    setMessages((prev) => [...prev, { sender: "You", text: currentMessage, isMe: true }]);
    setCurrentMessage("");
  };

  const toggleChat = () => { setShowChat(!showChat); setShowParticipants(false); if (!showChat) setNewMessagesCount(0); };
  const toggleParticipants = () => { setShowParticipants(!showParticipants); setShowChat(false); };
  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleTileClick = (id) => {
      if (spotlightId === id && viewMode === "SPOTLIGHT") { setViewMode("GRID"); setSpotlightId(null); } 
      else { setViewMode("SPOTLIGHT"); setSpotlightId(id); }
  };
  useEffect(() => { if (viewMode !== "SPOTLIGHT") { setSpotlightId(null); } }, [viewMode]);

  const handleAdmit = (socketId) => {
      socketRef.current.emit("admit-user", { socketId });
  };

  const handleKick = (socketId) => {
      if(window.confirm("Are you sure you want to remove this user?")) {
          socketRef.current.emit("kick-user", { socketId });

          setVideos((prevVideos) => prevVideos.filter((video) => video.socketId !== socketId));
          setUserMap((prevMap) => {
              const newMap = { ...prevMap };
              delete newMap[socketId];
              return newMap;
          });
          
          if (audioAnalysersRef.current[socketId]) {
              delete audioAnalysersRef.current[socketId];
          }
          if(connectionsRef.current[socketId]) { 
              connectionsRef.current[socketId].close(); 
              delete connectionsRef.current[socketId]; 
          }

          if (spotlightId === socketId) { 
              setSpotlightId(null); 
              setViewMode("GRID"); 
          }
      }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      
      {askForUsername ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Join Meeting</h2>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-300">Display Name</label>
              <input type="text" className="bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg block w-full p-2.5" placeholder="Enter your name" value={userName} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="relative mb-6 rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video ref={localGridRef} autoPlay muted playsInline className="w-full h-full object-cover"/>
                <div className="absolute bottom-4 flex gap-4">
                    <button onClick={handleAudio} className={`p-3 rounded-full ${audio ? 'bg-neutral-600' : 'bg-red-500'}`}>{audio ? <Mic size={20} /> : <MicOff size={20} />}</button>
                    <button onClick={handleVideo} className={`p-3 rounded-full ${video ? 'bg-neutral-600' : 'bg-red-500'}`}>{video ? <Video size={20} /> : <VideoOff size={20} />}</button>
                </div>
            </div>
            <button onClick={connect} className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-3">Join Call</button>
          </div>
        </div>
      ) : isInWaitingRoom ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 p-4 text-center">
            <div className="bg-neutral-800 p-10 rounded-2xl shadow-2xl border border-neutral-700 max-w-lg w-full">
                <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={40} className="text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Waiting for Host</h2>
                <p className="text-gray-400 mb-8">The host has been notified. You will join automatically once admitted.</p>
                <div className="flex justify-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen relative">
            <div className="flex-1 bg-black relative flex overflow-hidden">
                
                {viewMode === "SPOTLIGHT" && spotlightId && (
                    <div className="flex-1 flex items-center justify-center p-4 bg-neutral-900">
                          {spotlightId === "local" ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <video ref={localSpotlightRef} autoPlay muted playsInline className={`max-w-full max-h-full object-contain ${!screen ? "-scale-x-100" : ""}`} />
                                <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-full text-lg font-semibold">{userName} (You)</div>
                            </div>
                          ) : (
                             videos.find(v => v.socketId === spotlightId) && (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <video 
                                        ref={(ref) => { 
                                            const v = videos.find(v => v.socketId === spotlightId);
                                            if (ref && v?.stream) ref.srcObject = v.stream; 
                                        }} 
                                        autoPlay playsInline 
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

                <div className={`${viewMode === "SPOTLIGHT" ? "hidden md:flex w-64 border-l border-neutral-800 flex-col overflow-y-auto" : "flex-1 flex-wrap items-center justify-center"} flex p-4 gap-4 bg-black transition-all duration-300`}>
                    
                    {spotlightId !== "local" && (
                         <div 
                             onClick={() => handleTileClick("local")}
                             className={`relative bg-neutral-800 rounded-xl overflow-hidden border cursor-pointer hover:border-blue-500 transition-all ${
                                 viewMode === "SPOTLIGHT" ? "w-full aspect-video" : "w-full md:max-w-xl aspect-video"
                             } ${activeSpeakerId === "local" ? "border-green-500 ring-2 ring-green-500/50" : "border-neutral-700"}`}
                         >
                            <video ref={localGridRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!screen ? "-scale-x-100" : ""}`} />
                            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                                <span className="text-xs font-semibold text-white">You {isHost && "(Host)"}</span>
                            </div>
                         </div>
                    )}

                    {videos.map((v) => {
                        if (spotlightId === v.socketId) return null;
                        const userData = userMap[v.socketId] || { username: "Guest", isMuted: false };
                        const isSpeaking = activeSpeakerId === v.socketId;

                        return (
                            <div 
                                key={v.socketId} 
                                onClick={() => handleTileClick(v.socketId)}
                                className={`relative bg-neutral-800 rounded-xl overflow-hidden border cursor-pointer hover:border-blue-500 transition-all ${
                                    viewMode === "SPOTLIGHT" ? "w-full aspect-video" : "w-full md:max-w-xl aspect-video"
                                } ${isSpeaking ? "border-green-500 ring-4 ring-green-500/50 shadow-lg shadow-green-500/20" : "border-neutral-700"}`}
                            >
                                <video ref={(ref) => { if (ref && v.stream) ref.srcObject = v.stream; }} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                                    <div className={userData.isMuted ? "text-red-500" : "text-white"}>{userData.isMuted ? <MicOff size={12}/> : <Mic size={12}/>}</div>
                                    <span className="text-xs font-semibold text-white">{userData.username}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {viewMode === "SPOTLIGHT" && spotlightId === "local" && (
                <div 
                    ref={draggableRef}
                    className="absolute w-32 md:w-48 aspect-video bg-neutral-800 rounded-lg overflow-hidden shadow-2xl border border-neutral-700 z-50 cursor-move"
                    style={{ left: `${position.x}px`, top: `${position.y}px`, transition: isDragging ? 'none' : 'all 0.3s' }}
                    onMouseDown={handleMouseDown}
                >
                    <video ref={localFloatingRef} autoPlay muted playsInline className={`w-full h-full object-cover pointer-events-none ${!screen ? "-scale-x-100" : ""}`}/>
                     <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center pointer-events-none"><GripHorizontal className="text-white/80" /></div>
                </div>
            )}

            <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center z-20 px-4 relative">
                
                <div className="flex items-center gap-4">
                    <button onClick={handleAudio} className={`p-4 rounded-full transition-all ${audio ? 'bg-neutral-700' : 'bg-red-500'}`}>{audio ? <Mic size={24} /> : <MicOff size={24} />}</button>
                    <button onClick={handleVideo} className={`p-4 rounded-full transition-all ${video ? 'bg-neutral-700' : 'bg-red-500'}`}>{video ? <Video size={24} /> : <VideoOff size={24} />}</button>
                    
                    <button onClick={handleScreen} className={`hidden md:block p-4 rounded-full transition-all ${screen ? 'bg-blue-600' : 'bg-neutral-700'}`}>{screen ? <MonitorOff size={24} /> : <ScreenShare size={24} />}</button>
                    <button onClick={() => setViewMode(viewMode === "GRID" ? "SPOTLIGHT" : "GRID")} className="hidden md:block p-4 rounded-full bg-neutral-700 hover:bg-neutral-600" title="Toggle Layout"><LayoutDashboard size={24} /></button>
                    
                    <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white ml-2"><PhoneOff size={24} /></button>
                
                    <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 relative ml-2">
                        <MoreVertical size={24} />
                        {((isHost && waitingUsers.length > 0) || newMessagesCount > 0) && <span className="absolute top-2 right-2 h-3 w-3 bg-red-600 rounded-full"></span>}
                    </button>
                </div>
                
                <div className="hidden md:flex absolute right-6 items-center gap-3">
                    <button onClick={() => setShowInfo(!showInfo)} className={`p-3 rounded-xl transition-colors ${showInfo ? "bg-blue-600 text-white" : "bg-neutral-800 text-gray-300"}`}><Info size={24} /></button>
                    <button onClick={toggleParticipants} className={`p-3 rounded-xl transition-colors relative ${showParticipants ? "bg-blue-600 text-white" : "bg-neutral-800 text-gray-300"}`}>
                        <Users size={24} />
                        {isHost && waitingUsers.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{waitingUsers.length}</span>}
                    </button>
                    <button onClick={toggleChat} className={`p-3 rounded-xl transition-colors relative ${showChat ? "bg-blue-600 text-white" : "bg-neutral-800 text-gray-300"}`}>
                        <MessageSquare size={24} />
                        {newMessagesCount > 0 && !showChat && (<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{newMessagesCount}</span>)}
                    </button>
                </div>

                {showMobileMenu && (
                    <div className="absolute bottom-24 right-4 w-64 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl p-2 flex flex-col gap-2 z-40 md:hidden animate-in slide-in-from-bottom-5">
                        <button onClick={() => { handleScreen(); setShowMobileMenu(false); }} className={`flex items-center gap-3 p-3 rounded-lg ${screen ? 'bg-blue-600 text-white' : 'hover:bg-neutral-700 text-gray-200'}`}>
                            {screen ? <MonitorOff size={20} /> : <ScreenShare size={20} />} <span className="text-sm font-medium">Share Screen</span>
                        </button>
                        
                        <button onClick={() => { setViewMode(viewMode === "GRID" ? "SPOTLIGHT" : "GRID"); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700 text-gray-200">
                            <LayoutDashboard size={20} /> <span className="text-sm font-medium">Switch Layout</span>
                        </button>

                        <div className="h-px bg-neutral-700 my-1"></div>

                        <button onClick={() => { setShowInfo(!showInfo); setShowMobileMenu(false); }} className={`flex items-center gap-3 p-3 rounded-lg ${showInfo ? "bg-blue-600 text-white" : "hover:bg-neutral-700 text-gray-200"}`}>
                            <Info size={20} /> <span className="text-sm font-medium">Meeting Info</span>
                        </button>

                        <button onClick={() => { toggleParticipants(); setShowMobileMenu(false); }} className={`flex items-center gap-3 p-3 rounded-lg relative ${showParticipants ? "bg-blue-600 text-white" : "hover:bg-neutral-700 text-gray-200"}`}>
                            <Users size={20} /> <span className="text-sm font-medium">Participants</span>
                            {isHost && waitingUsers.length > 0 && <span className="ml-auto bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{waitingUsers.length}</span>}
                        </button>

                        <button onClick={() => { toggleChat(); setShowMobileMenu(false); }} className={`flex items-center gap-3 p-3 rounded-lg relative ${showChat ? "bg-blue-600 text-white" : "hover:bg-neutral-700 text-gray-200"}`}>
                            <MessageSquare size={20} /> <span className="text-sm font-medium">Chat</span>
                            {newMessagesCount > 0 && <span className="ml-auto bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{newMessagesCount}</span>}
                        </button>
                    </div>
                )}
            </div>

            {showInfo && (
                <div className="absolute bottom-20 md:bottom-24 right-4 md:right-6 w-72 md:w-80 bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl z-30">
                    <div className="p-4 border-b border-neutral-700 flex justify-between items-center"><h3 className="font-bold text-white">Meeting Details</h3><button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-white"><X size={18}/></button></div>
                    <div className="p-4 space-y-4">
                        <div><label className="text-xs font-semibold text-gray-400">Meeting Code</label><div className="flex items-center gap-2 mt-1"><span className="text-lg font-mono font-bold">{meetingCode}</span><button onClick={handleCopyLink} className="text-blue-400">{copied ? <Check size={16}/> : <Copy size={16}/>}</button></div></div>
                        <div><label className="text-xs font-semibold text-gray-400">Host</label><div className="flex items-center gap-2 mt-1"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{userName.charAt(0).toUpperCase()}</div><span className="text-sm text-gray-200">{isHost ? `${userName} (You)` : "Unknown Host"}</span></div></div>
                        <div><label className="text-xs font-semibold text-gray-400">Invite Link</label><div className="mt-1 p-2 bg-neutral-900 rounded-lg text-xs text-gray-400 truncate border border-neutral-700">{window.location.href}</div><button onClick={handleCopyLink} className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"><Copy size={16} /> Copy Link</button></div>
                    </div>
                </div>
            )}

            {showParticipants && (
                <div className="absolute right-0 top-0 h-[calc(100vh-5rem)] md:h-[calc(100vh-80px)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col slide-in-right">
                    <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900"><h3 className="font-bold text-lg">Participants ({Object.keys(userMap).length + 1})</h3><button onClick={toggleParticipants} className="text-gray-400 hover:text-white"><X size={20} /></button></div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {isHost && waitingUsers.length > 0 && (
                            <div className="mb-4 pb-4 border-b border-neutral-700">
                                <h4 className="text-xs font-bold text-yellow-500 uppercase mb-3 flex items-center gap-2"><Gavel size={12}/> Waiting Room</h4>
                                {waitingUsers.map(u => (
                                    <div key={u.socketId} className="flex items-center justify-between p-2 rounded-lg bg-neutral-700/50 mb-2">
                                        <span className="font-medium text-sm">{u.username}</span>
                                        <button onClick={() => handleAdmit(u.socketId)} className="p-1.5 bg-green-600 hover:bg-green-700 rounded text-xs text-white flex items-center gap-1"><UserCheck size={14}/> Admit</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-700/50">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">{userName.charAt(0).toUpperCase()}</div><span className="font-medium text-sm">{userName} (You)</span></div>
                            <div className={!audio ? "text-red-500" : "text-gray-400"}>{!audio ? <MicOff size={16} /> : <Mic size={16} />}</div>
                        </div>
                        {Object.entries(userMap).map(([id, user]) => {
                             if (id === socketIdRef.current) return null; 
                             return (
                                <div key={id} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-700 transition-colors group">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">{user.username.charAt(0).toUpperCase()}</div><span className="font-medium text-sm">{user.username}</span></div>
                                    <div className="flex items-center gap-2">
                                        <div className={user.isMuted ? "text-red-500" : "text-gray-400"}>{user.isMuted ? <MicOff size={16} /> : <Mic size={16} />}</div>
                                        {isHost && (
                                            <button onClick={() => handleKick(id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove User">
                                                <UserMinus size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                             )
                        })}
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