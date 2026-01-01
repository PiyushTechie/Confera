import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Video, Copy, Trash2, Edit2, Check } from 'lucide-react';

const ScheduledList = ({ refreshTrigger, onEditClick, onRefresh }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const navigate = useNavigate();

    // Safe fallback for backend URL
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"; 

    useEffect(() => {
        fetchScheduledMeetings();
    }, [refreshTrigger]);

    const fetchScheduledMeetings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if(!token) {
                setLoading(false);
                return;
            }

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

    const handleStart = (meetingId) => {
        navigate(`/meeting/${meetingId}`);
    };

    const handleCopy = (meetingId) => {
        navigator.clipboard.writeText(meetingId);
        setCopiedId(meetingId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (meetingId) => {
        if(!window.confirm("Delete this scheduled meeting?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/api/v1/meeting/schedule/${meetingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(onRefresh) onRefresh();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const getMonth = (dateStr) => {
        try { return new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase(); } catch(e) { return 'NOV'; }
    };
    const getDay = (dateStr) => {
        try { return new Date(dateStr).getDate(); } catch(e) { return '01'; }
    };
    const getTime = (dateStr) => {
        try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch(e) { return '12:00 PM'; }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-4 mt-2">
                {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="text-slate-300" size={32} />
                </div>
                <h3 className="text-slate-600 font-bold mb-1">No Meetings</h3>
                <p className="text-slate-400 text-sm">Schedule a meeting to see it here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-[500px]">
            {meetings.map((meeting) => (
                <div 
                    key={meeting._id} 
                    className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                    <div className="flex flex-col items-center justify-center min-w-[60px] h-[70px] bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold">{getMonth(meeting.date)}</span>
                        <span className="text-2xl font-bold leading-none">{getDay(meeting.date)}</span>
                        <span className="text-[10px] font-medium">{getTime(meeting.date)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate text-base">{meeting.title || "Untitled"}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                           <span className="font-mono bg-slate-100 px-1 rounded">{meeting.meetingId}</span>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <button onClick={() => handleStart(meeting.meetingId)} className="p-2 bg-indigo-600 text-white rounded-xl shadow-md"><Video size={18}/></button>
                        <button onClick={() => handleCopy(meeting.meetingId)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">{copiedId === meeting.meetingId ? <Check size={18} className="text-green-500"/> : <Copy size={18}/>}</button>
                        <button onClick={() => onEditClick(meeting)} className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(meeting._id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg"><Trash2 size={18}/></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScheduledList;