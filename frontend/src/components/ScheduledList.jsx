import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Video, Copy, Trash2, Edit2, Check, Plus } from 'lucide-react';

const ScheduledList = ({ refreshTrigger, onEditClick, onRefresh, onOpenSchedule }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const navigate = useNavigate();

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"; 

    useEffect(() => {
        fetchScheduledMeetings();
    }, [refreshTrigger]);

    const fetchScheduledMeetings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if(!token) { setLoading(false); return; }

            const response = await axios.get(`${BACKEND_URL}/api/v1/meeting/schedule`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMeetings(response.data.meetings || []);
        } catch (error) {
            console.error("Error fetching schedule:", error);
            setMeetings([]); 
        } finally {
            setLoading(false);
        }
    };

    const handleStart = (meetingId) => navigate(`/meeting/${meetingId}`);
    const handleCopy = (id) => { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(()=>setCopiedId(null), 2000); };
    const handleDelete = async (id) => { if(window.confirm("Delete?")) { try { const token = localStorage.getItem('token'); await axios.delete(`${BACKEND_URL}/api/v1/meeting/schedule/${id}`, { headers: { Authorization: `Bearer ${token}` } }); if(onRefresh) onRefresh(); } catch(e) { console.error(e); } } };

    // --- RENDER STATES ---

    if (loading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse"></div>)}
            </div>
        );
    }

    if (meetings.length === 0) {
        // --- MATCHING THE EMPTY STATE IMAGE ---
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                {/* Visual approximation of the beach chair using SVG/Icon */}
                <div className="mb-4 relative">
                    <div className="text-indigo-200">
                        {/* Simple placeholder illustration */}
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 9l-7 7-7-7" strokeOpacity="0.2"/>
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                            <path d="M12 17v-6" strokeOpacity="0.2"/>
                            <path d="M12 7h.01" strokeOpacity="0.2"/>
                        </svg>
                    </div>
                </div>
                
                <h3 className="text-slate-600 text-sm font-medium mb-1">No meetings scheduled.</h3>
                
                <button 
                    onClick={onOpenSchedule}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                    <Plus size={16} /> Schedule a meeting
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-y-auto h-full p-2">
            {meetings.map((meeting) => (
                <div key={meeting._id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <h4 className="font-semibold text-slate-800 text-sm truncate">{meeting.title || "Untitled"}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{new Date(meeting.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            <span>•</span>
                            <span className="font-mono">ID: {meeting.meetingId}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => handleStart(meeting.meetingId)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors"
                    >
                        Start
                    </button>
                    
                    {/* Hover Actions */}
                    <div className="hidden group-hover:flex items-center gap-1 ml-2">
                        <button onClick={() => handleCopy(meeting.meetingId)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded">{copiedId===meeting.meetingId?<Check size={14}/>:<Copy size={14}/>}</button>
                        <button onClick={() => handleDelete(meeting._id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded"><Trash2 size={14}/></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScheduledList;