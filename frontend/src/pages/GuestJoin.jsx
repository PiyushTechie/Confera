import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Keyboard, ArrowLeft } from "lucide-react";

export default function GuestJoin() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const handleJoin = (e) => {
    e.preventDefault();
    if (meetingCode.trim().length > 0) {
      // Navigate to the meeting URL. 
      // Since we pass NO state, the meeting page will ask for their Name (Lobby Mode).
      navigate(`/${meetingCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans text-neutral-800 px-4">
      
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
        >
            <ArrowLeft size={20} />
            <span>Back</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl w-full max-w-lg border border-gray-100 text-center">
        
        {/* Logo Icon */}
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <Video size={32} />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a Meeting</h1>
        <p className="text-gray-500 mb-8">Enter the meeting code provided by the host.</p>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-4">
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Keyboard size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder="e.g. 123-456-789" 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-lg rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-12 p-4 transition-all outline-none"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    autoFocus
                />
            </div>

            <button 
                type="submit"
                disabled={meetingCode.length === 0}
                className={`w-full flex items-center justify-center gap-2 font-semibold rounded-xl text-lg px-8 py-4 transition-all ${
                    meetingCode.length > 0 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 cursor-pointer" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
                Join Meeting
            </button>
        </form>

      </div>
      
      {/* Footer */}
      <p className="mt-8 text-sm text-gray-400">
          Don't have an account? <span onClick={() => navigate("/auth")} className="text-blue-600 cursor-pointer hover:underline">Sign up for free</span>
      </p>

    </div>
  );
}