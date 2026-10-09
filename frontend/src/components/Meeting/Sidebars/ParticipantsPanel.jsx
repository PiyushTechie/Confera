import React from 'react';
import { UserPlus, Search, MicOff, Mic, VideoOff, Video as VideoIcon, Hand, MoreVertical, LogOut } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';

export default function ParticipantsPanel() {
  const {
    amIHost,
    participantSearch,
    setParticipantSearch,
    waitingUsers,
    socketRef,
    getAvatarColor,
    handleDeny,
    handleAdmit,
    userName,
    audio,
    video,
    isHandRaised,
    userMap,
    videos,
    roomHostId,
    handleKickUser
  } = useMeetingContext();

  const combinedUserMap = { ...userMap };

  videos.forEach((v) => {
    if (v.socketId && !combinedUserMap[v.socketId]) {
      combinedUserMap[v.socketId] = {
        socketId: v.socketId,
        username: "Connecting...",
      };
    }
  });

  const filteredRemoteUsers = Object.values(combinedUserMap)
    .filter((u) => u.socketId !== socketRef.current?.id)
    .filter((u) => (u.username || "").toLowerCase().includes(participantSearch.toLowerCase()));

  const raisedHandsUsers = filteredRemoteUsers.filter(u => u.isHandRaised === true);
  
  const amIHandRaised = isHandRaised && userName.toLowerCase().includes(participantSearch.toLowerCase());

  return (
    <div className="flex flex-col h-full bg-[#202124]">
      <div className="p-4 border-b border-[#3c4043] space-y-4">
        {amIHost && (
          <button className="flex items-center gap-2 text-sm text-[#8ab4f8] font-medium hover:bg-[#3c4043] px-3 py-2 rounded-md transition-colors w-max cursor-pointer">
            <UserPlus size={18} /> Add people
          </button>
        )}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for people"
            value={participantSearch}
            onChange={(e) => setParticipantSearch(e.target.value)}
            className="w-full bg-[#3c4043] rounded-md pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] border border-transparent transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {amIHost && waitingUsers.length > 0 && !participantSearch && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Waiting ({waitingUsers.length})
              </div>
              {waitingUsers.length > 1 && (
                <button
                  onClick={() => socketRef.current.emit("admit-all")}
                  className="text-xs text-[#8ab4f8] hover:underline cursor-pointer"
                >
                  Admit all
                </button>
              )}
            </div>

            {waitingUsers.map((user) => (
              <div
                key={user.socketId}
                className="flex items-center justify-between py-2 px-2 hover:bg-[#3c4043] rounded-md mb-1 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(
                      user.username
                    )}`}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200 truncate max-w-[100px]">
                    {user.username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeny(user.socketId)}
                    className="text-xs text-[#8ab4f8] hover:bg-blue-900/30 px-3 py-1.5 rounded transition-colors font-medium cursor-pointer"
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => handleAdmit(user.socketId)}
                    className="text-xs bg-[#8ab4f8] text-[#202124] hover:bg-[#d2e3fc] px-4 py-1.5 rounded-full transition-colors font-medium cursor-pointer"
                  >
                    Admit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(raisedHandsUsers.length > 0 || amIHandRaised) && (
          <div className="mb-4 border-b border-[#3c4043] pb-3">
            <div className="px-2 pt-2 pb-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Raised Hands ({raisedHandsUsers.length + (amIHandRaised ? 1 : 0)})
            </div>

            {amIHandRaised && (
              <div className="flex items-center justify-between py-2 px-3 hover:bg-[#3c4043] rounded-md cursor-pointer group mb-1">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(userName)}`}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200 truncate">{userName} (You)</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {!audio ? <MicOff size={16} className="text-red-500" /> : <Mic size={16} className="text-gray-400" />}
                  {!video ? <VideoOff size={16} className="text-red-500" /> : <VideoIcon size={16} className="text-gray-400" />}
                  <Hand size={16} className="text-yellow-400 ml-1" />
                </div>
              </div>
            )}

            {raisedHandsUsers.map((user) => (
              <div key={user.socketId} className="flex items-center justify-between py-2 px-3 hover:bg-[#3c4043] rounded-md cursor-pointer group mb-1 relative">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(user.username)}`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200 truncate">{user.username}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {user.isMuted ? <MicOff size={16} className="text-red-500" /> : <Mic size={16} className="text-gray-400" />}
                  {user.isVideoOff ? <VideoOff size={16} className="text-red-500" /> : <VideoIcon size={16} className="text-gray-400" />}
                  <Hand size={16} className="text-yellow-400 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-2 pt-2 pb-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          In meeting ({filteredRemoteUsers.length + (userName.toLowerCase().includes(participantSearch.toLowerCase()) ? 1 : 0)})
        </div>

        {userName.toLowerCase().includes(participantSearch.toLowerCase()) && (
          <div className="flex items-center justify-between py-2 px-3 hover:bg-[#3c4043] rounded-md cursor-pointer group mb-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(
                  userName
                )}`}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-200 truncate">
                {userName} (You)
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {amIHost && (
                <span className="text-[10px] text-gray-400 uppercase font-medium mr-1">Host</span>
              )}
              
              {!audio ? (
                <MicOff size={18} className="text-red-500" />
              ) : (
                <Mic size={18} className="text-gray-400" />
              )}

              {!video ? (
                <VideoOff size={18} className="text-red-500" />
              ) : (
                <VideoIcon size={18} className="text-gray-400" />
              )}
            </div>
          </div>
        )}

        {filteredRemoteUsers.map((user) => (
          <div
            key={user.socketId}
            className="flex items-center justify-between py-2 px-3 hover:bg-[#3c4043] rounded-md cursor-pointer group mb-1 relative"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(
                  user.username
                )}`}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-200 truncate">
                {user.username}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {user.socketId === roomHostId && (
                <span className="text-[10px] text-gray-400 uppercase font-medium mr-1">Host</span>
              )}
              
              {user.isMuted ? (
                <MicOff size={18} className="text-red-500" />
              ) : (
                <Mic size={18} className="text-gray-400" />
              )}

              {user.isVideoOff ? (
                <VideoOff size={18} className="text-red-500" />
              ) : (
                <VideoIcon size={18} className="text-gray-400" />
              )}
              
              {amIHost && (
                <div className="relative group/menu ml-1">
                  <button className="w-6 flex justify-center text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <MoreVertical size={18} />
                  </button>
                  <div className="absolute right-0 top-6 w-40 bg-[#303134] border border-[#5f6368] shadow-2xl rounded-md hidden group-hover/menu:block hover:block z-50 overflow-hidden">
                    <button
                      onClick={() => handleKickUser(user.socketId)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#3c4043] flex items-center gap-3 cursor-pointer"
                    >
                      <LogOut size={16} className="text-gray-400" /> Remove from call
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
