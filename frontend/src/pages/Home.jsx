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
    Clock,
    LogOut,
    ChevronRight,
    Sparkles,
    CalendarDays
} from "lucide-react";

// --- CSS STYLES FOR ANIMATIONS ---
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
  .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .glass-panel {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
`;

// --- COMPONENTS ---

const Navbar = ({ navigate, handleLogout, userInitial }) => {
    return (
        <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/20 px-6 py-4 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div 
                    className="flex items-center gap-3 cursor-pointer group" 
                    onClick={() => navigate("/home")}
                >
                    <img
                        src={brandLogo}
                        alt="Conferra"
                        className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="font-bold text-xl tracking-tight text-slate-800 hidden sm:block">Conferra</span>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate("/history")} 
                        className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                        title="Meeting History"
                    >
                        <Clock size={22} strokeWidth={1.5} />
                    </button>
                    
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-3 pl-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-200 ring-2 ring-white">
                            {userInitial}
                        </div>
                        <button 
                            onClick={handleLogout} 
                            className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors duration-200"
                            title="Logout"
                        >
                            <LogOut size={20} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const ActionCard = ({ icon: Icon, title, desc, gradient, onClick, delay }) => (
    <button
        onClick={onClick}
        style={{ animationDelay: `${delay}ms` }}
        className="animate-fade-in-up opacity-0 relative flex flex-col items-start p-6 rounded-[2rem] w-full text-left overflow-hidden group bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
    >
        {/* Subtle background glow on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}></div>
        
        <div className={`p-3.5 rounded-2xl mb-4 text-white bg-gradient-to-br ${gradient} shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
            <Icon size={28} strokeWidth={1.5} />
        </div>
        
        <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
        
        <div className="mt-auto pt-6 flex items-center text-sm font-bold opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>Proceed</span>
            <ChevronRight size={16} className="ml-1 text-slate-400" />
        </div>
    </button>
);

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    const [date, setDate] = useState(new Date());
    const [greeting, setGreeting] = useState("");
    
    // Modals
    const [showJoinInputModal, setShowJoinInputModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    
    // Data & Logic
    const [refreshSchedule, setRefreshSchedule] = useState(0);
    const [meetingToEdit, setMeetingToEdit] = useState(null);
    const [meetingCode, setMeetingCode] = useState("");
    const [passcode, setPasscode] = useState(""); 
    const [generatedMeetingId, setGeneratedMeetingId] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [participantName, setParticipantName] = useState("");
    const localVideoRef = useRef(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);

    // --- EFFECTS ---
    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 1000);
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (userData?.name) setParticipantName(userData.name);
    }, [userData]);

    // --- HANDLERS ---
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/auth");
    };

    const handleNewMeeting = () => {
        setIsJoining(false);
        setPasscode("");
        const randomId = Math.floor(100000000 + Math.random() * 900000000).toString();
        const formattedId = `${randomId.substring(0, 3)}-${randomId.substring(3, 6)}-${randomId.substring(6, 9)}`;
        setGeneratedMeetingId(formattedId);
        setShowPreviewModal(true);
        startPreviewCamera();
    };

    const handleJoinVideoCall = () => {
        if (meetingCode.trim() === "") return;
        setShowJoinInputModal(false);
        setIsJoining(true);
        setGeneratedMeetingId(meetingCode);
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

    const formatDate = (date) => date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    const formatTime = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-100 overflow-hidden">
            <style>{styles}</style>
            
            {/* Background Aesthetics (Zero lag CSS) */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-400/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-400/10 rounded-full blur-[100px]"></div>
            </div>

            <Navbar 
                navigate={navigate} 
                handleLogout={handleLogout} 
                userInitial={userData?.name ? userData.name.charAt(0).toUpperCase() : "U"} 
            />

            <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-80px)]">
                
                {/* LEFT SECTION: Hero & Actions */}
                <div className="flex-1 flex flex-col justify-center animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    
                    {/* Hero Text */}
                    <div className="mb-10 pl-2">
                        <div className="flex items-center gap-2 mb-3 text-blue-600 font-semibold bg-blue-50 w-fit px-3 py-1 rounded-full text-sm">
                            <Sparkles size={16} />
                            <span>{greeting}, {userData?.name?.split(" ")[0] || "User"}</span>
                        </div>
                        <h1 className="text-6xl sm:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-4">
                           {formatTime(date).split(" ")[0]}
                           <span className="text-2xl sm:text-3xl text-slate-400 font-normal ml-3">{formatTime(date).split(" ")[1]}</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium flex items-center gap-2">
                           <CalendarDays size={20} className="text-blue-500"/> {formatDate(date)}
                        </p>
                    </div>

                    {/* Action Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ActionCard 
                            icon={Video} 
                            title="New Meeting" 
                            desc="Start an instant meeting" 
                            gradient="from-orange-400 to-rose-500"
                            onClick={handleNewMeeting}
                            delay={100}
                        />
                        <ActionCard 
                            icon={Plus} 
                            title="Join Meeting" 
                            desc="Enter via meeting code" 
                            gradient="from-blue-500 to-indigo-600"
                            onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }}
                            delay={200}
                        />
                        <ActionCard 
                            icon={Calendar} 
                            title="Schedule" 
                            desc="Plan for upcoming events" 
                            gradient="from-emerald-400 to-teal-500"
                            onClick={() => setShowScheduleModal(true)}
                            delay={300}
                        />
                        <ActionCard 
                            icon={ScreenShare} 
                            title="Screen Share" 
                            desc="Share your screen only" 
                            gradient="from-violet-500 to-purple-600"
                            onClick={() => {}} 
                            delay={400}
                        />
                    </div>
                </div>

                {/* RIGHT SECTION: Floating Schedule Panel */}
                <div className="w-full lg:w-[420px] h-full py-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="glass-panel rounded-[2rem] h-full min-h-[500px] flex flex-col overflow-hidden shadow-2xl shadow-slate-200/50">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-white/40 flex items-center justify-between backdrop-blur-md">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Your Schedule</h2>
                                <p className="text-sm text-slate-500 mt-1">Today's Timeline</p>
                            </div>
                            <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600">
                                <Calendar size={20} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white/30">
                            <ScheduledList 
                                refreshTrigger={refreshSchedule}
                                onEditClick={(m) => { setMeetingToEdit(m); setShowScheduleModal(true); }}
                                onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                            />
                        </div>
                        
                        <div className="p-4 bg-white/60 border-t border-slate-100/50 backdrop-blur-sm">
                             <button className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-500 hover:text-blue-600 hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm hover:shadow">
                                View Full Calendar
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                             </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- JOIN MODAL --- */}
            {showJoinInputModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in bg-slate-900/20 backdrop-blur-sm p-4">
                    <div 
                        className="glass-panel bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white/60 animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Join Meeting</h3>
                            <button onClick={() => setShowJoinInputModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Enter Meeting ID" 
                                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-5 py-4 outline-none transition-all font-mono text-lg"
                                value={meetingCode} 
                                onChange={(e) => setMeetingCode(e.target.value)} 
                                autoFocus 
                            />
                            <input 
                                type="text" 
                                placeholder="Passcode (Optional)" 
                                className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-5 py-4 outline-none transition-all"
                                value={passcode} 
                                onChange={(e) => setPasscode(e.target.value)} 
                            />
                            <button 
                                onClick={handleJoinVideoCall} 
                                disabled={!meetingCode.trim()} 
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${meetingCode.trim() ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30" : "bg-slate-300 cursor-not-allowed"}`}
                            >
                                Join Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PREVIEW MODAL --- */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-5xl bg-neutral-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/10 animate-scale-in">
                        {/* Video Preview */}
                        <div className="flex-1 relative bg-black aspect-video md:aspect-auto min-h-[400px] flex items-center justify-center group">
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                muted 
                                className={`w-full h-full object-cover -scale-x-100 ${!isVideoOn ? "hidden" : ""}`}
                            ></video>
                            
                            {!isVideoOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/90">
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-blue-500/20 border-4 border-neutral-800">
                                        {participantName ? participantName.charAt(0).toUpperCase() : "U"}
                                    </div>
                                </div>
                            )}
                            
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                                <button 
                                    onClick={togglePreviewAudio} 
                                    className={`p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${isAudioOn ? "bg-white text-black" : "bg-rose-500 text-white shadow-lg shadow-rose-500/40"}`}
                                >
                                    {isAudioOn ? <Mic size={22} /> : <MicOff size={22} />}
                                </button>
                                <button 
                                    onClick={togglePreviewVideo} 
                                    className={`p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${isVideoOn ? "bg-white text-black" : "bg-rose-500 text-white shadow-lg shadow-rose-500/40"}`}
                                >
                                    {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
                                </button>
                            </div>
                            
                            <button onClick={stopPreviewCamera} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <X size={24}/>
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="w-full md:w-[380px] bg-white p-8 md:p-10 flex flex-col justify-center">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready?</h2>
                            <p className="text-slate-500 mb-8">Setup your audio and video before joining.</p>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={participantName} 
                                        onChange={(e) => setParticipantName(e.target.value)} 
                                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3 outline-none transition-all font-medium text-lg"
                                        placeholder="Your Name"
                                    />
                                </div>
                                
                                {!isJoining && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passcode</label>
                                        <input 
                                            type="text" 
                                            value={passcode} 
                                            onChange={(e) => setPasscode(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3 outline-none transition-all font-medium text-lg"
                                            placeholder="Optional"
                                        />
                                    </div>
                                )}

                                <button 
                                    onClick={startMeeting} 
                                    disabled={!participantName.trim()}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-1 active:scale-[0.98]"
                                >
                                    {isJoining ? "Join Meeting" : "Start Meeting"}
                                </button>
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