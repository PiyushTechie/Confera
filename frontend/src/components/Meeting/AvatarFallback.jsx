import React from "react";

const getAvatarColor = (name) => {
  const colors = [
    "bg-red-600",
    "bg-orange-600",
    "bg-amber-600",
    "bg-green-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-violet-600",
    "bg-purple-600",
    "bg-fuchsia-600",
    "bg-pink-600",
    "bg-rose-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const AvatarFallback = ({ username, className = "", isActiveSpeaker = false }) => {
  const initial = (username || "Guest").charAt(0).toUpperCase();
  const colorClass = getAvatarColor(username || "Guest");
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-[#3c4043] ${className}`}
    >
      <style>
        {`
          @keyframes eq {
            0% { transform: scaleY(0.3); }
            100% { transform: scaleY(1); }
          }
        `}
      </style>
      <div className={`rounded-full transition-all duration-300 ${isActiveSpeaker ? 'ring-[4px] ring-[#8ab4f8] ring-offset-[4px] ring-offset-[#3c4043]' : ''}`}>
        <div
          className={`${colorClass} rounded-full flex items-center justify-center text-white font-medium text-4xl w-24 h-24 sm:w-28 sm:h-28 md:w-[120px] md:h-[120px] shadow-lg relative`}
        >
          {initial}
          {isActiveSpeaker && (
            <div className="absolute -right-2 -top-2 bg-[#8ab4f8] rounded-full w-8 h-8 flex items-center justify-center gap-[3px] border-2 border-[#3c4043]">
              <div className="w-[3px] h-[12px] bg-[#202124] rounded-full origin-bottom" style={{ animation: "eq 0.4s ease-in-out infinite alternate" }}></div>
              <div className="w-[3px] h-[12px] bg-[#202124] rounded-full origin-bottom" style={{ animation: "eq 0.6s ease-in-out infinite alternate 0.2s" }}></div>
              <div className="w-[3px] h-[12px] bg-[#202124] rounded-full origin-bottom" style={{ animation: "eq 0.5s ease-in-out infinite alternate 0.4s" }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarFallback;
