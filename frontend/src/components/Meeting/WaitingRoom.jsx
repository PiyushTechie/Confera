import React, { useState, useEffect } from "react";
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import waitingIllustration from "../../assets/waiting-illustration.png";
import AvatarFallback from "./AvatarFallback";
import VideoPlayer from "./VideoPlayer";

const WaitingRoom = ({
  localStream,
  video,
  audio,
  username,
  onToggleAudio,
  onToggleVideo,
  onCancel,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#202124] flex flex-col text-white font-sans overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
        <div className="mb-8 w-[300px] sm:w-[500px] h-[250px] flex items-center justify-center">
          <img
            src={waitingIllustration}
            alt="Waiting for host"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        <div className="flex flex-col items-center gap-4 text-xl sm:text-2xl font-normal tracking-wide text-[#e8eaed]">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-[#8ab4f8]" size={24} />
            <p>Please wait until a meeting host brings you into the call</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[100px] right-6 w-[280px] aspect-video bg-[#303134] rounded-xl overflow-hidden shadow-2xl border border-[#5f6368] z-30 transition-all duration-300">
        {!video ? (
          <AvatarFallback username={username} className="w-full h-full object-cover" />
        ) : localStream ? (
          <VideoPlayer
            stream={localStream}
            isLocal={true}
            isMirrored={true}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-[#202124]">
            <Loader2 className="animate-spin text-[#8ab4f8]" size={24} />
            <span className="text-xs">Starting camera...</span>
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex gap-1.5">
          {!audio && (
            <div className="bg-[#ea4335] p-1.5 rounded-full shadow-md backdrop-blur-sm">
              <MicOff size={14} className="text-white" />
            </div>
          )}
        </div>
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm truncate max-w-[150px]">
          {username} (You)
        </div>
      </div>

      <div className="h-[80px] bg-[#202124] flex items-center justify-between px-6 shrink-0 relative z-20 border-t border-[#3c4043]">
        <div className="text-white text-sm font-medium w-32 hidden sm:block">
          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>

        <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
          <button
            onClick={onToggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              audio
                ? "bg-[#3c4043] hover:bg-[#45484c] text-white"
                : "bg-[#ea4335] hover:bg-[#d93025] text-white shadow-lg"
            }`}
          >
            {audio ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button
            onClick={onToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              video
                ? "bg-[#3c4043] hover:bg-[#45484c] text-white"
                : "bg-[#ea4335] hover:bg-[#d93025] text-white shadow-lg"
            }`}
          >
            {video ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          <button
            onClick={onCancel}
            className="w-[60px] h-10 rounded-full bg-[#ea4335] hover:bg-[#d93025] flex items-center justify-center text-white transition-colors cursor-pointer shadow-md"
          >
            <PhoneOff size={22} fill="currentColor" />
          </button>
        </div>

        <div className="w-32 hidden sm:block"></div>
      </div>
    </div>
  );
};

export default WaitingRoom;
