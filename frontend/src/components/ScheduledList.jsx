import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Copy, Trash2, Edit2, Check, ArrowRight, MoreHorizontal } from 'lucide-react';

const ScheduledList = ({ refreshTrigger, onEditClick, onRefresh }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const navigate = useNavigate();

    // Use your actual backend URL here
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; 

    useEffect(() => {
        fetchScheduledMeetings();
    }, [refreshTrigger]);

    const fetchScheduledMeetings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if(!token) return;

            const response = await axios.get(`${BACKEND_URL}/api/v1/meeting/schedule`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Assuming API returns array in response.data.meetings
            setMeetings(response.data.meetings || []);
        } catch (error) {
            console.error("Error fetching schedule:", error);
            // Fallback for demo purposes if API isn't set up yet
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
            onRefresh(); // Trigger refresh in parent
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    // --- DATE FORMATTERS ---
    const getMonth = (dateStr) => new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase();
    const getDay = (dateStr) => new Date(dateStr).getDate();
    const getTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return (
            <div className="flex flex-col gap-4 mt-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-0 animate-in fade-in duration-500 fill-mode-forwards">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="text-slate-300" size={32} />
                </div>
                <h3 className="text-slate-600 font-bold mb-1">No Meetings Scheduled</h3>
                <p className="text-slate-400 text-sm max-w-[200px]">
                    Upcoming scheduled meetings will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-[500px] custom-scrollbar">
            {meetings.map((meeting) => (
                <div 
                    key={meeting._id} 
                    className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
                >
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center min-w-[60px] h-[70px] bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold tracking-wider">{getMonth(meeting.date)}</span>
                        <span className="text-2xl font-bold leading-none my-0.5">{getDay(meeting.date)}</span>
                        <span className="text-[10px] font-medium opacity-80">{getTime(meeting.date)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate text-base sm:text-lg">
                            {meeting.title || "Untitled Meeting"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                {meeting.meetingId}
                            </span>
                            {meeting.passcode && (
                                <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 rounded">
                                    Pass: {meeting.passcode}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Start Button (Prominent) */}
                        <button 
                            onClick={() => handleStart(meeting.meetingId)}
                            title="Start Meeting"
                            className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
                        >
                            <Video size={18} />
                        </button>

                        {/* Dropdown / Extra Actions */}
                        <div className="flex flex-col sm:flex-row gap-1">
                            <button 
                                onClick={() => handleCopy(meeting.meetingId)}
                                title="Copy ID"
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                {copiedId === meeting.meetingId ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                            
                            <button 
                                onClick={() => onEditClick(meeting)}
                                title="Edit"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hidden sm:block"
                            >
                                <Edit2 size={18} />
                            </button>
                            
                            <button 
                                onClick={() => handleDelete(meeting._id)}
                                title="Delete"
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScheduledList;