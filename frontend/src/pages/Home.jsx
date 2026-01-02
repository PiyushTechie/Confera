import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar1"; 
import ScheduleModal from "../components/ScheduleModal";
import ScheduledList from "../components/ScheduledList";
import {
    Video, Plus, Calendar, ScreenShare, Mic, MicOff, VideoOff,
    X, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight
} from "lucide-react";

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
    
    // --- DATE & CALENDAR STATE ---
    const [selectedDate, setSelectedDate] = useState(new Date());
    const dateInputRef = useRef(null); // Ref for the hidden date picker

    const [showJoinInputModal, setShowJoinInputModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [refreshSchedule, setRefreshSchedule] = useState(0);
    const [meetingToEdit, setMeetingToEdit] = useState(null);

    const [meetingCode, setMeetingCode] = useState("");
    const [passcode, setPasscode] = useState(""); 
    
    // Preview State
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [generatedMeetingId, setGeneratedMeetingId] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [participantName, setParticipantName] = useState("");
    
    const localVideoRef = useRef(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);

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

    const handleEditMeeting = (meeting) => { setMeetingToEdit(meeting); setShowScheduleModal(true); };
    const handleNewMeeting = () => { setIsJoining(false); setPasscode(""); const id = Math.floor(100000000 + Math.random() * 900000000).toString(); setGeneratedMeetingId(`${id.substring(0,3)}-${id.substring(3,6)}-${id.substring(6,9)}`); setParticipantName(currentUser?.name || ""); setShowPreviewModal(true); startPreviewCamera(); };
    const handleJoinVideoCall = () => { if (!meetingCode.trim()) return; setShowJoinInputModal(false); setIsJoining(true); setGeneratedMeetingId(meetingCode); setParticipantName(currentUser?.name || ""); setShowPreviewModal(true); startPreviewCamera(); };
    
    // Date Handlers
    const handlePrevDay = () => { const prev = new Date(selectedDate); prev.setDate(prev.getDate() - 1); setSelectedDate(prev); };
    const handleNextDay = () => { const next = new Date(selectedDate); next.setDate(next.getDate() + 1); setSelectedDate(next); };
    const handleToday = () => { setSelectedDate(new Date()); };
    
    const handleDateChange = (e) => {
        if(e.target.value) {
            setSelectedDate(new Date(e.target.value));
        }
    };

    const getFormattedDateDisplay = () => {
        const today = new Date();
        // Check if selectedDate matches today
        const isToday = selectedDate.toDateString() === today.toDateString();
        
        if (isToday) {
            return `Today, ${selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
        }
        return selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Camera Logic
    const startPreviewCamera = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); if(localVideoRef.current) localVideoRef.current.srcObject = stream; window.previewStream = stream; } catch(e) { console.error(e); setIsVideoOn(false); } };
    const stopPreviewCamera = () => { if(window.previewStream) window.previewStream.getTracks().forEach(t => t.stop()); setShowPreviewModal(false); };
    const startMeeting = async () => { stopPreviewCamera(); await addToUserHistory(generatedMeetingId); navigate(`/meeting/${generatedMeetingId}`, { state: { bypassLobby: true, isAudioOn, isVideoOn, username: participantName.trim() || "User", isHost: !isJoining, passcode } }); };
    const togglePreviewVideo = () => { setIsVideoOn(!isVideoOn); if(window.previewStream) window.previewStream.getVideoTracks()[0].enabled = !isVideoOn; };
    const togglePreviewAudio = () => { setIsAudioOn(!isAudioOn); if(window.previewStream) window.previewStream.getAudioTracks()[0].enabled = !isAudioOn; };

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // Helper to format date for input value (YYYY-MM-DD)
    const dateInputValue = selectedDate.toISOString().split('T')[0];

    return (
        <div className="min-h-screen w-full bg-white flex flex-col font-sans text-slate-800">
            {/* --- REUSABLE NAVBAR --- */}
            <Navbar user={currentUser} handleLogout={handleLogout} />

            {/* --- MAIN CONTENT (Split Layout) --- */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 sm:py-12">
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-4">
                    
                    {/* --- LEFT COLUMN: Clock & Options --- */}
                    <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start space-y-12 pt-4">
                        
                        {/* 1. Clock Section */}
                        <div className="text-center lg:text-left">
                            <h1 className="text-6xl sm:text-8xl font-bold text-slate-900 tracking-tight mb-2 font-mono">
                                {formattedTime}
                            </h1>
                            <p className="text-slate-500 text-xl sm:text-2xl font-medium">
                                {formattedDate}
                            </p>
                        </div>

                        {/* 2. Icon Row */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-8 sm:gap-10">
                            <ActionButton icon={Video} label="New meeting" color="orange" hasDropdown={true} onClick={handleNewMeeting} />
                            <ActionButton icon={Plus} label="Join" color="blue" onClick={() => { setMeetingCode(""); setPasscode(""); setShowJoinInputModal(true); }} />
                            <ActionButton icon={Calendar} label="Schedule" color="blue" onClick={() => setShowScheduleModal(true)} />
                            <ActionButton icon={ScreenShare} label="Share screen" color="blue" onClick={() => {}} />
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: Schedule Card --- */}
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                        <div className="w-full max-w-[500px] bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-[450px]">
                            
                            {/* Card Header */}
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                {/* Date Picker Trigger */}
                                <div className="relative group">
                                    <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-200/50 px-3 py-1.5 rounded-lg transition-colors">
                                        <h3 className="text-sm font-bold text-slate-700">{getFormattedDateDisplay()}</h3>
                                        <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
                                    </div>
                                    {/* Invisible Date Input that covers the text */}
                                    <input 
                                        type="date" 
                                        ref={dateInputRef}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        value={dateInputValue}
                                        onChange={handleDateChange}
                                    />
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                    <button onClick={handleToday} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md transition-colors">Today</button>
                                    <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
                                    <button onClick={handlePrevDay} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"><ChevronLeft size={14} /></button>
                                    <button onClick={handleNextDay} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"><ChevronRight size={14} /></button>
                                </div>
                            </div>
                            
                            {/* Schedule List */}
                            <div className="flex-1 bg-white relative">
                                <ScheduledList 
                                    refreshTrigger={refreshSchedule}
                                    onEditClick={handleEditMeeting}
                                    onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                                    onOpenSchedule={() => setShowScheduleModal(true)} 
                                    filterDate={selectedDate}
                                />
                            </div>
                            
                            {/* Card Footer */}
                            <div className="px-4 py-2.5 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"><MoreHorizontal size={18} /></button>
                                <button onClick={() => setShowScheduleModal(true)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"><Plus size={18} /></button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* --- MODALS (Unchanged) --- */}
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
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800">Video Preview</h2>
                        <button onClick={stopPreviewCamera} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-600"/></button>
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-12 bg-white">
                        <div className="relative w-full max-w-[640px] aspect-video bg-[#202124] rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                            <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-cover -scale-x-100 ${!isVideoOn && 'hidden'}`}></video>
                            {!isVideoOn && <div className="absolute inset-0 flex flex-col items-center justify-center text-white"><div className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center text-4xl font-bold mb-4">{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}</div><p className="text-lg font-medium">Camera is off</p></div>}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                                <button onClick={togglePreviewAudio} className={`p-3.5 rounded-full transition-all duration-200 ${isAudioOn ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md' : 'bg-red-500 hover:bg-red-600 text-white'}`}>{isAudioOn ? <Mic size={20}/> : <MicOff size={20}/>}</button>
                                <button onClick={togglePreviewVideo} className={`p-3.5 rounded-full transition-all duration-200 ${isVideoOn ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md' : 'bg-red-500 hover:bg-red-600 text-white'}`}>{isVideoOn ? <Video size={20}/> : <VideoOff size={20}/>}</button>
                            </div>
                        </div>
                        <div className="w-full max-w-[400px] flex flex-col">
                             <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Ready to join?</h3>
                             <div className="space-y-4 w-full">
                                <input className="w-full bg-white border border-gray-300 p-3.5 rounded-lg text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" value={participantName} onChange={e=>setParticipantName(e.target.value)} placeholder="Display Name" />
                                {!isJoining && <input className="w-full bg-white border border-gray-300 p-3.5 rounded-lg text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" value={passcode} onChange={e=>setPasscode(e.target.value)} placeholder="Passcode (Optional)" />}
                             </div>
                             <div className="mt-8 flex justify-center w-full">
                                 <button onClick={startMeeting} disabled={!participantName.trim()} className="w-full bg-[#4285F4] hover:bg-[#3367d6] text-white py-3.5 rounded-lg font-bold text-base shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Join Meeting</button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            <ScheduleModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} onSuccess={() => setRefreshSchedule(p => p + 1)} meetingToEdit={meetingToEdit} />
        </div>
    );
}

export default HomeComponent;