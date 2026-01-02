import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Video, Copy, Trash2, Edit2, Check, Plus } from 'lucide-react';

const ScheduledList = ({ refreshTrigger, onEditClick, onRefresh, onOpenSchedule }) => {
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

            // FIXED PATH: Verify if your backend uses /all, /user, or just / for getting list
            const response = await axios.get(`${BACKEND_URL}/api/schedule/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Handle different backend response structures
            setMeetings(response.data.meetings || response.data || []);
        } catch (error) {
            console.error("Error fetching schedule:", error);
            setMeetings([]); 
        } finally {
            setLoading(false);
        }
    };

    const handleStart = (meetingId) => navigate(`/meeting/${meetingId}`);
    const handleCopy = (id) => { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(()=>setCopiedId(null), 2000); };
    
    const handleDelete = async (id) => { 
        if(window.confirm("Delete?")) { 
            try { 
                const token = localStorage.getItem('token');
                // FIXED PATH
                await axios.delete(`${BACKEND_URL}/api/schedule/delete/${id}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                }); 
                if(onRefresh) onRefresh(); 
            } catch(e) { console.error(e); } 
        } 
    };

    if (loading) return <div className="p-4 text-center text-slate-400 text-sm">Loading schedule...</div>;

    if (meetings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="mb-4 text-indigo-200">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </div>
                <h3 className="text-slate-600 text-sm font-medium mb-1">No meetings scheduled.</h3>
                <button onClick={onOpenSchedule} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                    <Plus size={16} /> Schedule a meeting
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-y-auto h-full p-2 space-y-1">
            {meetings.map((meeting) => (
                <div key={meeting._id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <h4 className="font-semibold text-slate-800 text-sm truncate">{meeting.title || "Untitled"}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{meeting.time}</span>
                            <span>•</span>
                            <span>{meeting.date}</span>
                        </div>
                    </div>
                    
                    <button onClick={() => handleStart(meeting.meetingId || meeting._id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors">
                        Start
                    </button>
                    
                    <div className="hidden group-hover:flex items-center gap-1 ml-2">
                        <button onClick={() => handleCopy(meeting.meetingId)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded">{copiedId===meeting.meetingId?<Check size={14}/>:<Copy size={14}/>}</button>
                        <button onClick={() => onEditClick(meeting)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(meeting._id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded"><Trash2 size={14}/></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScheduledList;