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
    Clock,
    Sparkles,
    Zap
} from "lucide-react";

// --- COMPONENTS ---

// 1. Enhanced Profile Dropdown with Premium Design
const ProfileMenu = ({ user, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getInitials = (name) => {
        if (!name) return "U";
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-3 p-1.5 pr-4 rounded-full bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border border-white/40 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300"
            >
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {getInitials(user?.name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-bold text-slate-800 leading-none">{user?.name || "Guest"}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">@{user?.username || "user"}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="px-5 py-4 border-b border-slate-100/80 mb-2">
                        <p className="text-base font-bold text-slate-900">{user?.name || "Guest"}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || "No email"}</p>
                    </div>
                    
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-2xl transition-all duration-200 text-left group">
                        <User size={18} className="group-hover:scale-110 transition-transform" /> 
                        Profile Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-2xl transition-all duration-200 text-left group">
                        <Settings size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
                        Preferences
                    </button>
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2"></div>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 rounded-2xl transition-all duration-200 text-left group"
                    >
                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> 
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

// 2. Premium Action Card with Advanced Animations
const ActionCard = ({ icon: Icon, title, desc, gradient, glowColor, onClick }) => (
    <button 
        onClick={onClick}
        className={`group relative flex flex-col items-start justify-between p-8 h-56 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl w-full text-left overflow-hidden bg-gradient-to-br ${gradient}`}
        style={{ boxShadow: `0 10px 40px -10px ${glowColor}` }}
    >
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-700 group-hover:scale-150 group-hover:bg-white/30"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-24 -mb-24 transition-all duration-700 group-hover:scale-125"></div>
        
        {/* Icon Container with Glow */}
        <div className="relative z-10">
            <div className="p-4 bg-white/25 backdrop-blur-md rounded-[1.25rem] w-fit shadow-lg border border-white/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Icon size={32} className="text-white drop-shadow-lg" strokeWidth={2.5} />
            </div>
        </div>
        
        {/* Content with Slide Animation */}
        <div className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h3>
            <p className="text-white/90 text-sm font-semibold tracking-wide">{desc}</p>
        </div>

        {/* Hover Shine Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        </div>
    </button>
);

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        if (userData) {
            setCurrentUser(userData);
        } else {
            const stored = localStorage.getItem("userData");
            if (stored) {
                try {
                    setCurrentUser(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse user data");
                }
            }
        }
    }, [userData]);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [showJoinInputModal, setShowJoinInputModal] = useState(false);
    
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [refreshSchedule, setRefreshSchedule] = useState(0);
    const [meetingToEdit, setMeetingToEdit] = useState(null);

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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/auth");
    };

    const handleEditMeeting = (meeting) => {
        setMeetingToEdit(meeting);
        setShowScheduleModal(true);
    };

    const handleNewMeeting = () => {
        setIsJoining(false);
        setPasscode("");
        
        const randomId = Math.floor(100000000 + Math.random() * 900000000).toString();
        const formattedId = `${randomId.substring(0, 3)}-${randomId.substring(3, 6)}-${randomId.substring(6, 9)}`;
        setGeneratedMeetingId(formattedId);
        
        setParticipantName(currentUser?.name || ""); 
        
        setShowPreviewModal(true);
        startPreviewCamera();
    };

    const handleJoinVideoCall = () => {
        if (meetingCode.trim() === "") return;
        setShowJoinInputModal(false);
        setIsJoining(true);
        setGeneratedMeetingId(meetingCode);
        
        setParticipantName(currentUser?.name || ""); 

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

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const getFirstName = () => {
        if (currentUser?.name) return currentUser.name.split(' ')[0];
        return "there";
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex flex-col font-sans text-slate-800 selection:bg-indigo-200/50 relative overflow-hidden">
            
            {/* Animated Background Pattern */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* --- PREMIUM NAVBAR --- */}
            <nav className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-2xl border-b border-white/60 shadow-lg shadow-slate-200/20 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand with Glow */}
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/home")}>
                        <div className="relative">
                            <img src={brandLogo} alt="Logo" className="h-11 w-auto object-contain relative z-10 group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent hidden sm:block">Cenfora</span>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-5">
                        {/* Time Display with Premium Style */}
                        <div className="hidden md:flex flex-col items-end mr-2 bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/60 shadow-lg">
                            <span className="text-sm font-black text-slate-800">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[10px] font-bold text-slate-500">{currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                        </div>

                        {/* History Button */}
                        <button 
                            onClick={() => navigate("/history")} 
                            className="p-3 text-slate-600 hover:text-indigo-600 bg-white/60 hover:bg-white/90 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-0.5 border border-white/60" 
                            title="History"
                        >
                            <Clock size={20} />
                        </button>

                        <ProfileMenu user={currentUser} handleLogout={handleLogout} />
                    </div>
                </div>
            </nav>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-10">
                
                {/* Hero Section with Enhanced Typography */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="text-indigo-500 animate-pulse" size={28} />
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            {getGreeting()}, <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{getFirstName()}</span>
                        </h1>
                    </div>
                    <p className="text-slate-600 font-semibold text-lg">Ready to collaborate and create something amazing?</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Col: Action Cards */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ActionCard 
                                icon={Video} 
                                title="New Meeting" 
                                desc="Start instantly with one click" 
                                gradient="from-orange-500 via-rose-500 to-pink-600"
                                glowColor="rgba(251, 113, 133, 0.3)"
                                onClick={handleNewMeeting}
                            />
                            <ActionCard 
                                icon={Plus} 
                                title="Join Meeting" 
                                desc="Connect via ID or link" 
                                gradient="from-indigo-600 via-purple-600 to-blue-700"
                                glowColor="rgba(99, 102, 241, 0.3)"
                                onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }}
                            />
                            <ActionCard 
                                icon={Calendar} 
                                title="Schedule" 
                                desc="Plan meetings in advance" 
                                gradient="from-violet-600 via-purple-600 to-indigo-700"
                                glowColor="rgba(139, 92, 246, 0.3)"
                                onClick={() => setShowScheduleModal(true)}
                            />
                            <ActionCard 
                                icon={ScreenShare} 
                                title="Share Screen" 
                                desc="Present your work seamlessly" 
                                gradient="from-emerald-500 via-teal-600 to-cyan-600"
                                glowColor="rgba(16, 185, 129, 0.3)"
                                onClick={() => {}} 
                            />
                        </div>
                    </div>

                    {/* Right Col: Schedule List with Premium Card */}
                    <div className="lg:col-span-4 flex flex-col h-full">
                        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-7 shadow-xl border border-white/60 flex-1 min-h-[400px] relative overflow-hidden">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl"></div>
                            
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                        <Calendar size={18} className="text-white"/>
                                    </div>
                                    Today's Schedule
                                </h3>
                                <button 
                                    onClick={() => setShowScheduleModal(true)} 
                                    className="text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                            <div className="relative z-10">
                                <ScheduledList 
                                    refreshTrigger={refreshSchedule}
                                    onEditClick={handleEditMeeting}
                                    onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- MODALS --- */}

            {/* 1. PREMIUM JOIN MODAL */}
            {showJoinInputModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/60 relative overflow-hidden">
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-300/40 to-purple-300/40 rounded-full blur-3xl"></div>
                        
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Zap className="text-indigo-600" size={28} />
                                Join Meeting
                            </h3>
                            <button 
                                onClick={() => setShowJoinInputModal(false)} 
                                className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all duration-200"
                            >
                                <X size={22} />
                            </button>
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 block">Meeting ID or Link</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Video size={20} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 123-456-789" 
                                        className="w-full bg-white/80 backdrop-blur-xl border-2 border-slate-200 focus:border-indigo-500 rounded-2xl pl-14 pr-5 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono font-bold shadow-lg" 
                                        value={meetingCode} 
                                        onChange={(e) => setMeetingCode(e.target.value)} 
                                        autoFocus 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 block">Passcode (Optional)</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Host provided passcode" 
                                        className="w-full bg-white/80 backdrop-blur-xl border-2 border-slate-200 focus:border-indigo-500 rounded-2xl pl-14 pr-5 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-semibold shadow-lg" 
                                        value={passcode} 
                                        onChange={(e) => setPasscode(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleJoinVideoCall} 
                                disabled={!meetingCode.trim()} 
                                className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 ${meetingCode.trim() ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl shadow-indigo-300/50 hover:-translate-y-1" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}`}
                            >
                                Join Now <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PREMIUM PREVIEW MODAL */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/50 backdrop-blur-2xl">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white/95 backdrop-blur-2xl w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-white/40">
                            
                            {/* LEFT: Premium Video Preview */}
                            <div className="w-full md:w-2/3 bg-gradient-to-br from-slate-900 to-slate-800 relative flex flex-col justify-center p-6">
                                {/* Meeting ID Badge */}
                                <div className="absolute top-6 left-6 z-20">
                                    <div className="bg-white/15 backdrop-blur-2xl border border-white/20 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                                        <span className="text-xs text-white/70 font-bold">Meeting ID</span>
                                        <span className="text-base font-black font-mono text-white tracking-wider">{generatedMeetingId}</span>
                                        <button 
                                            onClick={copyToClipboard} 
                                            className="text-white/70 hover:text-white ml-1 transition-all duration-200 hover:scale-110"
                                        >
                                            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <button 
                                    onClick={stopPreviewCamera} 
                                    className="absolute top-6 right-6 z-50 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-xl rounded-2xl text-white transition-all duration-200 hover:scale-110 md:hidden border border-white/20"
                                >
                                    <X size={22} />
                                </button>

                                {/* Video Container */}
                                <div className="relative w-full aspect-video md:h-full rounded-[2rem] overflow-hidden bg-slate-950 shadow-2xl border-4 border-white/10">
                                    <video 
                                        ref={localVideoRef} 
                                        autoPlay 
                                        muted 
                                        className={`w-full h-full object-cover -scale-x-100 ${!isVideoOn ? "hidden" : ""}`}
                                    ></video>
                                    
                                    {!isVideoOn && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                            <div className="relative">
                                                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white/20 animate-pulse">
                                                    {participantName ? participantName.charAt(0).toUpperCase() : <User size={48}/>}
                                                </div>
                                                <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                                            </div>
                                            <p className="mt-6 text-white/70 text-base font-bold">Camera is off</p>
                                        </div>
                                    )}

                                    {/* Premium Media Controls */}
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-5 z-30">
                                        <button 
                                            onClick={togglePreviewAudio} 
                                            className={`p-4 rounded-2xl transition-all duration-300 border-2 backdrop-blur-2xl shadow-2xl hover:scale-110 ${isAudioOn ? "bg-white/20 hover:bg-white/30 text-white border-white/30" : "bg-rose-500 hover:bg-rose-600 text-white border-rose-400"}`}
                                        >
                                            {isAudioOn ? <Mic size={24} strokeWidth={2.5} /> : <MicOff size={24} strokeWidth={2.5} />}
                                        </button>
                                        
                                        <button 
                                            onClick={togglePreviewVideo} 
                                            className={`p-4 rounded-2xl transition-all duration-300 border-2 backdrop-blur-2xl shadow-2xl hover:scale-110 ${isVideoOn ? "bg-white/20 hover:bg-white/30 text-white border-white/30" : "bg-rose-500 hover:bg-rose-600 text-white border-rose-400"}`}
                                        >
                                            {isVideoOn ? <Video size={24} strokeWidth={2.5} /> : <VideoOff size={24} strokeWidth={2.5} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Premium Settings Panel */}
                            <div className="w-full md:w-1/3 bg-gradient-to-br from-white to-slate-50 p-10 flex flex-col border-l border-white/60 relative overflow-hidden">
                                {/* Decorative Background */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                
                                <div className="flex justify-between items-center mb-10 relative z-10">
                                    <h2 className="text-3xl font-black text-slate-900">
                                        {isJoining ? "Join Meeting" : "Ready?"}
                                    </h2>
                                    <button 
                                        onClick={stopPreviewCamera} 
                                        className="hidden md:block p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all duration-200"
                                    >
                                        <X size={22} />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-7 relative z-10">
                                    {/* Premium Name Input */}
                                    <div>
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 block">Display Name</label>
                                        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl border-2 border-slate-200 focus-within:border-indigo-500 p-4 rounded-2xl transition-all duration-300 shadow-lg focus-within:shadow-xl focus-within:shadow-indigo-100">
                                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                                <User size={20} className="text-white" />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={participantName} 
                                                onChange={(e) => setParticipantName(e.target.value)} 
                                                className="bg-transparent border-none w-full text-slate-900 font-bold placeholder-slate-400 focus:ring-0 p-0 text-lg" 
                                                placeholder="Enter your name" 
                                            />
                                        </div>
                                    </div>

                                    {/* Premium Passcode Input (Only for New Meetings) */}
                                    {!isJoining && (
                                        <div>
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 block">Meeting Passcode</label>
                                            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl border-2 border-slate-200 focus-within:border-indigo-500 p-4 rounded-2xl transition-all duration-300 shadow-lg focus-within:shadow-xl focus-within:shadow-indigo-100">
                                                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                                                    <Lock size={20} className="text-white" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={passcode} 
                                                    onChange={(e) => setPasscode(e.target.value)} 
                                                    className="bg-transparent border-none w-full text-slate-900 font-bold placeholder-slate-400 focus:ring-0 p-0 text-lg" 
                                                    placeholder="Optional" 
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 font-semibold mt-3 ml-1">Leave blank for open entry</p>
                                        </div>
                                    )}
                                </div>

                                {/* Premium Start Button */}
                                <div className="mt-10 relative z-10">
                                    <button 
                                        onClick={startMeeting} 
                                        disabled={!participantName.trim()} 
                                        className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all duration-300 transform relative overflow-hidden ${participantName.trim() ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-400/50 hover:-translate-y-1 hover:shadow-indigo-500/60" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"}`}
                                    >
                                        {/* Animated shine effect */}
                                        {participantName.trim() && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                        )}
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            {isJoining ? "Join Now" : "Start Meeting"}
                                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
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