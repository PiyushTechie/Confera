import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
// Import reusable Navbar
import Navbar from "../components/Navbar1"; 
import { History as HistoryIcon, Loader2, Video, Calendar, Clock, Copy, Check } from "lucide-react";

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

    // ... (Keep existing fetch logic and formatDate helper) ...
    // Note: Re-paste the fetch logic from your History.jsx here if needed, 
    // but the key change is using <Navbar /> below.

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
                day: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
                time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
        } catch (e) { return { day: "Invalid", time: "--:--" }; }
    };

    const handleCopy = (code) => { navigator.clipboard.writeText(code); setCopiedId(code); setTimeout(() => setCopiedId(null), 2000); };

    if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-800">
            {/* --- REUSABLE NAVBAR --- */}
            <Navbar user={currentUser} handleLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-indigo-600">
                             <HistoryIcon size={28} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Meeting History</h2>
                            <p className="text-slate-500 font-medium mt-1">Review your past sessions and calls.</p>
                        </div>
                    </div>
                    {meetings.length > 0 && (
                        <div className="inline-flex items-center px-4 py-2 bg-white text-indigo-700 text-sm font-bold rounded-xl border border-indigo-100 shadow-sm">
                            <span className="bg-indigo-50 px-2 py-0.5 rounded-md mr-2 text-indigo-800">{meetings.length}</span> Total Sessions
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-sm p-8 max-w-2xl mx-auto mt-8">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                            <Video size={36} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No meetings recorded yet</h3>
                        <p className="text-slate-500 max-w-md">Once you join or host calls, your activity history will appear here automatically.</p>
                        <button onClick={() => navigate("/home")} className="mt-6 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Start a Meeting</button>
                    </div>
                ) : (
                    /* Grid Layout */
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {meetings.map((meeting, index) => {
                            const { day, time } = formatDate(meeting.date);
                            return (
                                <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                                            <Calendar size={14} /><span>{day}</span>
                                        </div>
                                    </div>
                                    <div className="mb-8">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Meeting ID</div>
                                        <div className="text-xl font-mono font-bold text-slate-800 tracking-tight select-all">{meeting.meetingCode}</div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium"><Clock size={16} className="text-slate-400" /><span>{time}</span></div>
                                        <button onClick={() => handleCopy(meeting.meetingCode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${copiedId === meeting.meetingCode ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"}`}>
                                            {copiedId === meeting.meetingCode ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                                        </button>
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