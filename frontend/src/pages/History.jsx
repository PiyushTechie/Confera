import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import brandLogo from "../assets/BrandLogo.png"
import {
    Calendar,
    Clock,
    Copy,
    Check,
    Video,
    Loader2,
    History as HistoryIcon // Renamed to avoid conflict with component name
} from "lucide-react";

// --- NAVBAR COMPONENT ---
// Replace '/path/to/your/logo.png' with your actual image path
const Navbar = () => {
    // REPLACE THIS WITH YOUR ACTUAL IMAGE PATH e.g., "/assets/brand-logo.svg"
    const brandLogoSrc = brandLogo;

    return (
        <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand Logo Section */}
                <div className="flex-shrink-0 flex items-center">
                    <img
                        src={brandLogoSrc}
                        alt="Brand Logo"
                        className="h-16 md:h-16 w-auto object-contain transition-all"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    {/* Fallback text if no image */}
                    <span className="hidden text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ml-2">
                        Confera
                    </span>
                </div>

                {/* Right Side items (e.g., Profile placeholder) */}
                <div className="flex items-center gap-4">
                     <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold shadow-sm">
                        U
                    </div>
                </div>
            </div>
        </nav>
    );
};


// --- MAIN HISTORY COMPONENT ---
function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();

                if (Array.isArray(history)) {
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

    // --- RENDER STATES ---

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="flex flex-col items-center gap-3">
                         <Loader2 className="animate-spin text-indigo-600" size={40} />
                         <p className="text-slate-500 font-medium text-sm animate-pulse">Loading history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8 md:flex md:items-end md:justify-between">
                    <div className="flex items-center gap-3 mb-4 md:mb-0">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                             <HistoryIcon size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Meeting History</h2>
                            <p className="text-slate-500 mt-1">Your recent collaborations and calls.</p>
                        </div>
                    </div>
                    {meetings.length > 0 && (
                        <div className="inline-flex items-center px-4 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-full border border-indigo-100 shadow-sm">
                            <span className="bg-indigo-100 px-2 py-0.5 rounded-md mr-2">{meetings.length}</span> Total Sessions
                        </div>
                    )}
                </div>


                {/* Empty State */}
                {meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-sm p-8 max-w-2xl mx-auto mt-12">
                        <div className="w-24 h-24 bg-gradient-to-tr from-slate-50 to-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
                            <Video size={36} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">No meetings recorded yet</h3>
                        <p className="text-slate-500 max-w-md leading-relaxed">
                            Looks like you haven't joined or hosted any calls yet. Once you do, your activity will appear here automatically.
                        </p>
                    </div>
                ) : (
                    /* Grid Layout */
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {meetings.map((meeting, index) => {
                            const { day, time } = formatDate(meeting.date);

                            return (
                                <div
                                    key={index}
                                    className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(99,102,241,0.1)] transition-all duration-300 ease-in-out hover:-translate-y-1 group"
                                >
                                    {/* Date Badge */}
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg mb-5 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                                        <Calendar size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                        <span>{day}</span>
                                    </div>

                                    {/* Meeting Code block */}
                                    <div className="mb-6 pl-2 border-l-4 border-indigo-100 group-hover:border-indigo-500 transition-all">
                                        <div className="text-sm text-slate-400 font-medium mb-1">Meeting ID</div>
                                        <div className="text-2xl font-mono font-bold text-slate-800 tracking-tight break-all">
                                            {meeting.meetingCode}
                                        </div>
                                    </div>

                                    {/* Footer: Time and Copy Button */}
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                            <Clock size={15} className="text-slate-400" />
                                            <span>{time}</span>
                                        </div>

                                        <button
                                            onClick={() => handleCopy(meeting.meetingCode)}
                                            className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 text-xs font-bold shadow-sm border
                                            ${copiedId === meeting.meetingCode
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 active:scale-95"
                                                }`}
                                        >
                                            {copiedId === meeting.meetingCode ? (
                                                <> <Check size={14} className="animate-in fade-in zoom-in duration-200" /> Copied </>
                                            ) : (
                                                <> <Copy size={14} /> Copy </>
                                            )}
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