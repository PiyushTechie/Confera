import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { 
    Calendar, 
    Clock, 
    Copy, 
    Check, 
    Video,
    Loader2 // Added a loader icon for better UX
} from "lucide-react";

function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                // SAFETY CHECK: Ensure history is an array before reversing
                //
                if (Array.isArray(history)) {
                    // Create a copy [...] before reversing to avoid mutation errors
                    setMeetings([...history].reverse());
                } else {
                    setMeetings([]);
                }
            } catch (e) {
                console.error("Error fetching history:", e);
                setMeetings([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        // Handle missing or invalid dates gracefully
        if (!dateString) return { day: "Unknown", time: "--:--" };
        
        try {
            const date = new Date(dateString);
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
                time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
        } catch (e) {
            return { day: "Invalid Date", time: "--:--" };
        }
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedId(code);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Video size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No meetings yet</h3>
                <p className="text-gray-500 max-w-xs mt-2">
                    Your recent meeting history will appear here once you join or host a call.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Meeting History</h2>
                    <p className="text-slate-500 text-sm">A log of your recent collaborations.</p>
                </div>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                    {meetings.length} Total
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {meetings.map((meeting, index) => {
                    const { day, time } = formatDate(meeting.date);
                    
                    return (
                        <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                            
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">
                                <Calendar size={14} className="text-indigo-500" />
                                <span>{day}</span>
                            </div>

                            <div className="mb-6">
                                <div className="text-2xl font-mono font-bold text-gray-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                    {meeting.meetingCode}
                                </div>
                                <div className="text-xs text-gray-400 font-medium mt-1">Meeting ID</div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                                    <Clock size={14} />
                                    <span>{time}</span>
                                </div>
                                
                                <button 
                                    onClick={() => handleCopy(meeting.meetingCode)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${
                                        copiedId === meeting.meetingCode 
                                        ? "bg-green-100 text-green-700" 
                                        : "bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                                    }`}
                                >
                                    {copiedId === meeting.meetingCode ? (
                                        <> <Check size={14} /> Copied </>
                                    ) : (
                                        <> <Copy size={14} /> Copy </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default History;