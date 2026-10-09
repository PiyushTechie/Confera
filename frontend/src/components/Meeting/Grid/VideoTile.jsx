import React from 'react';
import { ScreenShare, Hand, Crown, MicOff, Mic, Pin, LogOut } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';
import AvatarFallback from '../AvatarFallback';
import VideoPlayer from '../VideoPlayer';

export default function VideoTile({ socketId, stream, isLocal, sizeClass = "" }) {
  const {
    userName,
    isHandRaised,
    video,
    audio,
    userMap,
    amIHost,
    roomHostId,
    isAudioOnly,
    activeSpeakerId,
    socketIdRef,
    activeReactions,
    screen,
    selectedDevices,
    pinnedUserId,
    handleTileClick,
    handleSpotlightUser,
    handleKickUser
  } = useMeetingContext();

  const user = isLocal
    ? {
        username: userName,
        isHandRaised: isHandRaised,
        isVideoOff: !video,
        isMuted: !audio,
      }
    : userMap[socketId] || { username: "Guest" };

  const displayName = isLocal ? `${userName} (You)` : user.username;
  const isThisHost = isLocal ? amIHost : socketId === roomHostId;
  let isCamOff = isLocal ? !video : user.isVideoOff;
  if (isAudioOnly && !isLocal) isCamOff = true;
  const isActiveSpeaker = activeSpeakerId === socketId && !isLocal;
  const resolvedId = socketId === "local" ? socketIdRef.current : socketId;
  const reactionToShow = activeReactions[resolvedId];

  return (
    <div
      onClick={() => handleTileClick(socketId)}
      className={`relative overflow-hidden rounded-[24px] bg-[#3c4043] border transition-all duration-300 cursor-pointer ${isActiveSpeaker ? "border-blue-500 ring-2 ring-blue-500" : "border-transparent"} ${sizeClass}`}
      style={sizeClass ? {} : { height: "100%", minHeight: "180px" }}
    >
      {isLocal && screen ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#202124] text-center p-4">
          <div className="w-16 h-16 bg-[#303134] rounded-full flex items-center justify-center mb-4 shadow-lg border border-[#5f6368]">
            <ScreenShare size={32} className="text-[#8ab4f8]" />
          </div>
          <h3 className="text-white text-lg font-medium mb-1">You are presenting</h3>
          <p className="text-gray-400 text-sm max-w-[250px]">
            Other participants can see your screen.
          </p>
        </div>
      ) : isCamOff ? (
        <AvatarFallback username={displayName} isActiveSpeaker={isActiveSpeaker} />
      ) : (
        <VideoPlayer
          stream={stream}
          isLocal={isLocal}
          isMirrored={isLocal && !screen}
          className="w-full h-full object-cover"
          audioOutputId={selectedDevices.audioOutput}
        />
      )}
      <div className={`absolute bottom-4 left-4 flex items-center gap-2 text-[14px] font-medium px-3 py-1.5 rounded-full drop-shadow-md max-w-[90%] transition-colors ${user.isHandRaised ? "bg-[#81c995] text-[#202124]" : "bg-[#202124]/60 text-white"}`}>
        {user.isHandRaised && <Hand size={16} className="text-[#202124] shrink-0" />}
        <span className="truncate">{displayName}</span>
        {isThisHost && <Crown size={14} className={user.isHandRaised ? "text-[#202124] shrink-0 ml-1" : "text-yellow-400 shrink-0 ml-1"} />}
      </div>
      <div className="absolute top-3 right-3 flex gap-2">
        {user.socketId === roomHostId && (
          <span className="text-[10px] text-gray-400 uppercase font-medium mt-1">Host</span>
        )}
        {user.isMuted ? (
          <div className="bg-[#202124]/80 p-1.5 rounded-full backdrop-blur-sm">
            <MicOff size={14} className="text-white" />
          </div>
        ) : isActiveSpeaker ? (
          <div className="bg-[#202124]/80 p-1.5 rounded-full backdrop-blur-sm animate-pulse">
            <Mic size={14} className="text-blue-400" />
          </div>
        ) : null}
        {pinnedUserId === socketId && (
          <div className="bg-[#202124]/80 p-1.5 rounded-full backdrop-blur-sm text-white">
            <Pin size={14} />
          </div>
        )}
      </div>
      {reactionToShow && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-in zoom-in fade-in duration-300 pointer-events-none">
          <span className="text-6xl">{reactionToShow}</span>
        </div>
      )}
      {amIHost && !isLocal && (
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSpotlightUser(socketId);
            }}
            className="p-3 bg-white text-black rounded-full hover:bg-gray-200 cursor-pointer"
            title="Spotlight"
          >
            <Pin size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleKickUser(socketId);
            }}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
            title="Remove"
          >
            <LogOut size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
