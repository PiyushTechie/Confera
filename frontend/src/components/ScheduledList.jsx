import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, Video, Copy, Check, Trash2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export default function ScheduledList({ refreshTrigger, onEditClick, onRefresh }) {
  const [meetings, setMeetings] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${server}/api/schedule/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeetings(res.data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
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
      onRefresh(); // Trigger refresh in parent
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

  if (meetings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-neutral-800/30 rounded-xl border border-neutral-800">
        <p>No meetings scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((m) => (
        <div
          key={m._id}
          className="bg-neutral-800/50 border border-neutral-700 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-neutral-600 transition-all group"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              {m.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-400" /> {m.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-orange-400" /> {m.time}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              onClick={() => onEditClick(m)}
              className="p-2 hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 rounded-lg transition-colors"
              title="Edit"
            >
              <Pencil size={18} />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(m._id)}
              className="p-2 hover:bg-red-600/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>

            <div className="h-6 w-px bg-neutral-700 mx-1"></div>

            {/* Existing Buttons */}
            <button
              onClick={() => handleCopy(m.meetingCode, m._id)}
              className="p-2 hover:bg-neutral-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Copy Link"
            >
              {copiedId === m._id ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>

            <button
              onClick={() => handleStart(m.meetingCode)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-green-900/20"
            >
              <Video size={16} /> Start
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}