import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Calendar, Clock, Type, Loader2, CalendarDays } from "lucide-react";

// Using the same environment variable pattern as ScheduledList for consistency
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function ScheduleModal({ isOpen, onClose, onSuccess, meetingToEdit }) {
  const [formData, setFormData] = useState({ title: "", date: "", time: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meetingToEdit) {
      // Backend uses DD-MM-YYYY, Frontend Input needs YYYY-MM-DD
      let formattedDate = "";
      if (meetingToEdit.date) {
        const [day, month, year] = meetingToEdit.date.split("-");
        formattedDate = `${year}-${month}-${day}`;
      }
      setFormData({
        title: meetingToEdit.title,
        time: meetingToEdit.time,
        date: formattedDate
      });
    } else {
      setFormData({ title: "", date: "", time: "" });
    }
  }, [meetingToEdit, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // Convert YYYY-MM-DD back to DD-MM-YYYY for backend
      const [year, month, day] = formData.date.split("-");
      const backendDate = `${day}-${month}-${year}`;

      const payload = { ...formData, date: backendDate };
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (meetingToEdit) {
        await axios.put(`${BACKEND_URL}/api/v1/meeting/schedule/${meetingToEdit._id}`, payload, config);
      } else {
        await axios.post(`${BACKEND_URL}/api/v1/meeting/schedule/create`, payload, config);
      }

      if (onSuccess) onSuccess();
      onClose();
      setFormData({ title: "", date: "", time: "" }); // Reset
    } catch (error) {
      console.error("Schedule error:", error);
      alert("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content - White Theme */}
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative overflow-hidden transform transition-all scale-100 border border-slate-100">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {meetingToEdit ? "Edit Meeting" : "Schedule Meeting"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {meetingToEdit ? "Update your upcoming session details." : "Plan a new session for your team."}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 ml-1">
              <Type size={14} className="text-indigo-500" /> Meeting Title
            </label>
            <div className="relative group">
              <input
                name="title"
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="e.g. Weekly Sprint Sync"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 ml-1">
                <CalendarDays size={14} className="text-indigo-500" /> Date
              </label>
              <input
                name="date"
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            
            {/* Time Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 ml-1">
                <Clock size={14} className="text-indigo-500" /> Time
              </label>
              <input
                name="time"
                type="time"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg transform active:scale-95 ${
                loading 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (meetingToEdit ? "Save Changes" : "Confirm Schedule")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}