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
    LogOut,
    ArrowRight,
    Lock,
    ChevronDown,
    Settings,
    Clock
} from "lucide-react";

// --- COMPONENTS ---

// 1. Profile Dropdown Component
const ProfileMenu = ({ userData, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-white/50 border border-transparent hover:border-indigo-100 transition-all"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : <User size={18}/>}
                </div>
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-bold text-slate-700 leading-none">{userData?.name || "Guest"}</span>
                    <span className="text-[10px] text-slate-500 font-medium">@{userData?.username || "user"}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-800">{userData?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
                    </div>
                    
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-left">
                        <User size={16} /> Profile Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-left">
                        <Settings size={16} /> Preferences
                    </button>
                    
                    <div className="h-px bg-slate-100 my-1"></div>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

// 2. Action Card Component
const ActionCard = ({ icon: Icon, title, desc, colorClass, onClick, delay }) => (
    <button 
        onClick={onClick}
        className={`group relative flex flex-col items-start justify-between p-6 h-48 rounded-[2rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full text-left overflow-hidden ${colorClass}`}
    >
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
        
        <div className="relative z-10 p-3 bg-white/20 backdrop-blur-md rounded-2xl w-fit">
            <Icon size={28} className="text-white" />
        </div>
        
        <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-white/80 text-sm font-medium">{desc}</p>
        </div>
    </button>
);

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [showJoinInputModal, setShowJoinInputModal] = useState(false);
    
    // Schedule & Edit State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [refreshSchedule, setRefreshSchedule] = useState(0);
    const [meetingToEdit, setMeetingToEdit] = useState(null);

    // Meeting State
    const [meetingCode, setMeetingCode] = useState("");
    const [passcode, setPasscode] = useState(""); 
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [generatedMeetingId, setGeneratedMeetingId] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [participantName, setParticipantName] = useState(""); // Default empty, filled on trigger
    const localVideoRef = useRef(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [copied, setCopied] = useState(false);

    // Update Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Handlers
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/auth");
    };

    const handleEditMeeting = (meeting) => {
        setMeetingToEdit(meeting);
        setShowScheduleModal(true);
    };

    // --- NEW MEETING TRIGGER ---
    const handleNewMeeting = () => {
        setIsJoining(false);
        setPasscode("");
        
        // Generate ID
        const randomId = Math.floor(100000000 + Math.random() * 900000000).toString();
        const formattedId = `${randomId.substring(0, 3)}-${randomId.substring(3, 6)}-${randomId.substring(6, 9)}`;
        setGeneratedMeetingId(formattedId);
        
        // Auto-fill Name from Profile
        setParticipantName(userData?.name || ""); 
        
        setShowPreviewModal(true);
        startPreviewCamera();
    };

    // --- JOIN MEETING TRIGGER ---
    const handleJoinVideoCall = () => {
        if (meetingCode.trim() === "") return;
        setShowJoinInputModal(false);
        setIsJoining(true);
        setGeneratedMeetingId(meetingCode);
        
        // Auto-fill Name from Profile
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
        const finalName = participantName.trim() || "Guest";

        navigate(`/meeting/${generatedMeetingId}`, {
            state: {
                bypassLobby: true,
                isAudioOn,
                isVideoOn,
                username: finalName, // Uses the edited name
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

    // Greeting Logic
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col font-sans text-slate-800 selection:bg-indigo-100">
            
            {/* --- NAVBAR --- */}
            <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
                        <img src={brandLogo} alt="Logo" className="h-10 w-auto object-contain" />
                        <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">Cenfora</span>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-sm font-bold text-slate-700">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-xs font-medium text-slate-400">{currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                        </div>
                        
                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                        <button onClick={() => navigate("/history")} className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="History">
                            <Clock size={20} />
                        </button>

                        <ProfileMenu userData={userData} handleLogout={handleLogout} />
                    </div>
                </div>
            </nav>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
                
                {/* Hero Section */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                        {getGreeting()}, <span className="text-indigo-600">{userData?.name?.split(' ')[0] || "Guest"}</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Ready to collaborate? Start a meeting or check your schedule.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Col: Action Buttons (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Action Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ActionCard 
                                icon={Video} 
                                title="New Meeting" 
                                desc="Start an instant meeting" 
                                colorClass="bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-200"
                                onClick={handleNewMeeting}
                            />
                            <ActionCard 
                                icon={Plus} 
                                title="Join Meeting" 
                                desc="Connect via ID or link" 
                                colorClass="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-200"
                                onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }}
                            />
                            <ActionCard 
                                icon={Calendar} 
                                title="Schedule" 
                                desc="Plan for upcoming events" 
                                colorClass="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-200"
                                onClick={() => setShowScheduleModal(true)}
                            />
                            <ActionCard 
                                icon={ScreenShare} 
                                title="Share Screen" 
                                desc="Present without audio" 
                                colorClass="bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200"
                                onClick={() => {}} 
                            />
                        </div>
                    </div>

                    {/* Right Col: Schedule List (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col h-full">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex-1 min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar size={18} className="text-indigo-500"/> Today's Schedule
                                </h3>
                                <button onClick={() => setShowScheduleModal(true)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                    + Add
                                </button>
                            </div>
                            <ScheduledList 
                                refreshTrigger={refreshSchedule}
                                onEditClick={handleEditMeeting}
                                onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* --- MODALS --- */}

            {/* 1. JOIN INPUT MODAL */}
            {showJoinInputModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                        
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Join Meeting</h3>
                            <button onClick={() => setShowJoinInputModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Meeting ID or Link</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Video size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 123-456-789" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-medium" 
                                        value={meetingCode} 
                                        onChange={(e) => setMeetingCode(e.target.value)} 
                                        autoFocus 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Passcode (Optional)</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Host provided passcode" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" 
                                        value={passcode} 
                                        onChange={(e) => setPasscode(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleJoinVideoCall} 
                                disabled={!meetingCode.trim()} 
                                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${meetingCode.trim() ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}`}
                            >
                                Join Now <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PREVIEW MODAL (THE GREEN ROOM) */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/90 backdrop-blur-md">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
                            
                            {/* LEFT: Video Preview */}
                            <div className="w-full md:w-2/3 bg-black relative flex flex-col justify-center p-4">
                                <div className="absolute top-4 left-4 z-20">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                        <span className="text-xs text-white/60 font-medium">ID:</span>
                                        <span className="text-sm font-mono font-bold text-white tracking-wider">{generatedMeetingId}</span>
                                        <button onClick={copyToClipboard} className="text-white/60 hover:text-white ml-2 transition-colors">
                                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <button onClick={stopPreviewCamera} className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white md:hidden">
                                    <X size={20} />
                                </button>

                                <div className="relative w-full aspect-video md:h-full rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl isolate border border-white/10">
                                    <video 
                                        ref={localVideoRef} 
                                        autoPlay 
                                        muted 
                                        className={`w-full h-full object-cover -scale-x-100 z-0 ${!isVideoOn ? "hidden" : ""}`}
                                    ></video>
                                    
                                    {!isVideoOn && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-800">
                                            <div className="relative">
                                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-neutral-700">
                                                    {participantName ? participantName.charAt(0).toUpperCase() : <User size={40}/>}
                                                </div>
                                            </div>
                                            <p className="mt-4 text-neutral-400 text-sm font-medium">Camera is off</p>
                                        </div>
                                    )}

                                    {/* Media Controls */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
                                        <button 
                                            onClick={togglePreviewAudio} 
                                            className={`p-3.5 rounded-full transition-all duration-200 border ${isAudioOn ? "bg-white/20 hover:bg-white/30 text-white border-white/10 backdrop-blur-md" : "bg-rose-500 text-white border-rose-500"}`}
                                        >
                                            {isAudioOn ? <Mic size={22} /> : <MicOff size={22} />}
                                        </button>
                                        
                                        <button 
                                            onClick={togglePreviewVideo} 
                                            className={`p-3.5 rounded-full transition-all duration-200 border ${isVideoOn ? "bg-white/20 hover:bg-white/30 text-white border-white/10 backdrop-blur-md" : "bg-rose-500 text-white border-rose-500"}`}
                                        >
                                            {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Settings & Start */}
                            <div className="w-full md:w-1/3 bg-white p-8 flex flex-col border-l border-slate-100">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {isJoining ? "Join Meeting" : "Ready?"}
                                    </h2>
                                    <button onClick={stopPreviewCamera} className="hidden md:block p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-6">
                                    {/* Name Input */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Display Name</label>
                                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                            <User size={20} className="text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={participantName} 
                                                onChange={(e) => setParticipantName(e.target.value)} 
                                                className="bg-transparent border-none w-full text-slate-800 font-bold placeholder-slate-400 focus:ring-0 p-0" 
                                                placeholder="Enter your name" 
                                            />
                                        </div>
                                    </div>

                                    {/* Passcode (Only for New Meetings) */}
                                    {!isJoining && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Meeting Passcode</label>
                                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                                <Lock size={20} className="text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    value={passcode} 
                                                    onChange={(e) => setPasscode(e.target.value)} 
                                                    className="bg-transparent border-none w-full text-slate-800 font-bold placeholder-slate-400 focus:ring-0 p-0" 
                                                    placeholder="Optional" 
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">Leave blank for open entry.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <button 
                                        onClick={startMeeting} 
                                        disabled={!participantName.trim()} 
                                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-0.5 ${participantName.trim() ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}`}
                                    >
                                        {isJoining ? "Join Now" : "Start Meeting"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ScheduleModal
                isOpen={showScheduleModal}
                onClose={() => { setShowScheduleModal(false); setMeetingToEdit(null); }}
                onSuccess={() => { setRefreshSchedule(prev => prev + 1); setMeetingToEdit(null); }}
                meetingToEdit={meetingToEdit}
            />
        </div>
    );
}

export default HomeComponent;