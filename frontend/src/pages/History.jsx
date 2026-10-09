import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { History as HistoryIcon, Loader2, Video, Calendar, Clock, Copy, Check, ArrowRight, Activity, Users } from "lucide-react";

function History() {
    const navigate = useNavigate();
    const { getHistoryOfUser, userData } = useContext(AuthContext);
    
    const [currentUser, setCurrentUser] = useState(() => {
        if (userData) return userData;
        try {
            const stored = localStorage.getItem("userData");
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    });

    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => { if (userData) setCurrentUser(userData); }, [userData]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/auth");
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                if (Array.isArray(history)) setMeetings([...history].reverse());
                else setMeetings([]);
            } catch (e) { console.error(e); setMeetings([]); } 
            finally { setIsLoading(false); }
        };
        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
        } catch (e) { return { day: "Invalid", time: "--:--" }; }
    };

    const handleCopy = (code) => { 
        navigator.clipboard.writeText(code); 
        setCopiedId(code); 
        setTimeout(() => setCopiedId(null), 2000); 
    };

    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                </div>
                <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Loading History</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800 relative overflow-hidden flex flex-col pt-24">
            {/* Subtle Animated Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>

            <Navbar user={currentUser} handleLogout={handleLogout} />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
                
                {/* Header Section */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent -z-10 rounded-bl-full opacity-50"></div>
                    
                    <div className="flex items-start gap-5">
                        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-white shrink-0 transform -rotate-3">
                             <HistoryIcon size={32} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight font-heading mb-2">Meeting History</h2>
                            <p className="text-slate-500 font-medium text-lg max-w-lg">Review your past sessions, grab meeting codes, and jump back into collaboration.</p>
                        </div>
                    </div>
                    
                    {meetings.length > 0 && (
                        <div className="inline-flex items-center gap-3 px-6 py-4 bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-inner">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-widest text-slate-400 mb-0.5">Total Sessions</span>
                                <div className="flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-500" />
                                    <span className="text-2xl text-slate-900 leading-none">{meetings.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 max-w-3xl mx-auto relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white -z-10"></div>
                        
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                            <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center border border-slate-100 shadow-xl shadow-indigo-500/10 relative z-10 transform group-hover:-translate-y-2 transition-transform duration-500">
                                <Video size={48} className="text-indigo-500" strokeWidth={1.5} />
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center border-4 border-white z-20 shadow-md">
                                <Users size={20} className="text-purple-600" />
                            </div>
                        </div>
                        
                        <h3 className="text-3xl font-bold text-slate-900 mb-4 font-heading tracking-tight">Your history is a blank canvas</h3>
                        <p className="text-slate-500 max-w-md text-lg leading-relaxed mb-10">Once you host or join video calls, your complete meeting log will appear here automatically.</p>
                        
                        <button 
                            onClick={() => navigate("/home")} 
                            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 group/btn"
                        >
                            Start a Meeting
                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ) : (
                    /* Grid Layout */
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {meetings.map((meeting, index) => {
                            const { day, time } = formatDate(meeting.date);
                            const isCopied = copiedId === meeting.meetingCode;
                            
                            return (
                                <div key={index} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 group flex flex-col overflow-hidden">
                                    
                                    {/* Card Header (Date & Time) */}
                                    <div className="p-6 pb-5 border-b border-slate-100 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                <Calendar size={14} />
                                                <span>{day}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                <Clock size={14} className="text-slate-400" />
                                                <span>{time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body (Meeting Code) */}
                                    <div className="p-6 flex-grow flex flex-col justify-center relative">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Meeting Code</div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="text-2xl font-mono font-bold text-slate-800 tracking-tight select-all">
                                                {meeting.meetingCode}
                                            </div>
                                            <button 
                                                onClick={() => handleCopy(meeting.meetingCode)} 
                                                className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer ${
                                                    isCopied 
                                                    ? "bg-green-100 text-green-600 shadow-inner" 
                                                    : "bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white hover:shadow-md hover:shadow-indigo-500/30"
                                                }`}
                                                title="Copy Code"
                                            >
                                                {isCopied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

export default History;