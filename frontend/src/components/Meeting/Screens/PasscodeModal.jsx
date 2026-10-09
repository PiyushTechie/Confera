import React from 'react';
import { Lock } from 'lucide-react';
import { useMeetingContext } from '../../../contexts/MeetingContext';

export default function PasscodeModal() {
  const { navigate, handleSubmitPasscode, passcodeError, passcodeInput, setPasscodeInput } = useMeetingContext();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#202124] text-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-blue-600/20 text-blue-400 rounded-full">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-normal">Meeting is locked</h2>
          <p className="text-gray-400 text-sm">
            This meeting requires a passcode to join.
          </p>
          <form onSubmit={handleSubmitPasscode} className="w-full mt-2">
            <input
              type="password"
              autoFocus
              placeholder="Enter passcode"
              className={`w-full bg-[#3c4043] border ${passcodeError ? "border-red-500" : "border-gray-600"} rounded p-3 text-white focus:outline-none focus:border-blue-500 transition-colors mb-4`}
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
            />
            {passcodeError && (
              <p className="text-red-400 text-xs text-left mb-4 -mt-2">
                Incorrect passcode, please try again.
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 py-3 rounded-full hover:bg-[#3c4043] transition-colors font-medium text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#8ab4f8] text-[#202124] py-3 rounded-full hover:bg-[#d2e3fc] transition-colors font-medium text-sm cursor-pointer"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
