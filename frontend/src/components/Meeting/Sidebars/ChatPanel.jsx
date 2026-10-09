import React from 'react';
import { Send } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';

export default function ChatPanel() {
  const {
    messages,
    chatContainerRef,
    currentMessage,
    setCurrentMessage,
    handleSendMessage
  } = useMeetingContext();

  return (
    <div className="flex flex-col h-full bg-[#202124]">
      <div className="bg-[#3c4043] p-3 text-xs text-gray-300 text-center">
        Messages can only be seen by people in the call and are
        deleted when the call ends.
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.isMe ? "items-end" : "items-start"}`}
          >
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-bold text-gray-400">
                {m.sender}
              </span>
              <span className="text-[10px] text-gray-500">
                {new Date(m.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div
              className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${m.isMe ? "bg-[#8ab4f8] text-[#202124] rounded-tr-sm" : "bg-[#3c4043] text-white rounded-tl-sm"}`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatContainerRef} />
      </div>
      <div className="p-4 bg-[#202124] border-t border-[#3c4043]">
        <div className="relative">
          <input
            className="w-full bg-[#3c4043] rounded-full pl-5 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8ab4f8] transition-all"
            placeholder="Send a message..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSendMessage()
            }
          />
          <button
            onClick={handleSendMessage}
            className="absolute right-2 top-1.5 p-1.5 text-[#8ab4f8] hover:bg-[#3c4043] rounded-full cursor-pointer"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
