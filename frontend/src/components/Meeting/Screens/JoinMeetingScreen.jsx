import React from 'react';
import { Video, Keyboard, Shield } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';

export default function JoinMeetingScreen() {
  const { userName, setUsername, meetingCode, connect } = useMeetingContext();

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="h-screen w-screen bg-[#202124] text-white font-google-sans flex flex-col">
      <div className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-2xl font-normal text-gray-200">
          <Video size={28} className="text-[#8ab4f8]" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-300 text-lg">
            {getCurrentTime()} •{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium cursor-pointer">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-lg">
            <h1 className="text-4xl md:text-5xl leading-tight font-normal">
              Video calls and meetings for everyone
            </h1>
            <p className="text-xl text-gray-400 font-light leading-relaxed">
              Connect, collaborate, and celebrate from anywhere with Google Meet
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-4">
              <button
                onClick={connect}
                className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-6 py-3 rounded-md text-base font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Video size={20} />
                New meeting
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <Keyboard size={20} />
                  </div>
                  <input
                    className="w-full bg-transparent border border-gray-500 rounded-md py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] transition-all"
                    placeholder="Enter a code or link"
                    value={meetingCode}
                    readOnly
                  />
                </div>
                <button className="text-gray-400 font-medium px-4 py-3 hover:bg-[#303134] rounded-md transition-colors disabled:opacity-50 cursor-pointer">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center space-y-6">
            <div className="w-80 h-80 bg-[#303134] rounded-full flex items-center justify-center relative">
              <div className="absolute w-64 h-64 border-4 border-[#8ab4f8] rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute w-48 h-48 border-4 border-[#8ab4f8] rounded-full opacity-40"></div>
              <Shield size={80} className="text-[#8ab4f8]" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-normal">Your meeting is safe</h3>
              <p className="text-gray-400 max-w-sm">
                No one can join a meeting unless invited or admitted by the host
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 text-center text-gray-500 text-xs">
        Enter your name to join:
        <input
          className="bg-transparent border-b border-gray-500 ml-2 text-white focus:outline-none"
          value={userName}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
    </div>
  );
}
