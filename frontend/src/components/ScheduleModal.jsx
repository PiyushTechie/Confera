import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Calendar, Clock, Loader2, Save } from "lucide-react";
import server from "../environment";

export default function ScheduleModal({ isOpen, onClose, onSuccess, meetingToEdit }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Load data when "meetingToEdit" prop changes
  useEffect(() => {
    if (meetingToEdit) {
      setTitle(meetingToEdit.title);
      setTime(meetingToEdit.time);
      
      // Convert stored "DD-MM-YYYY" back to input-friendly "YYYY-MM-DD"
      if (meetingToEdit.date) {
        const [day, month, year] = meetingToEdit.date.split("-");
        setDate(`${year}-${month}-${day}`);
      }
    } else {
      // Reset if adding new
      setTitle("");
      setDate("");
      setTime("");
    }
  }, [meetingToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !time) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Convert Input "YYYY-MM-DD" -> Backend "DD-MM-YYYY"
      const [year, month, day] = date.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const payload = { title, date: formattedDate, time };
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (meetingToEdit) {
        // --- UPDATE MODE ---
        await axios.put(`${server}/api/schedule/update/${meetingToEdit._id}`, payload, config);
      } else {
        // --- CREATE MODE ---
        await axios.post(`${server}/api/schedule/create`, payload, config);
      }

      onSuccess(); // Refresh list
      onClose();   // Close modal
    } catch (error) {
      console.error("Operation failed:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Calendar className="text-blue-500" /> 
          {meetingToEdit ? "Edit Meeting" : "Schedule a Meeting"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Title</label>
            <input
              type="text"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
              placeholder="e.g., Weekly Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Date</label>
              <input
                type="date"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 [color-scheme:dark]"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Time</label>
              <input
                type="time"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 [color-scheme:dark]"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : (meetingToEdit ? "Save Changes" : "Schedule")}
          </button>
        </form>
      </div>
    </div>
  );
}