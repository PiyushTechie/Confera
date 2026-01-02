import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Video, Copy, Trash2, Edit2, Check, Plus } from 'lucide-react';

const ScheduledList = ({ refreshTrigger, onEditClick, onRefresh, onOpenSchedule, filterDate }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const navigate = useNavigate();

    const BACKEND_URL = "https://confera-backend-nixq.onrender.com";

    useEffect(() => {
        fetchScheduledMeetings();
    }, [refreshTrigger]);

    const fetchScheduledMeetings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if(!token) { setLoading(false); return; }

            const response = await axios.get(`${BACKEND_URL}/api/schedule/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Normalize data (handles both array and object responses)
            const rawData = response.data.meetings || response.data || [];
            const dataArray = Array.isArray(rawData) ? rawData : [];
            
            // Sort by time (assuming time is HH:MM string)
            const sorted = dataArray.sort((a, b) => a.time.localeCompare(b.time));
            
            setMeetings(sorted);
        } catch (error) {
            console.error("Error fetching schedule:", error);
            setMeetings([]); 
        } finally {
            setLoading(false);
        }
    };

    // --- FILTERING LOGIC ---
    const filteredMeetings = meetings.filter(meeting => {
        if (!filterDate) return true; // Show all if no filter
        if (!meeting.date) return false;

        // Convert Meeting DD-MM-YYYY to Date Object
        const [d, m, y] = meeting.date.split('-');
        // Note: Months are 0-indexed in JS Date
        const meetingDateObj = new Date(y, m - 1, d);
        
        return (
            meetingDateObj.getDate() === filterDate.getDate() &&
            meetingDateObj.getMonth() === filterDate.getMonth() &&
            meetingDateObj.getFullYear() === filterDate.getFullYear()
        );
    });

    const handleStart = (meetingId) => navigate(`/meeting/${meetingId}`);
    const handleCopy = (id) => { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(()=>setCopiedId(null), 2000); };
    
    const handleDelete = async (id) => { 
        if(window.confirm("Delete?")) { 
            try { 
                const token = localStorage.getItem('token');
                await axios.delete(`${BACKEND_URL}/api/schedule/delete/${id}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                }); 
                if(onRefresh) onRefresh(); 
            } catch(e) { console.error(e); } 
        } 
    };

    if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Loading schedule...</div>;

    if (filteredMeetings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="mb-4 text-slate-200">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="M8 14h.01" />
                        <path d="M12 14h.01" />
                        <path d="M16 14h.01" />
                        <path d="M8 18h.01" />
                        <path d="M12 18h.01" />
                        <path d="M16 18h.01" />
                    </svg>
                </div>
                <h3 className="text-slate-600 text-sm font-medium mb-1">No meetings scheduled.</h3>
                <button onClick={onOpenSchedule} className="flex items-center gap-1 text-[#0E71EB] hover:text-[#0256b1] text-sm font-medium transition-colors">
                    <Plus size={16} /> Schedule a meeting
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-y-auto h-full p-2 space-y-1">
            {filteredMeetings.map((meeting) => (
                <div key={meeting._id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <h4 className="font-bold text-slate-800 text-sm truncate">{meeting.title || "Untitled"}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                            <span>{meeting.time}</span>
                            <span className="text-slate-300">•</span>
                            <span>ID: {meeting.meetingId}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleStart(meeting.meetingId || meeting._id)} className="px-3 py-1.5 bg-[#0E71EB] text-white text-xs font-bold rounded-lg hover:bg-[#0256b1] transition-colors shadow-sm shadow-blue-200">
                            Start
                        </button>
                        
                        <div className="hidden group-hover:flex items-center gap-1 ml-1 animate-in fade-in duration-200">
                            <button onClick={() => handleCopy(meeting.meetingId)} className="p-1.5 text-slate-400 hover:text-[#0E71EB] hover:bg-blue-50 rounded-lg transition-colors">{copiedId===meeting.meetingId?<Check size={14}/>:<Copy size={14}/>}</button>
                            <button onClick={() => onEditClick(meeting)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={14}/></button>
                            <button onClick={() => handleDelete(meeting._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScheduledList;