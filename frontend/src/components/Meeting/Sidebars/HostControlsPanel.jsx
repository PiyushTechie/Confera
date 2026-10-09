import React from 'react';
import { ScreenShare, MessageSquare, Smile, PenTool, Mic, Video as VideoIcon, Lock } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';

const ToggleSwitch = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${checked ? "bg-[#8ab4f8]" : "bg-[#5f6368]"}`}
  >
    <div
      className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`}
    ></div>
  </button>
);

export default function HostControlsPanel() {
  const {
    securitySettings,
    toggleSecuritySetting,
    isMeetingLocked,
    handleToggleLock
  } = useMeetingContext();

  return (
    <div className="p-0">
      <div className="p-4 text-sm text-gray-300 border-b border-[#3c4043]">
        Use these host settings to keep control of your meeting.
        Only hosts have access to these controls.
      </div>

      <div className="p-4 border-b border-[#3c4043]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-white text-base">
            Host management
          </h3>
          <ToggleSwitch checked={true} onChange={() => {}} />
        </div>
        <p className="text-xs text-gray-400">
          Lets you restrict what contributors can do in the
          meeting.
        </p>
      </div>

      <div className="p-4 space-y-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Let contributors
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScreenShare size={20} className="text-gray-400" />
            <span className="text-white text-sm">
              Share their screen
            </span>
          </div>
          <ToggleSwitch
            checked={!securitySettings.isScreenShareLocked}
            onChange={() => toggleSecuritySetting("isScreenShareLocked")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare size={20} className="text-gray-400" />
            <span className="text-white text-sm">
              Send chat messages
            </span>
          </div>
          <ToggleSwitch 
            checked={!securitySettings.isChatLocked} 
            onChange={() => toggleSecuritySetting("isChatLocked")} 
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smile size={20} className="text-gray-400" />
            <span className="text-white text-sm">
              Send reactions
            </span>
          </div>
          <ToggleSwitch 
            checked={!securitySettings.isReactionsLocked} 
            onChange={() => toggleSecuritySetting("isReactionsLocked")} 
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenTool size={20} className="text-gray-400" />
            <span className="text-white text-sm">
              Open whiteboard
            </span>
          </div>
          <ToggleSwitch 
            checked={!securitySettings.isWhiteboardLocked} 
            onChange={() => toggleSecuritySetting("isWhiteboardLocked")} 
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic size={20} className="text-gray-400" />
            <span className="text-white text-sm">
              Turn on their microphone
            </span>
          </div>
          <ToggleSwitch 
            checked={!securitySettings.isMicLocked} 
            onChange={() => toggleSecuritySetting("isMicLocked")} 
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VideoIcon size={20} className="text-gray-400" />
            <span className="text-white text-sm">
              Turn on their video
            </span>
          </div>
          <ToggleSwitch
            checked={!securitySettings.isCamLocked}
            onChange={() => toggleSecuritySetting("isCamLocked")}
          />
        </div>
      </div>

      <div className="p-4 border-t border-[#3c4043] mt-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
          Meeting Access
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-gray-400" />
            <div>
              <div className="text-white text-sm">
                Meeting Lock
              </div>
              <div className="text-xs text-gray-500">
                Only people with invite can join
              </div>
            </div>
          </div>
          <ToggleSwitch
            checked={isMeetingLocked}
            onChange={handleToggleLock}
          />
        </div>
      </div>
    </div>
  );
}
