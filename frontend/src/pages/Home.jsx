import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import {
  Video,
  Plus,
  Calendar,
  ScreenShare,
  Mic,
  MicOff,
  VideoOff,
  X,
  Copy,
  Check,
  User,
  Clock,
  LogOut,
  ArrowRight,
  Lock 
} from "lucide-react";

function HomeComponent() {
  let navigate = useNavigate();
  const { addToUserHistory, userData } = useContext(AuthContext);

  const [date, setDate] = useState(new Date());
  
  // New state for the input popup
  const [showJoinInputModal, setShowJoinInputModal] = useState(false);
  
  const [meetingCode, setMeetingCode] = useState("");
  const [passcode, setPasscode] = useState(""); // <--- NEW: Passcode State
  
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedMeetingId, setGeneratedMeetingId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const localVideoRef = useRef(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (userData?.name) {
      setParticipantName(userData.name);
    }
  }, [userData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    navigate("/auth");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, "/home");
    }
  }, []);

  const handleNewMeeting = () => {
    setIsJoining(false);
    setPasscode(""); // Reset passcode for new meeting
    const randomId = Math.floor(100000000 + Math.random() * 900000000).toString();
    const formattedId = `${randomId.substring(0, 3)}-${randomId.substring(3, 6)}-${randomId.substring(6, 9)}`;
    setGeneratedMeetingId(formattedId);
    setParticipantName(userData?.name || "");
    setShowPreviewModal(true);
    startPreviewCamera();
  };

  // Triggered after entering code in the new Join Input Modal
  const handleJoinVideoCall = () => {
    if (meetingCode.trim() === "") return;
    
    // Close the input modal
    setShowJoinInputModal(false);
    
    setIsJoining(true);
    setGeneratedMeetingId(meetingCode);
    setParticipantName(userData?.name || "");
    
    // Open the Camera Preview modal
    setShowPreviewModal(true);
    startPreviewCamera();
  };

  const startPreviewCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      window.previewStream = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsVideoOn(false);
    }
  };

  const stopPreviewCamera = () => {
    if (window.previewStream) {
      window.previewStream.getTracks().forEach((track) => track.stop());
    }
    setShowPreviewModal(false);
  };

  const startMeeting = async () => {
    stopPreviewCamera();
    await addToUserHistory(generatedMeetingId);
    const finalName = participantName.trim() || "Host";
    
    // Pass passcode to the meeting page
    navigate(`/meeting/${generatedMeetingId}`, {
      state: { 
        bypassLobby: true, 
        isAudioOn, 
        isVideoOn, 
        username: finalName, 
        isHost: !isJoining, // If not joining, you are host
        passcode: passcode // <--- Pass the passcode
      },
    });
  };

  const togglePreviewVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (window.previewStream) {
      const videoTrack = window.previewStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !isVideoOn;
    }
  };

  const togglePreviewAudio = () => {
    setIsAudioOn(!isAudioOn);
    if (window.previewStream) {
      const audioTrack = window.previewStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !isAudioOn;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMeetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date) => date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center relative font-sans text-neutral-800">

      <div className="w-full px-6 py-5 flex justify-between items-center bg-transparent z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Video size={20} />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">VideoMeet</span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/history")} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all">
            <Clock size={18} />
            <span className="hidden sm:inline">History</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all">
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl p-6 -mt-20">
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold text-gray-800 mb-4 tracking-tight">{formatTime(date)}</h1>
          <p className="text-gray-500 text-xl font-medium">{formatDate(date)}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {/* NEW MEETING BUTTON */}
          <div onClick={handleNewMeeting} className="flex flex-col items-center gap-3 cursor-pointer group">
            <div className="w-20 h-20 bg-orange-500 hover:bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-orange-500/30 transition-all transform group-hover:scale-105 group-hover:-translate-y-1">
              <Video size={36} />
            </div>
            <span className="text-sm font-semibold text-gray-700">New Meeting</span>
          </div>

          {/* JOIN BUTTON (UPDATED) */}
          <div 
            onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }} 
            className="flex flex-col items-center gap-3 cursor-pointer group"
          >
            <div className="w-20 h-20 bg-blue-600 hover:bg-blue-700 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 transition-all transform group-hover:scale-105 group-hover:-translate-y-1">
              <Plus size={36} />
            </div>
            <span className="text-sm font-semibold text-gray-700">Join</span>
          </div>

          {/* SCHEDULE BUTTON */}
          <div className="flex flex-col items-center gap-3 cursor-pointer group">
            <div className="w-20 h-20 bg-blue-600 hover:bg-blue-700 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 transition-all transform group-hover:scale-105 group-hover:-translate-y-1">
              <Calendar size={36} />
            </div>
            <span className="text-sm font-semibold text-gray-700">Schedule</span>
          </div>

          {/* SCREEN SHARE BUTTON */}
          <div className="flex flex-col items-center gap-3 cursor-pointer group">
            <div className="w-20 h-20 bg-blue-600 hover:bg-blue-700 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 transition-all transform group-hover:scale-105 group-hover:-translate-y-1">
              <ScreenShare size={36} />
            </div>
            <span className="text-sm font-semibold text-gray-700">Share Screen</span>
          </div>
        </div>
      </div>

      {/* JOIN MEETING INPUT MODAL */}
      {showJoinInputModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm m-4">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Join Meeting</h3>
                <button onClick={() => setShowJoinInputModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
             </div>
             
             <p className="text-sm text-gray-500 mb-4">Enter the meeting details below.</p>
             
             <div className="space-y-4">
                {/* Meeting ID Input */}
                <input 
                    type="text" 
                    placeholder="Meeting Code (e.g. 123-456-789)" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    autoFocus
                />
                
                {/* NEW: Passcode Input (For Guests) */}
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={16} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Passcode (Optional)" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                    />
                </div>
                
                <button 
                    onClick={handleJoinVideoCall}
                    disabled={!meetingCode.trim()}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                        meetingCode.trim() 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    Join Now <ArrowRight size={18} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px] md:h-[550px]">
            <div className="h-12 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between px-4 bg-gray-50 dark:bg-neutral-900">
              <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{isJoining ? "Join Meeting" : "New Meeting"}</span>
              <button onClick={stopPreviewCamera} className="text-gray-500 hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 bg-black relative flex items-center justify-center p-2 overflow-hidden">
              <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-contain rounded-lg z-10 ${!isVideoOn ? "hidden" : ""} -scale-x-100`}></video>
              {!isVideoOn && <div className="absolute inset-0 flex items-center justify-center z-10"><div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">{participantName ? participantName.charAt(0).toUpperCase() : "You"}</div></div>}
              
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10 z-20">
                <div className="text-xs text-gray-300">ID:</div>
                <div className="text-sm font-mono font-bold text-white tracking-wide">{generatedMeetingId}</div>
                <button onClick={copyToClipboard} className="text-gray-400 hover:text-white ml-1">{copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}</button>
              </div>
              
              <div className="absolute bottom-6 flex gap-4 z-20">
                <button onClick={togglePreviewAudio} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${isAudioOn ? "bg-neutral-800/80 hover:bg-neutral-700 text-white backdrop-blur-md border border-white/10" : "bg-red-500 text-white border border-red-500"}`}>{isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}<span>{isAudioOn ? "Mute" : "Unmute"}</span></button>
                <button onClick={togglePreviewVideo} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${isVideoOn ? "bg-neutral-800/80 hover:bg-neutral-700 text-white backdrop-blur-md border border-white/10" : "bg-red-500 text-white border border-red-500"}`}>{isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}<span>{isVideoOn ? "Stop Video" : "Start Video"}</span></button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col md:flex-row items-center justify-between p-4 gap-4 z-30">
              <div className="flex flex-col gap-3 w-full md:w-auto md:flex-1">
                {/* Name Input */}
                <div className="flex items-center gap-3 w-full">
                    <div className="bg-gray-100 dark:bg-neutral-800 p-2 rounded-lg text-gray-500"><User size={20} /></div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Display Name</label>
                        <input type="text" value={participantName} onChange={(e) => setParticipantName(e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-0 placeholder-gray-400" placeholder="Enter your name" />
                    </div>
                </div>

                {/* NEW: Passcode Input (For Host Creating Meeting) - Only visible if creating new meeting */}
                {!isJoining && (
                    <div className="flex items-center gap-3 w-full">
                        <div className="bg-gray-100 dark:bg-neutral-800 p-2 rounded-lg text-gray-500"><Lock size={20} /></div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Set Passcode (Optional)</label>
                            <input type="text" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-0 placeholder-gray-400" placeholder="No passcode" />
                        </div>
                    </div>
                )}
              </div>

              <button onClick={startMeeting} disabled={!participantName.trim()} className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${participantName.trim() ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{isJoining ? "Join Now" : "Start Meeting"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeComponent;