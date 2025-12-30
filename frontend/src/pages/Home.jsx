import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import brandLogo from "../assets/BrandLogo.png";
import ScheduleModal from "../components/ScheduleModal";
import ScheduledList from "../components/ScheduledList";
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
    Lock,
    Settings
} from "lucide-react";

// --- NAVBAR COMPONENT ---
const Navbar = ({ navigate, handleLogout }) => {
    const brandLogoSrc = brandLogo;

    return (
        <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate("/home")}>
                    <img
                        src={brandLogoSrc}
                        alt="Brand Logo"
                        className="h-16 md:h-16 w-auto object-contain transition-all"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button 
                        onClick={() => navigate("/history")} 
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                    >
                        <Clock size={20} />
                        <span className="hidden sm:inline">History</span>
                    </button>
                    
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-all"
                    >
                        <LogOut size={20} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    const [date, setDate] = useState(new Date());
    const [showJoinInputModal, setShowJoinInputModal] = useState(false);
    
    // --- SCHEDULE & EDIT STATE ---
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [refreshSchedule, setRefreshSchedule] = useState(0);
    const [meetingToEdit, setMeetingToEdit] = useState(null); // <--- Added for Edit Mode

    const [meetingCode, setMeetingCode] = useState("");
    const [passcode, setPasscode] = useState(""); 
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [generatedMeetingId, setGeneratedMeetingId] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [participantName, setParticipantName] = useState("");
    const localVideoRef = useRef(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [copied, setCopied] = useState(false);

    // --- HANDLERS FOR SCHEDULE ---
    const handleEditMeeting = (meeting) => {
        setMeetingToEdit(meeting);
        setShowScheduleModal(true);
    };

    const handleScheduleSuccess = () => {
        setRefreshSchedule((prev) => prev + 1);
        setMeetingToEdit(null);
    };

    const handleCloseSchedule = () => {
        setShowScheduleModal(false);
        setMeetingToEdit(null);
    };

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
        setPasscode("");
        const randomId = Math.floor(100000000 + Math.random() * 900000000).toString();
        const formattedId = `${randomId.substring(0, 3)}-${randomId.substring(3, 6)}-${randomId.substring(6, 9)}`;
        setGeneratedMeetingId(formattedId);
        setParticipantName(userData?.name || "");
        setShowPreviewModal(true);
        startPreviewCamera();
    };

    const handleJoinVideoCall = () => {
        if (meetingCode.trim() === "") return;
        setShowJoinInputModal(false);
        setIsJoining(true);
        setGeneratedMeetingId(meetingCode);
        setParticipantName(userData?.name || "");
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

        navigate(`/meeting/${generatedMeetingId}`, {
            state: {
                bypassLobby: true,
                isAudioOn,
                isVideoOn,
                username: finalName,
                isHost: !isJoining, 
                passcode: passcode 
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
        <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-800">
            <Navbar navigate={navigate} handleLogout={handleLogout} />

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 -mt-10">
                <div className="text-center mb-8 sm:mb-20">
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-slate-800 mb-2 tracking-tight">
                        {formatTime(date)}
                    </h1>
                    <p className="text-slate-500 text-lg sm:text-2xl font-medium">
                        {formatDate(date)}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl">
                    <button onClick={handleNewMeeting} className="group relative flex flex-col items-center cursor-pointer justify-center gap-3 p-4 sm:p-8 bg-orange-500 hover:bg-orange-600 rounded-3xl shadow-xl shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                        <div className="p-3 sm:p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                            <Video size={28} className="text-white sm:w-8 sm:h-8" />
                        </div>
                        <span className="text-sm sm:text-lg font-bold text-white">New Meeting</span>
                    </button>

                    <button onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }} className="group cursor-pointer flex flex-col items-center justify-center gap-3 p-4 sm:p-8 bg-white hover:bg-indigo-50 rounded-3xl shadow-sm border border-slate-200 transition-all duration-300 transform hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">
                        <div className="p-3 sm:p-4 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                            <Plus size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <span className="text-sm sm:text-lg font-bold text-slate-700 group-hover:text-indigo-700">Join</span>
                    </button>

                    <button onClick={() => setShowScheduleModal(true)} className="group flex flex-col cursor-pointer items-center justify-center gap-3 p-4 sm:p-8 bg-white hover:bg-indigo-50 rounded-3xl shadow-sm border border-slate-200 transition-all duration-300 transform hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">
                        <div className="p-3 sm:p-4 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                            <Calendar size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <span className="text-sm sm:text-lg font-bold text-slate-700 group-hover:text-indigo-700">Schedule</span>
                    </button>

                    <button className="group flex flex-col items-center cursor-pointer justify-center gap-3 p-4 sm:p-8 bg-white hover:bg-indigo-50 rounded-3xl shadow-sm border border-slate-200 transition-all duration-300 transform hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">
                        <div className="p-3 sm:p-4 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                            <ScreenShare size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <span className="text-sm sm:text-lg font-bold text-slate-700 group-hover:text-indigo-700">Screen</span>
                    </button>
                </div>

                {/* --- SCHEDULED LIST SECTION --- */}
                <div className="w-full max-w-4xl mt-10">
                    <ScheduledList 
                        refreshTrigger={refreshSchedule}
                        onEditClick={handleEditMeeting} // Pass the edit handler
                        onRefresh={() => setRefreshSchedule(prev => prev + 1)} // Pass refresh for delete
                    />
                </div>
            </div>

            {/* --- MODALS --- */}
            {showJoinInputModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 my-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Join a Meeting</h3>
                            <button onClick={() => setShowJoinInputModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Meeting ID</label>
                                <div className="relative">
                                    <input type="text" placeholder="e.g. 123-456-789" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" value={meetingCode} onChange={(e) => setMeetingCode(e.target.value)} autoFocus />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Passcode (Optional)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                                    <input type="text" placeholder="Host provided passcode" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
                                </div>
                            </div>
                            <button onClick={handleJoinVideoCall} disabled={!meetingCode.trim()} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 ${meetingCode.trim() ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transform hover:-translate-y-0.5" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                                Join Now <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW MODAL */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px] border border-white/10 relative">
                            
                            <button onClick={stopPreviewCamera} className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white md:hidden">
                                <X size={20} />
                            </button>

                            {/* LEFT: Video Preview Area */}
                            <div className="w-full md:w-2/3 bg-black relative flex flex-col justify-center p-4">
                                <div className="relative w-full h-[400px] md:h-full rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl flex items-center justify-center isolate">
                                    <video 
                                        ref={localVideoRef} 
                                        autoPlay 
                                        muted 
                                        className={`w-full h-full object-cover -scale-x-100 z-0 ${!isVideoOn ? "hidden" : ""}`}
                                    ></video>
                                    
                                    {!isVideoOn && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-800">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                                                <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-neutral-700">
                                                    {participantName ? participantName.charAt(0).toUpperCase() : "U"}
                                                </div>
                                            </div>
                                            <p className="mt-4 text-neutral-400 text-sm font-medium">Camera is off</p>
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10 z-20">
                                        <span className="text-xs text-white/70">ID:</span>
                                        <span className="text-sm font-mono font-bold text-white tracking-wider">{generatedMeetingId}</span>
                                        <button onClick={copyToClipboard} className="text-white/70 hover:text-white ml-2 transition-colors">
                                            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
                                        <button 
                                            onClick={togglePreviewAudio} 
                                            className={`p-4 rounded-full transition-all duration-300 border shadow-lg ${
                                                isAudioOn 
                                                ? "bg-white/20 hover:bg-white/30 text-white border-white/10 backdrop-blur-md" 
                                                : "bg-rose-500 text-white border-rose-500 shadow-rose-500/40"
                                            }`}
                                        >
                                            {isAudioOn ? <Mic size={24} /> : <MicOff size={24} />}
                                        </button>
                                        
                                        <button 
                                            onClick={togglePreviewVideo} 
                                            className={`p-4 rounded-full transition-all duration-300 border shadow-lg ${
                                                isVideoOn 
                                                ? "bg-white/20 hover:bg-white/30 text-white border-white/10 backdrop-blur-md" 
                                                : "bg-rose-500 text-white border-rose-500 shadow-rose-500/40"
                                            }`}
                                        >
                                            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-1/3 bg-white p-6 sm:p-8 flex flex-col">
                                <div className="flex justify-between items-center mb-6 md:mb-8">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                                        {isJoining ? "Join Meeting" : "Ready to join?"}
                                    </h2>
                                    <button onClick={stopPreviewCamera} className="hidden md:block p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Display Name</label>
                                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                            <User size={20} className="text-slate-400" />
                                            <input type="text" value={participantName} onChange={(e) => setParticipantName(e.target.value)} className="bg-transparent border-none w-full text-slate-800 font-medium placeholder-slate-400 focus:ring-0 p-0" placeholder="Enter your name" />
                                        </div>
                                    </div>
                                    {!isJoining && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Set Passcode (Optional)</label>
                                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                                <Lock size={20} className="text-slate-400" />
                                                <input type="text" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="bg-transparent border-none w-full text-slate-800 font-medium placeholder-slate-400 focus:ring-0 p-0" placeholder="No passcode" />
                                            </div>
                                            <p className="text-xs text-slate-400 px-1">Share this code with your guests.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 mb-4 md:mb-0">
                                    <button onClick={startMeeting} disabled={!participantName.trim()} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 ${participantName.trim() ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}`}>
                                        {isJoining ? "Join Now" : "Start Meeting"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SCHEDULE MODAL --- */}
            {/* FIXED: Passing 'onSuccess' correctly to match ScheduleModal.jsx */}
            <ScheduleModal
                isOpen={showScheduleModal}
                onClose={handleCloseSchedule}
                onSuccess={handleScheduleSuccess}
                meetingToEdit={meetingToEdit}
            />
        </div>
    );
}

export default HomeComponent;