import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import brandLogo from "../assets/BrandLogo.png";
import ScheduleModal from "../components/ScheduleModal";
import ScheduledList from "../components/ScheduledList";
import {
    Video, Plus, Calendar, ScreenShare, Mic, MicOff, VideoOff,
    X, Copy, Check, User, LogOut, ArrowRight, Lock, ChevronDown, Settings, Clock, MoreHorizontal
} from "lucide-react";

// --- PROFILE MENU (Unchanged) ---
const ProfileMenu = ({ user, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");
    const displayName = user?.name || "Guest";
    const displayUsername = user?.username || "user";

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-all"
            >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {getInitials(displayName)}
                </div>
                {/* Optional: Hide name on very small screens to mimic clean look */}
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold text-slate-700 leading-none">{displayName}</span>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-800">{displayName}</p>
                        <p className="text-xs text-slate-500">@{displayUsername}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

// --- ACTION BUTTON COMPONENT ---
const ActionButton = ({ icon: Icon, label, color, onClick, hasDropdown }) => (
    <div className="flex flex-col items-center gap-2">
        <button 
            onClick={onClick}
            className={`w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform active:scale-95 ${color === 'orange' ? 'bg-[#F97316] hover:bg-[#ea580c]' : 'bg-[#0E71EB] hover:bg-[#0256b1]'}`}
        >
            <Icon size={32} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-1">
            <span className="text-xs sm:text-sm font-medium text-slate-600">{label}</span>
            {hasDropdown && <ChevronDown size={12} className="text-slate-400" />}
        </div>
    </div>
);

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    // --- SAFELY INITIALIZE USER ---
    const [currentUser, setCurrentUser] = useState(() => {
        if (userData) return userData;
        try {
            const stored = localStorage.getItem("userData");
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    });

    useEffect(() => { if (userData) setCurrentUser(userData); }, [userData]);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [showJoinInputModal, setShowJoinInputModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [refreshSchedule, setRefreshSchedule] = useState(0);
    const [meetingToEdit, setMeetingToEdit] = useState(null);

    // Meeting State
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

    // ... (Keep all your existing handler functions: handleLogout, handleEditMeeting, startMeeting, etc. unchanged) ...
    const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("userData"); navigate("/auth"); };
    const handleEditMeeting = (meeting) => { setMeetingToEdit(meeting); setShowScheduleModal(true); };
    const handleNewMeeting = () => { setIsJoining(false); setPasscode(""); const id = Math.floor(100000000 + Math.random() * 900000000).toString(); setGeneratedMeetingId(`${id.substring(0,3)}-${id.substring(3,6)}-${id.substring(6,9)}`); setParticipantName(currentUser?.name || ""); setShowPreviewModal(true); startPreviewCamera(); };
    const handleJoinVideoCall = () => { if (!meetingCode.trim()) return; setShowJoinInputModal(false); setIsJoining(true); setGeneratedMeetingId(meetingCode); setParticipantName(currentUser?.name || ""); setShowPreviewModal(true); startPreviewCamera(); };
    const startPreviewCamera = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); if(localVideoRef.current) localVideoRef.current.srcObject = stream; window.previewStream = stream; } catch(e) { console.error(e); setIsVideoOn(false); } };
    const stopPreviewCamera = () => { if(window.previewStream) window.previewStream.getTracks().forEach(t => t.stop()); setShowPreviewModal(false); };
    const startMeeting = async () => { stopPreviewCamera(); await addToUserHistory(generatedMeetingId); navigate(`/meeting/${generatedMeetingId}`, { state: { bypassLobby: true, isAudioOn, isVideoOn, username: participantName.trim() || "User", isHost: !isJoining, passcode } }); };
    const togglePreviewVideo = () => { setIsVideoOn(!isVideoOn); if(window.previewStream) window.previewStream.getVideoTracks()[0].enabled = !isVideoOn; };
    const togglePreviewAudio = () => { setIsAudioOn(!isAudioOn); if(window.previewStream) window.previewStream.getAudioTracks()[0].enabled = !isAudioOn; };
    const copyToClipboard = () => { navigator.clipboard.writeText(generatedMeetingId); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    // Date formatting for the Header
    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="min-h-screen w-full bg-white flex flex-col font-sans text-slate-800">
            {/* --- NAVBAR (Minimalist) --- */}
            <nav className="w-full px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
                     {/* You can keep the logo or remove it for purer look */}
                    <img src={brandLogo} alt="Logo" className="h-8 w-auto object-contain" /> 
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/history")} className="text-slate-500 hover:text-slate-900 transition-colors" title="History">
                        <Clock size={20} />
                    </button>
                    <ProfileMenu user={currentUser} handleLogout={handleLogout} />
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto px-4 pt-4 sm:pt-8">
                
                {/* 1. CLOCK SECTION */}
                <div className="text-center mb-10 sm:mb-14">
                    <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-2">
                        {formattedTime}
                    </h1>
                    <p className="text-slate-500 text-lg sm:text-xl font-medium">
                        {formattedDate}
                    </p>
                </div>

                {/* 2. ICON ROW (The 4 Buttons) */}
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10 sm:mb-14 w-full">
                    <ActionButton 
                        icon={Video} 
                        label="New meeting" 
                        color="orange" 
                        hasDropdown={true}
                        onClick={handleNewMeeting} 
                    />
                    <ActionButton 
                        icon={Plus} 
                        label="Join" 
                        color="blue" 
                        onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }} 
                    />
                    <ActionButton 
                        icon={Calendar} 
                        label="Schedule" 
                        color="blue" 
                        onClick={() => setShowScheduleModal(true)} 
                    />
                    <ActionButton 
                        icon={ScreenShare} 
                        label="Share screen" 
                        color="blue" 
                        onClick={() => {}} 
                    />
                </div>

                {/* 3. SCHEDULE CARD CONTAINER */}
                <div className="w-full max-w-[600px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    {/* Card Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-md transition-colors">
                            <h3 className="text-sm font-bold text-slate-700">Today, {currentTime.toLocaleString('default', { month: 'short', day: 'numeric' })}</h3>
                            <ChevronDown size={14} className="text-slate-400" />
                        </div>
                        <div className="flex items-center gap-1">
                             {/* Mock Navigation Controls */}
                            <button className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded">Today</button>
                            <button className="p-1 text-slate-400 hover:text-slate-600"><ChevronDown size={16} className="rotate-90" /></button>
                            <button className="p-1 text-slate-400 hover:text-slate-600"><ChevronDown size={16} className="-rotate-90" /></button>
                        </div>
                    </div>
                    
                    {/* Card Content (List or Empty State) */}
                    <div className="flex-1 bg-white relative">
                         {/* We pass the setShowScheduleModal to the list so the empty state button works */}
                         <ScheduledList 
                            refreshTrigger={refreshSchedule}
                            onEditClick={handleEditMeeting}
                            onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                            onOpenSchedule={() => setShowScheduleModal(true)} 
                        />
                    </div>
                    
                    {/* Card Footer (Optional, mimic the dots/plus in your image) */}
                    <div className="px-3 py-2 border-t border-slate-100 flex justify-between items-center">
                         <button className="p-1 text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
                         <button onClick={() => setShowScheduleModal(true)} className="p-1 text-slate-400 hover:text-slate-600"><Plus size={16} /></button>
                    </div>
                </div>

            </main>

            {/* --- MODALS (Unchanged logic, kept for functionality) --- */}
            {showJoinInputModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-800">Join Meeting</h3><button onClick={() => setShowJoinInputModal(false)}><X size={20} className="text-slate-500"/></button></div>
                        <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mb-3 outline-none focus:border-blue-500" placeholder="Meeting ID" value={meetingCode} onChange={e=>setMeetingCode(e.target.value)} autoFocus/>
                        <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mb-4 outline-none focus:border-blue-500" placeholder="Passcode (Optional)" value={passcode} onChange={e=>setPasscode(e.target.value)} />
                        <button onClick={handleJoinVideoCall} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-colors">Join</button>
                    </div>
                </div>
            )}

            {showPreviewModal && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-bold">Video Preview</h2>
                        <button onClick={stopPreviewCamera}><X size={24} /></button>
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-8 bg-slate-50">
                        <div className="w-full max-w-2xl aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg">
                            <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-cover -scale-x-100 ${!isVideoOn && 'hidden'}`}></video>
                            {!isVideoOn && <div className="absolute inset-0 flex items-center justify-center text-white">Camera Off</div>}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                                <button onClick={togglePreviewAudio} className={`p-3 rounded-full ${isAudioOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 text-white'}`}>{isAudioOn ? <Mic color="white"/>:<MicOff color="white"/>}</button>
                                <button onClick={togglePreviewVideo} className={`p-3 rounded-full ${isVideoOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 text-white'}`}>{isVideoOn ? <Video color="white"/>:<VideoOff color="white"/>}</button>
                            </div>
                        </div>
                        <div className="w-full max-w-sm space-y-4">
                             <div className="text-center mb-4"><h3 className="font-bold text-lg">Ready to join?</h3></div>
                             <input className="w-full border p-3 rounded-lg" value={participantName} onChange={e=>setParticipantName(e.target.value)} placeholder="Display Name" />
                             {!isJoining && <input className="w-full border p-3 rounded-lg" value={passcode} onChange={e=>setPasscode(e.target.value)} placeholder="Passcode (Optional)" />}
                             <button onClick={startMeeting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">Join Meeting</button>
                        </div>
                    </div>
                </div>
            )}

            <ScheduleModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} onSuccess={() => setRefreshSchedule(p => p + 1)} meetingToEdit={meetingToEdit} />
        </div>
    );
}

export default HomeComponent;