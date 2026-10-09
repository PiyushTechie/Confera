import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Keyboard,
  ArrowLeft,
  User,
  Lock,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  VideoOff,
  Loader2,
  ChevronUp
} from "lucide-react";
import brandLogo from "../assets/BrandLogo.png";

export default function GuestJoin() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState(true);
  const videoRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const [devices, setDevices] = useState({ audioInputs: [], videoInputs: [] });
  const [selectedDevices, setSelectedDevices] = useState({ audioInput: "", videoInput: "" });
  const [activeDropdown, setActiveDropdown] = useState(null); // 'audio' or 'video'

  const setupAudioMeter = (stream) => {
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 256;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const update = () => {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      setAudioLevel(sum / bufferLength);
      requestAnimationFrame(update);
    };

    update();
  };

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        setupAudioMeter(stream);

        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = deviceInfos.filter(d => d.kind === "audioinput");
        const videoInputs = deviceInfos.filter(d => d.kind === "videoinput");
        setDevices({ audioInputs, videoInputs });
        const activeVideoTrack = stream.getVideoTracks()[0];
        const activeAudioTrack = stream.getAudioTracks()[0];

        setSelectedDevices({
          audioInput: activeAudioTrack?.getSettings()?.deviceId || (audioInputs.length ? audioInputs[0].deviceId : ""),
          videoInput: activeVideoTrack?.getSettings()?.deviceId || (videoInputs.length ? videoInputs[0].deviceId : "")
        });

      } catch (err) {
        console.error("Error getting media:", err);
      }
    };
    getMedia();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (localStream && videoRef.current) {
      if (videoRef.current.srcObject !== localStream) {
        videoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, video]);

  const handleAudioToggle = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !audio;
      });
      setAudio(!audio);
    }
  };

  const handleVideoToggle = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !video;
      });
      setVideo(!video);
    }
  };

  const switchDevice = async (type, deviceId) => {
    setSelectedDevices(prev => ({ ...prev, [type]: deviceId }));
    try {
      const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768;
      const videoConstraints = isMobileDevice ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } : true;

      const constraints = {
        audio: type === "audioInput" ? { deviceId: { exact: deviceId } } : undefined,
        video: type === "videoInput" ? { deviceId: { exact: deviceId }, ...(!isMobileDevice && { width: { ideal: 1280 }, height: { ideal: 720 } }) } : undefined,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = type === "audioInput" ? newStream.getAudioTracks()[0] : newStream.getVideoTracks()[0];

      if (type === "audioInput") newTrack.enabled = audio;
      if (type === "videoInput") newTrack.enabled = video;

      if (localStreamRef.current) {
        const oldTrack = type === "audioInput"
          ? localStreamRef.current.getAudioTracks()[0]
          : localStreamRef.current.getVideoTracks()[0];

        if (oldTrack) {
          localStreamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStreamRef.current.addTrack(newTrack);
        const updatedStream = new MediaStream(localStreamRef.current.getTracks());
        setLocalStream(updatedStream);
        localStreamRef.current = updatedStream;

        if (type === "audioInput") {
          setupAudioMeter(updatedStream);
        }
      }
    } catch (err) {
      console.error("Error switching device:", err);
    }
  };

  const handleMeetingCodeChange = (e) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (rawValue.length > 9) {
      rawValue = rawValue.slice(0, 9);
    }
    const formatted = rawValue.match(/.{1,3}/g)?.join("-") || "";
    setMeetingCode(formatted);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (meetingCode.replace(/-/g, "").length >= 9 && name.trim().length > 0) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      navigate(`/meeting/${meetingCode}`, {
        state: {
          username: name,
          isAudioOn: audio,
          isVideoOn: video,
          bypassLobby: false,
          isGuest: true,
          selectedAudioInput: selectedDevices.audioInput,
          selectedVideoInput: selectedDevices.videoInput
        },
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.device-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans">
      <nav className="flex items-center justify-between px-6 md:px-16 lg:px-24 py-4 w-full">
        <div className="flex items-center gap-2">
          <img
            src={brandLogo}
            alt="Confera"
            className="h-12 md:h-16 w-auto object-contain"
          />
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-base md:text-lg px-6 py-3 rounded-full hover:bg-slate-50"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
          <span>Back</span>
        </button>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 py-6 md:py-12 gap-12 lg:gap-24">

        <div className="w-full lg:w-[65%] flex flex-col items-center justify-center relative">
          <div className="relative w-full aspect-video bg-[#202124] rounded-2xl md:rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            {localStream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${!video ? "opacity-0" : "opacity-100"}`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                <Loader2 size={40} className="animate-spin text-slate-400" />
              </div>
            )}

            {!video && localStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124] z-10">
                <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-indigo-600 text-white flex items-center justify-center text-6xl md:text-7xl font-medium shadow-2xl">
                  {name ? name.charAt(0).toUpperCase() : <User size={64} />}
                </div>
                <p className="text-[#e8eaed] text-xl md:text-2xl tracking-wide font-normal mt-6">Camera is off</p>
              </div>
            )}

            <div className="absolute bottom-6 left-6 z-20 flex items-center justify-center">
              <div className="h-10 px-4 rounded-full bg-[#3c4043]/80 backdrop-blur-sm flex items-center justify-center gap-1.5">
                <div style={{ height: `${Math.max(6, Math.min(audioLevel / 2.5, 16))}px` }} className="w-1.5 bg-white rounded-full transition-all duration-75" />
                <div style={{ height: `${Math.max(6, Math.min(audioLevel / 1.8, 24))}px` }} className="w-1.5 bg-white rounded-full transition-all duration-75" />
                <div style={{ height: `${Math.max(6, Math.min(audioLevel / 2.5, 16))}px` }} className="w-1.5 bg-white rounded-full transition-all duration-75" />
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 z-20">

              <div className="relative flex items-center device-dropdown-container">
                <div className="flex bg-[#3c4043]/80 hover:bg-[#4a4d51]/90 backdrop-blur-sm rounded-full overflow-visible shadow-xl transition-colors border border-gray-600/50">
                  <button
                    onClick={handleAudioToggle}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-l-full flex items-center justify-center transition-all cursor-pointer ${audio ? "text-white" : "bg-[#ea4335] hover:bg-[#d33426] text-white"
                      }`}
                    title={audio ? "Turn off microphone" : "Turn on microphone"}
                  >
                    {audio ? <Mic size={26} /> : <MicOff size={26} />}
                  </button>
                  <div className="w-[1px] bg-gray-600/50 my-2.5"></div>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === "audio" ? null : "audio")}
                    className="px-3 rounded-r-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ChevronUp size={20} />
                  </button>
                </div>

                {/* Audio Dropdown */}
                {activeDropdown === "audio" && (
                  <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-64 bg-[#202124] rounded-2xl shadow-2xl overflow-hidden py-2 z-50 border border-gray-700">
                    <div className="px-5 py-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">Microphones</div>
                    {devices.audioInputs.map(d => (
                      <div
                        key={d.deviceId}
                        onClick={() => { switchDevice('audioInput', d.deviceId); setActiveDropdown(null); }}
                        className={`px-5 py-3 text-[15px] cursor-pointer hover:bg-gray-800 transition-colors flex items-center gap-3 ${selectedDevices.audioInput === d.deviceId ? "text-indigo-400 font-medium" : "text-gray-200"}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedDevices.audioInput === d.deviceId ? "bg-indigo-500" : "bg-transparent"}`}></div>
                        <span className="truncate">{d.label || "Default Microphone"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex items-center device-dropdown-container">
                <div className="flex bg-[#3c4043]/80 hover:bg-[#4a4d51]/90 backdrop-blur-sm rounded-full overflow-visible shadow-xl transition-colors border border-gray-600/50">
                  <button
                    onClick={handleVideoToggle}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-l-full flex items-center justify-center transition-all cursor-pointer ${video ? "text-white" : "bg-[#ea4335] hover:bg-[#d33426] text-white"
                      }`}
                    title={video ? "Turn off camera" : "Turn on camera"}
                  >
                    {video ? <Video size={26} /> : <VideoOff size={26} />}
                  </button>
                  <div className="w-[1px] bg-gray-600/50 my-2.5"></div>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === "video" ? null : "video")}
                    className="px-3 rounded-r-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ChevronUp size={20} />
                  </button>
                </div>

                {activeDropdown === "video" && (
                  <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-64 bg-[#202124] rounded-2xl shadow-2xl overflow-hidden py-2 z-50 border border-gray-700">
                    <div className="px-5 py-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">Cameras</div>
                    {devices.videoInputs.map(d => (
                      <div
                        key={d.deviceId}
                        onClick={() => { switchDevice('videoInput', d.deviceId); setActiveDropdown(null); }}
                        className={`px-5 py-3 text-[15px] cursor-pointer hover:bg-gray-800 transition-colors flex items-center gap-3 ${selectedDevices.videoInput === d.deviceId ? "text-indigo-400 font-medium" : "text-gray-200"}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedDevices.videoInput === d.deviceId ? "bg-indigo-500" : "bg-transparent"}`}></div>
                        <span className="truncate">{d.label || "Default Camera"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        <div className="w-full lg:w-[35%] flex flex-col justify-center">
          <div className="max-w-[480px] w-full mx-auto text-center lg:text-left">
            <h1 className="text-4xl md:text-[52px] font-normal text-slate-900 mb-3 md:mb-5 tracking-tight">Ready to join?</h1>
            <p className="text-slate-500 mb-10 text-lg">Join as a guest to instantly enter the meeting.</p>

            <form onSubmit={handleJoin} className="space-y-5">

              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Meeting Code (e.g. 123-456-789)"
                    className="w-full bg-transparent border border-slate-300 text-slate-900 text-lg rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 block px-5 py-4 transition-all outline-none"
                    value={meetingCode}
                    onChange={handleMeetingCodeChange}
                    maxLength={11}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Your Display Name"
                    className="w-full bg-transparent border border-slate-300 text-slate-900 text-lg rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 block px-5 py-4 transition-all outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>



              <div className="pt-6 flex items-center justify-center md:justify-start gap-4">
                <button
                  type="submit"
                  disabled={meetingCode.replace(/-/g, "").length < 9 || name.length === 0}
                  className={`w-full md:w-auto min-w-[160px] flex items-center justify-center font-semibold rounded-full text-lg px-8 py-4 transition-all ${meetingCode.replace(/-/g, "").length >= 9 && name.length > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                >
                  Join now
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}