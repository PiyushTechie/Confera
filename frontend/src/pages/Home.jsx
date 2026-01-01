import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import brandLogo from "../assets/BrandLogo.png";
import ScheduleModal from "../components/ScheduleModal";
import ScheduledList from "../components/ScheduledList";
import {
    Video, Plus, Calendar, ScreenShare, Mic, MicOff, VideoOff,
    X, Copy, Check, User, LogOut, ArrowRight, Lock, ChevronDown, Settings, Clock
} from "lucide-react";

// --- PROFILE MENU COMPONENT (Unchanged) ---
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

    const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "U";

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-white/50 border border-transparent hover:border-indigo-100 transition-all"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                    {getInitials(user?.name)}
                </div>
                <div className="hidden md:flex flex-col items-start">
                    {/* Display Name or Fallback */}
                    <span className="text-sm font-bold text-slate-700 leading-none">
                        {user?.name || "User"} 
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                        @{user?.username || "username"}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

// --- ACTION CARD (Unchanged) ---
const ActionCard = ({ icon: Icon, title, desc, colorClass, onClick }) => (
    <button 
        onClick={onClick}
        className={`group relative flex flex-col items-start justify-between p-6 h-48 rounded-[2rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full text-left overflow-hidden ${colorClass}`}
    >
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10 p-3 bg-white/20 backdrop-blur-md rounded-2xl w-fit"><Icon size={28} className="text-white" /></div>
        <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-white/80 text-sm font-medium">{desc}</p>
        </div>
    </button>
);

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    // --- FIX: INSTANTLY READ LOCAL STORAGE ---
    // This lazy initializer runs only once on mount, preventing the "Guest" flash.
    const [currentUser, setCurrentUser] = useState(() => {
        if (userData) return userData;
        const stored = localStorage.getItem("userData");
        return stored ? JSON.parse(stored) : null;
    });

    // Keep state in sync if AuthContext updates later
    useEffect(() => {
        if (userData) setCurrentUser(userData);
    }, [userData]);

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
        if (window.previewStream) window.previewStream.getTracks().forEach((track) => track.stop());
        setShowPreviewModal(false);
    };

    const startMeeting = async () => {
        stopPreviewCamera();
        await addToUserHistory(generatedMeetingId);
        const finalName = participantName.trim() || "User";
        navigate(`/meeting/${generatedMeetingId}`, {
            state: { bypassLobby: true, isAudioOn, isVideoOn, username: finalName, isHost: !isJoining, passcode: passcode },
        });
    };

    const togglePreviewVideo = () => {
        setIsVideoOn(!isVideoOn);
        if (window.previewStream) {
            const track = window.previewStream.getVideoTracks()[0];
            if (track) track.enabled = !isVideoOn;
        }
    };

    const togglePreviewAudio = () => {
        setIsAudioOn(!isAudioOn);
        if (window.previewStream) {
            const track = window.previewStream.getAudioTracks()[0];
            if (track) track.enabled = !isAudioOn;
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

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col font-sans text-slate-800 selection:bg-indigo-100">
            <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
                        <img src={brandLogo} alt="Logo" className="h-10 w-auto object-contain" />
                        <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">Cenfora</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-sm font-bold text-slate-700">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-xs font-medium text-slate-400">{currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                        <button onClick={() => navigate("/history")} className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="History">
                            <Clock size={20} />
                        </button>
                        <ProfileMenu user={currentUser} handleLogout={handleLogout} />
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                        {getGreeting()}, <span className="text-indigo-600">{currentUser?.name?.split(' ')[0] || "User"}</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Ready to collaborate? Start a meeting or check your schedule.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ActionCard icon={Video} title="New Meeting" desc="Start an instant meeting" colorClass="bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-200" onClick={handleNewMeeting} />
                            <ActionCard icon={Plus} title="Join Meeting" desc="Connect via ID or link" colorClass="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-200" onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }} />
                            <ActionCard icon={Calendar} title="Schedule" desc="Plan for upcoming events" colorClass="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-200" onClick={() => setShowScheduleModal(true)} />
                            <ActionCard icon={ScreenShare} title="Share Screen" desc="Present without audio" colorClass="bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200" onClick={() => {}} />
                        </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col h-full">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex-1 min-h-[400px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar size={18} className="text-indigo-500"/> Today's Schedule
                                </h3>
                                <button onClick={() => setShowScheduleModal(true)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                    + Add
                                </button>
                            </div>
                            
                            {/* --- THE NEW SCHEDULED LIST IS USED HERE --- */}
                            <ScheduledList 
                                refreshTrigger={refreshSchedule}
                                onEditClick={handleEditMeeting}
                                onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* ... (Modals Logic remains same as previous code - omitted for brevity but include them here) ... */}
            {/* Make sure to keep the Modal rendering logic (JoinModal, PreviewModal, ScheduleModal) here */}
             {showJoinInputModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Join Meeting</h3><button onClick={() => setShowJoinInputModal(false)}><X size={20}/></button></div>
                        <input className="w-full bg-slate-50 border p-3 rounded-xl mb-3" placeholder="Meeting ID" value={meetingCode} onChange={e=>setMeetingCode(e.target.value)} autoFocus/>
                        <input className="w-full bg-slate-50 border p-3 rounded-xl mb-4" placeholder="Passcode (Optional)" value={passcode} onChange={e=>setPasscode(e.target.value)} />
                        <button onClick={handleJoinVideoCall} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold">Join Now</button>
                    </div>
                </div>
            )}

            {showPreviewModal && (
                 <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/90 flex items-center justify-center p-4">
                     <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col md:flex-row h-[500px]">
                         <div className="w-full md:w-2/3 bg-black relative">
                            <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-cover -scale-x-100 ${!isVideoOn && 'hidden'}`}></video>
                            {!isVideoOn && <div className="absolute inset-0 flex items-center justify-center text-white">Camera Off</div>}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                                <button onClick={togglePreviewAudio} className={`p-3 rounded-full ${isAudioOn ? 'bg-white/20' : 'bg-red-500 text-white'}`}>{isAudioOn ? <Mic/>:<MicOff/>}</button>
                                <button onClick={togglePreviewVideo} className={`p-3 rounded-full ${isVideoOn ? 'bg-white/20' : 'bg-red-500 text-white'}`}>{isVideoOn ? <Video/>:<VideoOff/>}</button>
                            </div>
                         </div>
                         <div className="w-full md:w-1/3 p-6 bg-white flex flex-col justify-center">
                             <h2 className="text-2xl font-bold mb-4">Ready to join?</h2>
                             <input className="w-full border p-3 rounded-xl mb-4 font-bold" value={participantName} onChange={e=>setParticipantName(e.target.value)} placeholder="Your Name" />
                             {!isJoining && <input className="w-full border p-3 rounded-xl mb-4" value={passcode} onChange={e=>setPasscode(e.target.value)} placeholder="Passcode (Optional)" />}
                             <button onClick={startMeeting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Start Meeting</button>
                             <button onClick={stopPreviewCamera} className="w-full mt-2 text-slate-500">Cancel</button>
                         </div>
                     </div>
                 </div>
            )}

            <ScheduleModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} onSuccess={() => setRefreshSchedule(p => p + 1)} meetingToEdit={meetingToEdit} />
        </div>
    );
}

export default HomeComponent;