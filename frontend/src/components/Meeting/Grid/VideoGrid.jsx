import React from 'react';
import { X, UserPlus, Copy, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';
import VideoTile from './VideoTile';

export default function VideoGrid() {
  const {
    userMap,
    socketRef,
    videos,
    localStream,
    pinnedUserId,
    isMobile,
    GRID_PAGE_SIZE,
    gridPage,
    setGridPage,
    showMeetingReadyCard,
    setShowMeetingReadyCard,
    userName,
    handleCopyLink,
    setShowParticipants
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

  const remoteParticipants = Object.values(combinedUserMap)
    .filter((u) => u.socketId !== socketRef.current?.id && u.socketId !== "local")
    .map((u) => {
      const videoObj = videos.find((v) => v.socketId === u.socketId);
      return {
        socketId: u.socketId,
        stream: videoObj ? videoObj.stream : null,
        isLocal: false,
      };
    });

  const allParticipants = [
    { socketId: "local", stream: localStream, isLocal: true },
    ...remoteParticipants,
  ];

  if (pinnedUserId) {
    const pinnedParticipant = allParticipants.find((p) => p.socketId === pinnedUserId) || allParticipants[0];
    const otherParticipants = allParticipants.filter((p) => p.socketId !== pinnedUserId);

    return (
      <div className="flex-1 w-full h-full p-4 md:p-6 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="flex-1 h-full min-h-[300px] md:min-h-0 rounded-[24px] overflow-hidden shadow-lg border border-[#3c4043]">
          <VideoTile socketId={pinnedParticipant.socketId} stream={pinnedParticipant.stream} isLocal={pinnedParticipant.isLocal} sizeClass="w-full h-full" />
        </div>

        {otherParticipants.length > 0 && (
          <div className="w-full md:w-[220px] lg:w-[280px] h-[120px] md:h-full flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0 pb-2 md:pb-0 pr-2">
            {otherParticipants.map((p) => (
              <div key={p.socketId} className="h-full md:h-[140px] lg:h-[170px] shrink-0 w-[160px] md:w-full">
                <VideoTile socketId={p.socketId} stream={p.stream} isLocal={p.isLocal} sizeClass="w-full h-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const currentGridPageSize = isMobile ? 4 : GRID_PAGE_SIZE;
  const totalPages = Math.ceil(allParticipants.length / currentGridPageSize);
  const visibleParticipants = allParticipants.slice(
    gridPage * currentGridPageSize,
    (gridPage + 1) * currentGridPageSize
  );
  const count = visibleParticipants.length;
  let gridClass = "";
  if (count === 1) gridClass = "grid-cols-1 grid-rows-1";
  else if (count === 2)
    gridClass = "grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
  else if (count >= 3 && count <= 4) gridClass = "grid-cols-2 grid-rows-2";
  else if (count >= 5 && count <= 6)
    gridClass = "grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2";
  else gridClass = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 grid-rows-auto";

  return (
    <div className="flex-1 w-full h-full p-4 md:p-6 flex flex-col relative overflow-y-auto">
      <div className={`grid ${gridClass} gap-4 w-full h-full`}>
        {visibleParticipants.map((p) =>
          <VideoTile key={p.socketId} socketId={p.isLocal ? "local" : p.socketId} stream={p.stream} isLocal={p.isLocal} />
        )}
      </div>
      {allParticipants.length === 1 && showMeetingReadyCard && (
        <div className="absolute top-1/2 left-8 md:left-12 -translate-y-1/2 bg-white rounded-xl p-5 shadow-2xl w-80 z-20 font-sans">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-900 font-medium text-[16px]">Your meeting's ready</h3>
            <button 
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full cursor-pointer transition-colors -mt-1 -mr-1" 
              onClick={() => setShowMeetingReadyCard(false)}
            >
              <X size={18} />
            </button>
          </div>
          <button 
            onClick={() => setShowParticipants(true)} 
            className="bg-[#0b57d0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-[14px] font-medium flex items-center gap-2 mb-4 w-max cursor-pointer transition-colors shadow-sm"
          >
            <UserPlus size={18} /> Add others
          </button>
          <p className="text-[13.5px] text-slate-600 mb-3 leading-snug">
            Or share this meeting link with others that you want in the meeting
          </p>
          <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 rounded-md p-2 mb-4">
            <span className="text-[13.5px] text-slate-700 truncate flex-1 pl-1 select-all">{window.location.href}</span>
            <button 
              onClick={handleCopyLink} 
              className="text-slate-500 hover:text-slate-800 cursor-pointer p-1.5 rounded hover:bg-slate-200 transition-colors shrink-0"
            >
              <Copy size={16} />
            </button>
          </div>
          <div className="flex gap-3 text-slate-600 mb-1">
            <ShieldAlert size={16} className="text-[#0b57d0] shrink-0 mt-0.5" />
            <p className="text-[12px] leading-tight">People who use this meeting link must get your permission before they can join.</p>
          </div>
          <p className="text-[12px] text-slate-400 mt-4 border-t border-slate-100 pt-3">Joined as {userName}</p>
        </div>
      )}
      {totalPages > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#3c4043] px-4 py-2 rounded-full shadow-lg z-20">
          <button
            disabled={gridPage === 0}
            onClick={() => setGridPage((p) => p - 1)}
            className="p-1 hover:bg-[#4c5055] rounded-full disabled:opacity-30 text-white cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs text-white">
            {gridPage + 1} / {totalPages}
          </span>
          <button
            disabled={gridPage >= totalPages - 1}
            onClick={() => setGridPage((p) => p + 1)}
            className="p-1 hover:bg-[#4c5055] rounded-full disabled:opacity-30 text-white cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
