import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Calendar, Clock, Type, Loader2 } from "lucide-react";
import server from "../environment"; // Corrected Import path

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
        await axios.put(`${server}/api/schedule/update/${meetingToEdit._id}`, payload, config);
      } else {
        await axios.post(`${server}/api/schedule/create`, payload, config);
      }

      if (onSuccess) onSuccess();
      onClose();
      setFormData({ title: "", date: "", time: "" }); // Reset
    } catch (error) {
      console.error("Schedule error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {meetingToEdit ? <Calendar className="text-blue-400" size={20}/> : <Calendar className="text-green-400" size={20}/>}
            {meetingToEdit ? "Edit Meeting Details" : "Schedule New Meeting"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Type size={14} /> Meeting Title
            </label>
            <input
              name="title"
              type="text"
              required
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="e.g. Project Sprint Review"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} /> Date
              </label>
              <input
                name="date"
                type="date"
                required
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} /> Time
              </label>
              <input
                name="time"
                type="time"
                required
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-2 ${
              loading 
                ? "bg-neutral-800 text-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (meetingToEdit ? "Save Changes" : "Confirm Schedule")}
          </button>
        </form>
      </div>
    </div>
  );
}