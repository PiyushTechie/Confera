import React from 'react';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MoreVertical, Hand, 
  ScreenShare, Captions, Volume2, Users, MessageSquare, BarChart2, Info, 
  PenTool, Disc, ShieldAlert, Layers, ChevronUp, ChevronDown 
} from 'lucide-react';
import { useMeetingContext } from '../../contexts/MeetingContext';

export default function BottomControlBar() {
  const {
    isSidebarOpen,
    showMoreMenu, setShowMoreMenu,
    handleToggleHand, isHandRaised,
    handleScreen, screen,
    toggleCaptions, showCaptions,
    setShowParticipants, showParticipants,
    setShowChat, showChat,
    setShowPolls,
    setShowInfo, showInfo,
    handleToggleWhiteboard,
    handleToggleRecord, isRecording,
    amIHost, setShowHostSidebar, showHostSidebar,
    isMeetingLocked, togglePiP,
    audio, handleAudio,
    activeDropdown, setActiveDropdown,
    video, handleVideo,
    handleHostLeaveClick,
    getCurrentTime, meetingCode,
    waitingUsers, unreadMessages,
    devices, handleDeviceChange, selectedDevices,
    showEmojiPicker, setShowEmojiPicker,
    EMOJI_LIST, handleSendEmoji
  } = useMeetingContext();

  return (
          <div className={`h-[80px] bg-[#202124] flex items-center justify-between px-6 relative z-50 shrink-0 border-t border-[#3c4043] md:border-t-0 ${isSidebarOpen ? "hidden md:flex" : ""}`}>
            {showMoreMenu && (
              <div
                className="fixed inset-0 z-40 bg-black/40 md:bg-transparent"
                onClick={() => setShowMoreMenu(false)}
              ></div>
            )}
            <div className="hidden sm:flex flex-col text-white min-w-[200px]">
              <div className="font-medium text-[15px] tracking-wide flex items-center gap-2">
                {getCurrentTime()} | {meetingCode}
              </div>
            </div>

            <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2 z-50">
              <div className="relative">
                <div className={`flex items-center rounded-full transition-all ${audio ? "bg-[#3c4043] hover:bg-[#45484c] text-white" : "bg-[#ea4335] hover:bg-[#d93025] text-white"}`}>
                  <button
                    onClick={handleAudio}
                    className={`w-[52px] h-[52px] rounded-l-full flex items-center justify-center cursor-pointer`}
                  >
                    {audio ? <Mic size={24} /> : <MicOff size={24} />}
                  </button>
                  <div className="w-[1px] h-6 bg-gray-500/50"></div>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === 'audio' ? null : 'audio')}
                    className={`w-8 h-[52px] rounded-r-full flex items-center justify-center cursor-pointer`}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
                {activeDropdown === 'audio' && (
                  <div className="absolute bottom-full left-0 mb-4 w-72 bg-[#202124] border border-[#3c4043] rounded-xl shadow-2xl py-3 z-50">
                    <div className="px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Microphone</div>
                    {devices.audioInputs.map((d) => (
                      <button
                        key={d.deviceId}
                        onClick={() => { handleDeviceChange("audioInput", d.deviceId); setActiveDropdown(null); }}
                        className="w-full text-left px-4 py-2 hover:bg-[#3c4043] flex items-center gap-3 text-sm text-gray-200 transition-colors"
                      >
                        <div className="w-5 flex justify-center">{selectedDevices.audioInput === d.deviceId && <Check size={16} className="text-[#8ab4f8]" />}</div>
                        <span className="truncate">{d.label || "Microphone"}</span>
                      </button>
                    ))}
                    {devices.audioOutputs.length > 0 && (
                      <>
                        <div className="px-4 pb-2 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Speaker</div>
                        {devices.audioOutputs.map((d) => (
                          <button
                            key={d.deviceId}
                            onClick={() => { handleDeviceChange("audioOutput", d.deviceId); setActiveDropdown(null); }}
                            className="w-full text-left px-4 py-2 hover:bg-[#3c4043] flex items-center gap-3 text-sm text-gray-200 transition-colors"
                          >
                            <div className="w-5 flex justify-center">{selectedDevices.audioOutput === d.deviceId && <Check size={16} className="text-[#8ab4f8]" />}</div>
                            <span className="truncate">{d.label || "Speaker"}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className={`flex items-center rounded-full transition-all ${video ? "bg-[#3c4043] hover:bg-[#45484c] text-white" : "bg-[#ea4335] hover:bg-[#d93025] text-white"}`}>
                  <button
                    onClick={handleVideo}
                    className={`w-[52px] h-[52px] rounded-l-full flex items-center justify-center cursor-pointer`}
                  >
                    {video ? <Video size={24} /> : <VideoOff size={24} />}
                  </button>
                  <div className="w-[1px] h-6 bg-gray-500/50"></div>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === 'video' ? null : 'video')}
                    className={`w-8 h-[52px] rounded-r-full flex items-center justify-center cursor-pointer`}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
                {activeDropdown === 'video' && (
                  <div className="absolute bottom-full left-0 mb-4 w-72 bg-[#202124] border border-[#3c4043] rounded-xl shadow-2xl py-3 z-50">
                    <div className="px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Camera</div>
                    {devices.videoInputs.map((d) => (
                      <button
                        key={d.deviceId}
                        onClick={() => { handleDeviceChange("videoInput", d.deviceId); setActiveDropdown(null); }}
                        className="w-full text-left px-4 py-2 hover:bg-[#3c4043] flex items-center gap-3 text-sm text-gray-200 transition-colors"
                      >
                        <div className="w-5 flex justify-center">{selectedDevices.videoInput === d.deviceId && <Check size={16} className="text-[#8ab4f8]" />}</div>
                        <span className="truncate">{d.label || "Camera"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={toggleCaptions}
                className={`hidden md:flex w-[52px] h-[52px] rounded-full items-center justify-center transition-all cursor-pointer focus:outline-none ${showCaptions ? "bg-[#a8c7fa] text-[#062e6f]" : "bg-[#3c4043] hover:bg-[#45484c] text-white"}`}
              >
                <Captions size={24} />
              </button>
              <button
                onClick={handleToggleHand}
                className={`hidden md:flex w-[52px] h-[52px] rounded-full items-center justify-center transition-all cursor-pointer focus:outline-none ${isHandRaised ? "bg-[#a8c7fa] text-[#062e6f]" : "bg-[#3c4043] hover:bg-[#45484c] text-white"}`}
              >
                <Hand size={24} />
              </button>
              <button
                onClick={handleScreen}
                className={`hidden md:flex w-[52px] h-[52px] rounded-full items-center justify-center transition-all cursor-pointer focus:outline-none ${screen ? "bg-[#a8c7fa] text-[#062e6f]" : "bg-[#3c4043] hover:bg-[#45484c] text-white"}`}
              >
                {screen ? <MonitorOff size={24} /> : <ScreenShare size={24} />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`w-[52px] h-[52px] rounded-full hidden md:flex items-center justify-center transition-all cursor-pointer focus:outline-none ${showEmojiPicker ? "bg-[#a8c7fa] text-[#062e6f]" : "bg-[#3c4043] hover:bg-[#45484c] text-white"}`}
                >
                  <Smile size={24} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#202124] border border-[#3c4043] rounded-full shadow-xl flex gap-2 p-2 z-50">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleSendEmoji(emoji)}
                        className="hover:bg-[#3c4043] p-2 rounded-full text-xl transition-colors cursor-pointer focus:outline-none"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all cursor-pointer focus:outline-none ${showMoreMenu ? "bg-[#a8c7fa] text-[#062e6f]" : "bg-[#3c4043] hover:bg-[#45484c] text-white"}`}
                >
                  <MoreVertical size={24} />
                </button>
                {showMoreMenu && (
                  <>
                    {/* Mobile Bottom Sheet (Visible only on small screens) */}
                    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#202124] rounded-t-[24px] shadow-2xl pb-8 pt-4 px-4 z-50 animate-slide-up flex flex-col gap-3 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
                        
                        <div className="flex gap-3">
                          <button onClick={() => { handleToggleHand(); setShowMoreMenu(false); }} className={`flex-1 h-16 rounded-[20px] flex items-center justify-center transition-colors cursor-pointer ${isHandRaised ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#3c4043] text-white"}`}>
                            <Hand size={24} />
                          </button>
                          <button onClick={() => { handleScreen(); setShowMoreMenu(false); }} className={`flex-1 h-16 rounded-[20px] flex items-center justify-center transition-colors cursor-pointer ${screen ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#3c4043] text-white"}`}>
                            <ScreenShare size={24} />
                          </button>
                        </div>

                        <div className="flex gap-3">
                          <button onClick={toggleCaptions} className={`flex-1 h-16 rounded-[20px] flex items-center justify-center transition-colors cursor-pointer ${showCaptions ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#3c4043] text-white"}`}>
                            <Captions size={24} />
                          </button>
                          <button onClick={() => { setShowMoreMenu(false); }} className={`flex-1 h-16 rounded-[20px] flex items-center justify-center transition-colors cursor-pointer bg-[#3c4043] text-white`}>
                            <Volume2 size={24} />
                          </button>
                        </div>

                        <button onClick={() => { setShowParticipants(true); setShowMoreMenu(false); }} className="w-full h-16 rounded-[20px] bg-[#3c4043] text-white flex items-center justify-center gap-3 transition-colors cursor-pointer font-medium text-[15px]">
                          <Users size={20} /> People
                        </button>
                        
                        <div className="flex gap-3">
                          <button onClick={() => { setShowChat(true); setShowMoreMenu(false); }} className="flex-1 h-16 rounded-[20px] bg-[#3c4043] text-white flex items-center justify-center gap-3 transition-colors cursor-pointer font-medium text-[15px]">
                            <MessageSquare size={20} /> Chat
                          </button>
                          
                          <button onClick={() => { setShowPolls(true); setShowMoreMenu(false); }} className="flex-1 h-16 rounded-[20px] bg-[#3c4043] text-white flex items-center justify-center gap-3 transition-colors cursor-pointer font-medium text-[15px]">
                            <BarChart2 size={20} /> Polls
                          </button>
                        </div>

                        <div className="flex gap-3">
                          <button onClick={() => { setShowInfo(true); setShowMoreMenu(false); }} className="flex-1 h-16 rounded-[20px] bg-[#3c4043] text-white flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer">
                            <Info size={20} />
                            <span className="text-[12px] font-medium">Info</span>
                          </button>
                          <button onClick={() => { handleToggleWhiteboard(true); setShowMoreMenu(false); }} className="flex-1 h-16 rounded-[20px] bg-[#3c4043] text-white flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer">
                            <PenTool size={20} />
                            <span className="text-[12px] font-medium">Whiteboard</span>
                          </button>
                          <button onClick={() => { handleToggleRecord(); setShowMoreMenu(false); }} className={`flex-1 h-16 rounded-[20px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${isRecording ? "bg-red-500/20 text-red-500" : "bg-[#3c4043] text-white"}`}>
                            <Disc size={20} />
                            <span className="text-[12px] font-medium">Record</span>
                          </button>
                        </div>
                        
                        {amIHost && (
                          <button onClick={() => { setShowHostSidebar(true); setShowMoreMenu(false); }} className="w-full h-16 rounded-[20px] bg-[#3c4043] text-white flex items-center justify-center gap-3 transition-colors cursor-pointer font-medium text-[15px]">
                            <ShieldAlert size={20} className={isMeetingLocked ? "text-blue-400" : ""} /> Host Controls
                          </button>
                        )}
                      </div>

                    <div className="hidden md:block absolute bottom-20 left-1/2 -translate-x-1/2 w-72 bg-[#202124] rounded-lg shadow-2xl py-2 z-50 border border-gray-700">
                        <button
                          onClick={() => {
                            setShowPolls(true);
                            setShowMoreMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[#3c4043] flex items-center gap-3 text-sm text-white cursor-pointer"
                        >
                          <BarChart2 size={20} /> Polls
                        </button>
                        <button
                          onClick={() => { handleToggleWhiteboard(true); setShowMoreMenu(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-[#3c4043] flex items-center gap-3 text-sm text-white cursor-pointer"
                        >
                          <PenTool size={20} /> Whiteboard
                        </button>
                        <button
                          onClick={() => { handleToggleRecord(); setShowMoreMenu(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-[#3c4043] flex items-center gap-3 text-sm text-white cursor-pointer"
                        >
                          <Disc size={20} className={isRecording ? "text-red-500" : ""} />
                          {isRecording ? "Stop recording" : "Record meeting"}
                        </button>
                        <button
                          onClick={() => { togglePiP(); setShowMoreMenu(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-[#3c4043] flex items-center gap-3 text-sm text-white cursor-pointer"
                        >
                          <Layers size={20} /> Picture-in-picture
                        </button>
                      </div>
                  </>
                )}
              </div>
              <button
                onClick={handleHostLeaveClick}
                className="h-[44px] px-8 rounded-full bg-[#ea4335] hover:bg-[#d93025] flex items-center justify-center text-white transition-colors ml-4 shadow-md cursor-pointer"
              >
                <PhoneOff size={24} fill="currentColor" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 justify-end min-w-[200px]">
              <button
                onClick={() => {
                  setShowInfo(!showInfo);
                  setShowParticipants(false);
                  setShowChat(false);
                  setShowHostSidebar(false);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors cursor-pointer ${showInfo ? "text-[#a8c7fa] bg-[#3c4043]" : "text-white hover:bg-[#3c4043]"}`}
              >
                <Info size={24} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => {
                  setShowParticipants(!showParticipants);
                  setShowChat(false);
                  setShowInfo(false);
                  setShowHostSidebar(false);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-full relative transition-colors cursor-pointer ${showParticipants ? "text-[#a8c7fa] bg-[#3c4043]" : "text-white hover:bg-[#3c4043]"}`}
              >
                <Users size={24} strokeWidth={1.5} />
                {waitingUsers.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#202124]"></span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowChat(!showChat);
                  setShowParticipants(false);
                  setShowInfo(false);
                  setShowHostSidebar(false);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-full relative transition-colors cursor-pointer ${showChat ? "text-[#a8c7fa] bg-[#3c4043]" : "text-white hover:bg-[#3c4043]"}`}
              >
                <MessageSquare size={24} strokeWidth={1.5} />
                {unreadMessages > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#202124]"></span>
                )}
              </button>

              {amIHost && (
                <button
                  onClick={() => {
                    setShowHostSidebar(!showHostSidebar);
                    setShowChat(false);
                    setShowParticipants(false);
                    setShowInfo(false);
                  }}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors cursor-pointer ${showHostSidebar ? "text-[#a8c7fa] bg-[#3c4043]" : "text-white hover:bg-[#3c4043]"}`}
                  title="Host Controls"
                >
                  <ShieldAlert
                    size={24}
                    strokeWidth={1.5}
                    className={isMeetingLocked ? "text-blue-400" : ""}
                  />
                </button>
              )}
            </div>
          </div>
  );
}
