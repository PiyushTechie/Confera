import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, Video, Copy, Check, Trash2, Pencil, CalendarX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import server from "../environment"; // Corrected Import path

export default function ScheduledList({ refreshTrigger, onEditClick, onRefresh }) {
  const [meetings, setMeetings] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${server}/api/schedule/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeetings(res.data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${server}/api/schedule/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Failed to delete meeting");
    }
  };

  const handleStart = (code) => {
    navigate(`/meeting/${code}`, { state: { isHost: true } });
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="text-gray-400 text-center py-10">Loading schedule...</div>;
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-neutral-900/50 rounded-xl border border-dashed border-neutral-700">
        <CalendarX size={48} className="mb-3 opacity-50" />
        <p className="text-lg font-medium">No meetings scheduled</p>
        <p className="text-sm opacity-60">Create a new meeting to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
      {meetings.map((m) => (
        <div
          key={m._id}
          className="group relative bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 p-5 rounded-xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Info Section */}
            <div className="space-y-2">
              <h3 className="font-bold text-white text-xl tracking-tight">{m.title}</h3>
              <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
                <span className="flex items-center gap-2 bg-neutral-800 px-2 py-1 rounded">
                  <Calendar size={14} className="text-blue-400" /> {m.date}
                </span>
                <span className="flex items-center gap-2 bg-neutral-800 px-2 py-1 rounded">
                  <Clock size={14} className="text-orange-400" /> {m.time}
                </span>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-800">
              <button
                onClick={() => onEditClick && onEditClick(m)}
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                title="Edit Details"
              >
                <Pencil size={18} />
              </button>

              <button
                onClick={() => handleDelete(m._id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Cancel Meeting"
              >
                <Trash2 size={18} />
              </button>

              <div className="w-px h-8 bg-neutral-700 mx-1 hidden md:block"></div>

              <button
                onClick={() => handleCopy(m.meetingCode, m._id)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                {copiedId === m._id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                <span className="hidden md:inline">Copy</span>
              </button>

              <button
                onClick={() => handleStart(m.meetingCode)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
              >
                <Video size={16} /> Launch
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}