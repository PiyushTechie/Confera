import React from 'react';
import { Copy } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';

export default function InfoPanel() {
  const { handleCopyLink } = useMeetingContext();

  return (
    <div className="p-4 space-y-6 text-white">
      <div>
        <h3 className="font-medium text-lg mb-4">Joining Info</h3>
        <div className="text-sm text-gray-400 font-medium mb-1">
          Meeting link
        </div>
        <div className="text-sm text-gray-300 mb-2 truncate bg-[#3c4043] p-3 rounded">
          {window.location.href}
        </div>
        <button
          onClick={handleCopyLink}
          className="text-[#8ab4f8] text-sm font-medium flex items-center gap-2 hover:bg-[#3c4043] px-3 py-2 rounded-full -ml-3 transition-colors cursor-pointer"
        >
          <Copy size={18} /> Copy joining info
        </button>
      </div>
    </div>
  );
}
