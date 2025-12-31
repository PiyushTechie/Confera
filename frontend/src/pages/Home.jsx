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
    MoreHorizontal,
    ChevronDown
} from "lucide-react";

// --- NAVBAR COMPONENT ---
const Navbar = ({ navigate, handleLogout }) => {
    return (
        <nav className="sticky top-0 z-40 w-full bg-white px-4 sm:px-6 py-3 shadow-sm border-b border-slate-100">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
                     {/* Placeholder for logo if image fails, or use img tag */}
                    <img
                        src={brandLogo}
                        alt="Conferra"
                        className="h-8 md:h-10 w-auto object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate("/history")} 
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="History"
                    >
                        <Clock size={20} />
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                    {/* User Avatar Placeholder */}
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm ml-2">
                        U
                    </div>
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

    // --- HANDLERS ---
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

    // --- MEETING LOGIC ---
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

    // --- DATE FORMATTING ---
    const formatTime = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const formatDate = (date) => date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

    // --- BUTTON COMPONENT (Zoom Style) ---
    const ActionButton = ({ icon: Icon, color, label, onClick }) => (
        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onClick}>
            <div className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 transform group-hover:-translate-y-1 group-hover:shadow-md
                ${color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}
            `}>
                <Icon size={32} className="text-white" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{label}</span>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-white flex flex-col font-sans text-slate-800">
            <Navbar navigate={navigate} handleLogout={handleLogout} />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-8">
                
                {/* LEFT SECTION: Time & Actions */}
                <div className="flex-1 flex flex-col items-center pt-8 md:pt-16">
                    {/* Time Display */}
                    <div className="text-center mb-12">
                        <h1 className="text-6xl sm:text-7xl font-bold text-slate-900 tracking-tight leading-none mb-2">
                            {formatTime(date)}
                        </h1>
                        <p className="text-slate-500 text-lg font-medium">
                            {formatDate(date)}
                        </p>
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-12">
                        <ActionButton 
                            icon={Video} 
                            color="orange" 
                            label="New Meeting" 
                            onClick={handleNewMeeting} 
                        />
                        <ActionButton 
                            icon={Plus} 
                            color="blue" 
                            label="Join" 
                            onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }} 
                        />
                        <ActionButton 
                            icon={Calendar} 
                            color="blue" 
                            label="Schedule" 
                            onClick={() => setShowScheduleModal(true)} 
                        />
                        <ActionButton 
                            icon={ScreenShare} 
                            color="blue" 
                            label="Share Screen" 
                            onClick={() => {}} // Placeholder
                        />
                    </div>
                </div>

                {/* RIGHT SECTION: Scheduled List (The "Today" Card) */}
                <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden min-h-[400px]">
                        {/* Card Header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-slate-700">Today</h2>
                                <span className="text-slate-400 text-sm font-normal">
                                    {new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <ChevronDown size={18} />
                            </button>
                        </div>

                        {/* Card Body: The List */}
                        <div className="flex-1 p-2 overflow-y-auto bg-slate-50/30">
                            <ScheduledList 
                                refreshTrigger={refreshSchedule}
                                onEditClick={handleEditMeeting}
                                onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                            />
                        </div>
                        
                        {/* Helper Footer (Optional, like Zoom's 'View all') */}
                        <div className="p-3 text-center border-t border-slate-100">
                             <button className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors">
                                View all meetings
                             </button>
                        </div>
                    </div>
                </div>

            </main>

            {/* --- JOIN MODAL --- */}
            {showJoinInputModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Join Meeting</h3>
                            <button onClick={() => setShowJoinInputModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Meeting ID" 
                                className="w-full bg-slate-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-all"
                                value={meetingCode} 
                                onChange={(e) => setMeetingCode(e.target.value)} 
                                autoFocus 
                            />
                            <input 
                                type="text" 
                                placeholder="Passcode (Optional)" 
                                className="w-full bg-slate-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-all"
                                value={passcode} 
                                onChange={(e) => setPasscode(e.target.value)} 
                            />
                            <button 
                                onClick={handleJoinVideoCall} 
                                disabled={!meetingCode.trim()} 
                                className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${meetingCode.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"}`}
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PREVIEW MODAL (Kept same logic, slightly cleaned UI) --- */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-neutral-800">
                        {/* Video Area */}
                        <div className="flex-1 relative bg-black aspect-video md:aspect-auto min-h-[300px]">
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                muted 
                                className={`w-full h-full object-cover -scale-x-100 ${!isVideoOn ? "hidden" : ""}`}
                            ></video>
                            {!isVideoOn && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center text-white text-3xl font-bold">
                                        {participantName ? participantName.charAt(0).toUpperCase() : "U"}
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                                <button onClick={togglePreviewAudio} className={`p-4 rounded-full ${isAudioOn ? "bg-white text-black" : "bg-red-600 text-white"}`}>
                                    {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
                                </button>
                                <button onClick={togglePreviewVideo} className={`p-4 rounded-full ${isVideoOn ? "bg-white text-black" : "bg-red-600 text-white"}`}>
                                    {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                                </button>
                            </div>
                            <button onClick={stopPreviewCamera} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={24}/></button>
                        </div>

                        {/* Controls Area */}
                        <div className="w-full md:w-80 bg-white p-8 flex flex-col justify-center gap-6">
                            <h2 className="text-xl font-bold">{isJoining ? "Join Meeting" : "Start Meeting"}</h2>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase">Display Name</label>
                                <input 
                                    type="text" 
                                    value={participantName} 
                                    onChange={(e) => setParticipantName(e.target.value)} 
                                    className="w-full border-b-2 border-slate-200 focus:border-blue-600 py-2 outline-none font-medium text-lg bg-transparent"
                                    placeholder="Your Name"
                                />
                            </div>
                            
                            {!isJoining && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Passcode</label>
                                    <input 
                                        type="text" 
                                        value={passcode} 
                                        onChange={(e) => setPasscode(e.target.value)} 
                                        className="w-full border-b-2 border-slate-200 focus:border-blue-600 py-2 outline-none font-medium text-lg bg-transparent"
                                        placeholder="Optional"
                                    />
                                </div>
                            )}

                            <button 
                                onClick={startMeeting} 
                                disabled={!participantName.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isJoining ? "Join" : "Start"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SCHEDULE MODAL (Rendered Hidden or Visible based on state) --- */}
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