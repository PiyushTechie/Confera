import React from 'react';
import { Lock } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';

export default function LeftMeetingScreen() {
  const { countdown, navigate } = useMeetingContext();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans relative">
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#0b57d0] flex items-center justify-center text-[#0b57d0] font-medium text-[15px]">
          {countdown}
        </div>
        <span className="text-gray-700 text-sm font-medium">Returning to home screen</span>
      </div>
      
      <h1 className="text-4xl text-gray-800 mb-8 font-normal tracking-tight">You've left the meeting</h1>
      
      <div className="flex gap-3 mb-8">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full border border-gray-300 text-[#0b57d0] font-medium hover:bg-blue-50 transition-colors text-[14px] cursor-pointer"
        >
          Rejoin
        </button>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-full bg-[#0b57d0] text-white font-medium hover:bg-blue-700 transition-colors shadow-sm text-[14px] cursor-pointer"
        >
          Return to home screen
        </button>
      </div>
      
      <button className="text-[#0b57d0] text-[13.5px] font-medium hover:underline mb-12 cursor-pointer">
        Submit feedback
      </button>
      
      <div className="max-w-[500px] w-full border border-gray-200 rounded-lg p-6 flex gap-4 mt-8">
        <div className="bg-[#4285f4] rounded-md p-2 h-max shrink-0 mt-1">
          <Lock className="text-white w-6 h-6" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-gray-800 font-medium text-[17px] mb-1.5">Your meeting is safe</h3>
          <p className="text-gray-600 text-[13px] leading-relaxed mb-4">No one can join a meeting unless invited or admitted by the host</p>
          <button className="text-[#0b57d0] text-[13.5px] font-medium hover:underline text-left cursor-pointer">Learn more</button>
        </div>
      </div>
    </div>
  );
}
