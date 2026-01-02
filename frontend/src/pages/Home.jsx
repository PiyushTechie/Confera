import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import brandLogo from "../assets/BrandLogo.png";
import ScheduleModal from "../components/ScheduleModal";
import ScheduledList from "../components/ScheduledList";
import {
    Video, Plus, Calendar, ScreenShare, Mic, MicOff, VideoOff,
    X, User, LogOut, Lock, ChevronDown, Settings, Clock, MoreHorizontal, ChevronLeft, ChevronRight
} from "lucide-react";

// --- PROFILE MENU ---
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
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-sm">
                    {getInitials(displayName)}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-800">{displayName}</p>
                        <p className="text-xs text-slate-500">@{displayUsername}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

// --- ACTION BUTTON ---
const ActionButton = ({ icon: Icon, label, color, onClick, hasDropdown }) => (
    <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onClick}>
        <button 
            className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-white shadow-md transition-all duration-200 group-hover:scale-105 active:scale-95 ${color === 'orange' ? 'bg-[#F97316] hover:bg-[#ea580c] shadow-orange-200' : 'bg-[#0E71EB] hover:bg-[#0256b1] shadow-blue-200'}`}
        >
            <Icon size={36} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
            {hasDropdown && <ChevronDown size={14} className="text-slate-400" />}
        </div>
    </div>
);

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    const [currentUser, setCurrentUser] = useState(() => {
        if (userData) return userData;
        try {
            const stored = localStorage.getItem("userData");
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    });

    useEffect(() => { if (userData) setCurrentUser(userData); }, [userData]);

    const [currentTime, setCurrentTime] = useState(new Date());
    
    // --- DATE NAVIGATION STATE ---
    const [selectedDate, setSelectedDate] = useState(new Date());

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

    // --- DATE HANDLERS ---
    const handlePrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    // Format for display (e.g., "Today, Jan 2")
    const getFormattedDateDisplay = () => {
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();
        const dateString = selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        
        if (isToday) return `Today, ${dateString}`;
        
        // Check for Yesterday/Tomorrow
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        if (selectedDate.toDateString() === yesterday.toDateString()) return `Yesterday, ${dateString}`;
        
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        if (selectedDate.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${dateString}`;

        return selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // ... (Keep existing handlers: handleLogout, handleEditMeeting, startMeeting, etc.) ...
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

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="min-h-screen w-full bg-white flex flex-col font-sans text-slate-800">
            {/* --- NAVBAR --- */}
            <nav className="w-full px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer ml-4" onClick={() => navigate("/home")}>
                    <img src={brandLogo} alt="Logo" className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105" /> 
                </div>
                <div className="flex items-center gap-5 mr-4">
                    <button onClick={() => navigate("/history")} className="text-slate-500 hover:text-slate-900 transition-colors bg-slate-50 p-2.5 rounded-xl" title="History">
                        <Clock size={22} />
                    </button>
                    <ProfileMenu user={currentUser} handleLogout={handleLogout} />
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto px-4 pt-6 sm:pt-10">
                
                {/* 1. CLOCK SECTION */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl sm:text-7xl font-bold text-slate-900 tracking-tight mb-2 font-mono">
                        {formattedTime}
                    </h1>
                    <p className="text-slate-500 text-xl font-medium">
                        {formattedDate}
                    </p>
                </div>

                {/* 2. ICON ROW */}
                <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mb-16 w-full">
                    <ActionButton icon={Video} label="New meeting" color="orange" hasDropdown={true} onClick={handleNewMeeting} />
                    <ActionButton icon={Plus} label="Join" color="blue" onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }} />
                    <ActionButton icon={Calendar} label="Schedule" color="blue" onClick={() => setShowScheduleModal(true)} />
                    <ActionButton icon={ScreenShare} label="Share screen" color="blue" onClick={() => {}} />
                </div>

                {/* 3. SCHEDULE CARD */}
                <div className="w-full max-w-[550px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[420px]">
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-700">{getFormattedDateDisplay()}</h3>
                            <ChevronDown size={14} className="text-slate-400 cursor-pointer" />
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                            <button onClick={handleToday} className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors">Today</button>
                            <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
                            <button onClick={handlePrevDay} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"><ChevronLeft size={14} /></button>
                            <button onClick={handleNextDay} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                    
                    {/* List Content */}
                    <div className="flex-1 bg-white relative">
                         <ScheduledList 
                            refreshTrigger={refreshSchedule}
                            onEditClick={handleEditMeeting}
                            onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                            onOpenSchedule={() => setShowScheduleModal(true)} 
                            filterDate={selectedDate} // Pass date filter
                        />
                    </div>
                    
                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                         <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal size={18} /></button>
                         <button onClick={() => setShowScheduleModal(true)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Plus size={18} /></button>
                    </div>
                </div>

            </main>

            {/* --- MODALS --- */}
            {showJoinInputModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-5"><h3 className="font-bold text-xl text-slate-800">Join Meeting</h3><button onClick={() => setShowJoinInputModal(false)} className="p-1 rounded-full hover:bg-slate-100"><X size={20} className="text-slate-500"/></button></div>
                        <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-3 outline-none focus:border-blue-500 font-medium text-slate-800" placeholder="Meeting ID" value={meetingCode} onChange={e=>setMeetingCode(e.target.value)} autoFocus/>
                        <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-5 outline-none focus:border-blue-500 font-medium text-slate-800" placeholder="Passcode (Optional)" value={passcode} onChange={e=>setPasscode(e.target.value)} />
                        <button onClick={handleJoinVideoCall} disabled={!meetingCode} className="w-full bg-[#0E71EB] hover:bg-[#0256b1] text-white p-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">Join</button>
                    </div>
                </div>
            )}

            {showPreviewModal && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
                    <div className="flex justify-between items-center px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-slate-800">Video Preview</h2>
                        <button onClick={stopPreviewCamera} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-10 bg-slate-50">
                        <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-slate-200">
                            <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-cover -scale-x-100 ${!isVideoOn && 'hidden'}`}></video>
                            {!isVideoOn && <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-medium">Camera Off</div>}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                                <button onClick={togglePreviewAudio} className={`p-4 rounded-full transition-all ${isAudioOn ? 'bg-white/20 hover:bg-white/30 border border-white/20 backdrop-blur-md' : 'bg-rose-500 text-white border-rose-500'}`}>{isAudioOn ? <Mic color="white" size={24}/>:<MicOff color="white" size={24}/>}</button>
                                <button onClick={togglePreviewVideo} className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-white/20 hover:bg-white/30 border border-white/20 backdrop-blur-md' : 'bg-rose-500 text-white border-rose-500'}`}>{isVideoOn ? <Video color="white" size={24}/>:<VideoOff color="white" size={24}/>}</button>
                            </div>
                        </div>
                        <div className="w-full max-w-sm space-y-6">
                             <div className="text-center mb-2"><h3 className="font-bold text-2xl text-slate-800">Ready to join?</h3></div>
                             <div className="space-y-4">
                                <input className="w-full bg-white border border-slate-300 p-4 rounded-xl font-medium text-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={participantName} onChange={e=>setParticipantName(e.target.value)} placeholder="Display Name" />
                                {!isJoining && <input className="w-full bg-white border border-slate-300 p-4 rounded-xl font-medium text-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={passcode} onChange={e=>setPasscode(e.target.value)} placeholder="Passcode (Optional)" />}
                             </div>
                             <button onClick={startMeeting} disabled={!participantName.trim()} className="w-full bg-[#0E71EB] hover:bg-[#0256b1] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Join Meeting</button>
                        </div>
                    </div>
                </div>
            )}

            <ScheduleModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} onSuccess={() => setRefreshSchedule(p => p + 1)} meetingToEdit={meetingToEdit} />
        </div>
    );
}

export default HomeComponent;