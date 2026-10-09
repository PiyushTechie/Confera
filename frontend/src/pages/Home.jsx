import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import ScheduleModal from "../components/ScheduleModal";
import ScheduledList from "../components/ScheduledList";
import logo from "../assets/BrandLogo.png";

import { 
    MdVideoCall, MdKeyboard, MdCalendarToday, MdAdd, 
    MdMic, MdMicOff, MdVideocam, MdVideocamOff, 
    MdClose, MdArrowBack, MdArrowForward, MdVpnKey, MdPerson,
    MdVolumeUp, MdArrowDropDown, MdCheckCircle
} from "react-icons/md";

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    const [currentUser, setCurrentUser] = useState(() => {
        if (userData) return userData;
        try {
            const stored = localStorage.getItem("userData");
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    });

    useEffect(() => { if (userData) setCurrentUser(userData); }, [userData]);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date()); 
    const dateInputRef = useRef(null); 

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [refreshSchedule, setRefreshSchedule] = useState(0);
    const [meetingToEdit, setMeetingToEdit] = useState(null);
    const [showNewMeetingMenu, setShowNewMeetingMenu] = useState(false);

    const [meetingCode, setMeetingCode] = useState("");
    const [passcode, setPasscode] = useState(""); 
    const [inputFocused, setInputFocused] = useState(false);
    
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [generatedMeetingId, setGeneratedMeetingId] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);
    const [isCreatingInstantMeeting, setIsCreatingInstantMeeting] = useState(false);
    const [instantMeetingText, setInstantMeetingText] = useState("Provisioning secure servers...");
    const [participantName, setParticipantName] = useState(""); 
    
    const localVideoRef = useRef(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const [audioLevel, setAudioLevel] = useState(0);

    // Custom Dropdown State
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [devices, setDevices] = useState({
        audioInputs: [],
        videoInputs: [],
        audioOutputs: []
    });

    const [selectedDevices, setSelectedDevices] = useState({
        audioInput: "",
        videoInput: "",
        audioOutput: ""
    });

    const loadDevices = async () => {
        const list = await navigator.mediaDevices.enumerateDevices();

        const audioInputs = list.filter(d => d.kind === "audioinput");
        const videoInputs = list.filter(d => d.kind === "videoinput");
        const audioOutputs = list.filter(d => d.kind === "audiooutput");

        setDevices({ audioInputs, videoInputs, audioOutputs });

        setSelectedDevices(prev => ({
            audioInput: prev.audioInput || (audioInputs.length ? audioInputs[0].deviceId : ""),
            videoInput: prev.videoInput || (videoInputs.length ? videoInputs[0].deviceId : ""),
            audioOutput: prev.audioOutput || (audioOutputs.length ? audioOutputs[0].deviceId : "")
        }));
    };

    const setupAudioMeter = (stream) => {
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

    const switchMicrophone = async (deviceId) => {
        if (!window.previewStream) return;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId } }
        });
        const newTrack = stream.getAudioTracks()[0];
        const oldTrack = window.previewStream.getAudioTracks()[0];
        if (oldTrack) {
            window.previewStream.removeTrack(oldTrack);
            oldTrack.stop();
        }
        if (newTrack) {
            window.previewStream.addTrack(newTrack);
            newTrack.enabled = isAudioOn;
        }
        setSelectedDevices(prev => ({ ...prev, audioInput: deviceId }));
    };

    const switchCamera = async (deviceId) => {
        if (!window.previewStream) return;
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } }
        });
        const newTrack = stream.getVideoTracks()[0];
        const oldTrack = window.previewStream.getVideoTracks()[0];
        if (oldTrack) {
            window.previewStream.removeTrack(oldTrack);
            oldTrack.stop();
        }
        if (newTrack) {
            window.previewStream.addTrack(newTrack);
            newTrack.enabled = isVideoOn;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = window.previewStream;
        }
        setSelectedDevices(prev => ({ ...prev, videoInput: deviceId }));
    };

    const switchSpeaker = async (deviceId) => {
        if (localVideoRef.current && typeof localVideoRef.current.setSinkId === 'function') {
            try {
                await localVideoRef.current.setSinkId(deviceId);
                setSelectedDevices(prev => ({ ...prev, audioOutput: deviceId }));
            } catch (err) {
                console.error("Error setting audio output", err);
            }
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (showPreviewModal && window.previewStream && localVideoRef.current) {
            if (localVideoRef.current.srcObject !== window.previewStream) {
                localVideoRef.current.srcObject = window.previewStream;
            }
        }
    }, [showPreviewModal, isVideoOn]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/auth");
    };

    const handleEditMeeting = (meeting) => { setMeetingToEdit(meeting); setShowScheduleModal(true); };

    const handleInstantMeeting = async () => { 
        setIsJoining(false); 
        setPasscode(""); 
        const id = Math.floor(100000000 + Math.random() * 900000000).toString(); 
        const formattedId = `${id.substring(0,3)}-${id.substring(3,6)}-${id.substring(6,9)}`;
        setGeneratedMeetingId(formattedId); 
        setParticipantName(currentUser?.name || ""); 
        setShowNewMeetingMenu(false);
        setIsCreatingInstantMeeting(true);
        setInstantMeetingText("Provisioning secure servers...");

        const texts = [
            "Provisioning secure servers...",
            "Establishing E2E encryption...",
            "Preparing media bridges...",
            "Opening your meeting room..."
        ];
        
        let i = 0;
        const textInterval = setInterval(() => {
            i++;
            if (i < texts.length) {
                setInstantMeetingText(texts[i]);
            }
        }, 700);
        
        await addToUserHistory(formattedId); 
        
        setTimeout(() => {
            clearInterval(textInterval);
            setIsCreatingInstantMeeting(false);
            navigate(`/meeting/${formattedId}`, { 
                state: { 
                    bypassLobby: true, 
                    isAudioOn: true, 
                    isVideoOn: true, 
                    username: currentUser?.name || "Host", 
                    isHost: true,
                    passcode: "" 
                } 
            }); 
        }, 3000);
    };

    const handleJoinFromInput = () => {
        if (!meetingCode.trim()) return;
        setIsJoining(true);
        setPasscode(""); 
        setGeneratedMeetingId(meetingCode);
        setParticipantName(currentUser?.name || "");
        setShowPreviewModal(true);
        startPreviewCamera();
    };

    const handlePrevDay = () => { 
        const prev = new Date(selectedDate); 
        prev.setDate(prev.getDate() - 1); 
        setSelectedDate(prev); 
    };
    
    const handleNextDay = () => { 
        const next = new Date(selectedDate); 
        next.setDate(next.getDate() + 1); 
        setSelectedDate(next); 
    };
    
    const handleDateChange = (e) => { 
        if(e.target.value) setSelectedDate(new Date(e.target.value)); 
    };

    const startPreviewCamera = async () => {
        if (window.previewStream) return;
        try {
            const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768;
            const videoConstraints = isMobileDevice ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } : true;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: true
            });
            window.previewStream = stream;

            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            setIsVideoOn(videoTrack ? videoTrack.enabled : false);
            setIsAudioOn(audioTrack ? audioTrack.enabled : false);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                await localVideoRef.current.play();
            }

            await loadDevices();
            setupAudioMeter(stream);
        } catch (err) {
            console.error("Media error:", err);
            setIsVideoOn(false);
            setIsAudioOn(false);
        }
    };

    const stopPreviewCamera = () => {
        window.previewStream?.getTracks().forEach(t => t.stop());
        window.previewStream = null;

        if (audioContextRef.current?.state !== "closed") {
            audioContextRef.current?.close();
        }
        audioContextRef.current = null;
        analyserRef.current = null;

        setShowPreviewModal(false);
    };

    const startMeeting = async () => { 
        setIsJoiningMeeting(true);
        stopPreviewCamera(); 
        await addToUserHistory(generatedMeetingId); 
        setTimeout(() => {
            navigate(`/meeting/${generatedMeetingId}`, { 
                state: { 
                    bypassLobby: true, 
                    isAudioOn, 
                    isVideoOn, 
                    username: participantName.trim() || "Guest", 
                    isHost: !isJoining,
                    passcode: passcode 
                } 
            }); 
        }, 1500);
    };

    const togglePreviewVideo = async () => {
        if (window.previewStream) {
            const track = window.previewStream.getVideoTracks()[0];
            if (track) track.enabled = !isVideoOn;
        } else if (!isVideoOn) {
            await startPreviewCamera();
            return;
        }
        setIsVideoOn(!isVideoOn);
    };

    const togglePreviewAudio = async () => {
        if (window.previewStream) {
            const track = window.previewStream.getAudioTracks()[0];
            if (track) track.enabled = !isAudioOn;
        }
        setIsAudioOn(!isAudioOn);
    };

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const calendarDisplayDate = selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    const dateInputValue = selectedDate.toISOString().split('T')[0];

    return (
        <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans flex flex-col text-[#202124]">
            {/* Subtle Animated Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>

            <div className="relative z-10 w-full flex-1 flex flex-col">
                <Navbar user={currentUser} handleLogout={handleLogout} />

                <main className="flex-1 w-full max-w-[1300px] mx-auto px-6 sm:px-8 py-10 lg:py-20 flex flex-col lg:flex-row items-center lg:items-center gap-16 lg:gap-24">
                    
                    {/* Left Column: Hero & Actions */}
                    <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-10">
                        <div className="space-y-6">
                            <h1 className="text-4xl sm:text-[46px] lg:text-[52px] leading-[1.15] font-bold text-slate-900 tracking-tight">
                                Premium video meetings. <br className="hidden sm:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Now free for everyone.</span>
                            </h1>
                            <p className="text-slate-500 text-lg sm:text-[20px] font-medium leading-relaxed max-w-[500px] mx-auto lg:mx-0">
                                Built for secure collaboration. Re-engineered for modern teams. Zero friction, total clarity.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-[600px]">
                            <div className="relative w-full sm:w-auto shrink-0">
                                <button 
                                    onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}
                                    className="bg-[#1a73e8] hover:bg-[#1557b0] text-white h-[48px] px-5 rounded-full font-medium text-[16px] flex items-center justify-center gap-2 transition-colors w-full sm:w-auto cursor-pointer shadow-none border-none whitespace-nowrap"
                                >
                                    <MdVideoCall size={22} />
                                    New meeting
                                </button>

                                {showNewMeetingMenu && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowNewMeetingMenu(false)} />
                                        <div className="absolute top-14 left-0 w-[280px] bg-white rounded-md shadow-lg border border-gray-200 py-2 z-30 overflow-hidden">
                                            <button onClick={handleInstantMeeting} className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-4 text-gray-800 transition-colors cursor-pointer">
                                                <MdAdd size={22} className="text-gray-600" />
                                                <span className="text-[15px] font-medium">Start an instant meeting</span>
                                            </button>
                                            <button onClick={() => {setShowScheduleModal(true); setShowNewMeetingMenu(false);}} className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-4 text-gray-800 transition-colors cursor-pointer">
                                                <MdCalendarToday size={20} className="text-gray-600" />
                                                <span className="text-[15px] font-medium">Schedule in Calendar</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className={`flex items-center h-[48px] rounded-[4px] border px-3 gap-3 transition-colors duration-200 w-full sm:w-[260px] bg-white ${inputFocused ? 'border-[#1a73e8] shadow-[inset_0_0_0_1px_#1a73e8]' : 'border-gray-500 hover:border-gray-800'}`}>
                                    <MdKeyboard size={22} className="text-gray-600" />
                                    <input 
                                        placeholder="Enter a code or link"
                                        className="flex-1 outline-none text-gray-800 placeholder-gray-600 bg-transparent h-full text-[16px] font-normal"
                                        value={meetingCode}
                                        onChange={(e) => setMeetingCode(e.target.value)}
                                        onFocus={() => setInputFocused(true)}
                                        onBlur={() => setInputFocused(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleJoinFromInput()}
                                    />
                                </div>
                                
                                <button 
                                    disabled={!meetingCode} 
                                    onClick={handleJoinFromInput}
                                    className={`text-[16px] font-medium whitespace-nowrap bg-transparent border-none ${meetingCode ? 'text-[#1a73e8] hover:text-[#1557b0] cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                                >
                                    Join
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-slate-200/60 w-full pt-8 max-w-[600px]">
                            <p className="text-slate-500 text-[15px] font-medium">
                                <span className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer transition-colors">Learn more</span> about Confera features.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Scheduled Meetings */}
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                        <div className="w-full max-w-[460px] bg-white rounded-[24px] border border-slate-100 overflow-hidden flex flex-col h-[520px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative z-10">
                            
                            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-white">
                                <div>
                                    <h2 className="text-slate-900 text-[28px] leading-tight font-bold tracking-tight">{formattedTime}</h2>
                                    <p className="text-slate-500 text-[14.5px] mt-1 font-semibold">{calendarDisplayDate}</p> 
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                    <div className="relative group">
                                        <button className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><MdCalendarToday size={20}/></button>
                                        <input 
                                            type="date" 
                                            ref={dateInputRef}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            value={dateInputValue}
                                            onChange={handleDateChange}
                                        />
                                    </div>
                                    <button onClick={handlePrevDay} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><MdArrowBack size={20}/></button>
                                    <button onClick={handleNextDay} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><MdArrowForward size={20}/></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar bg-slate-50/30">
                                <ScheduledList 
                                    refreshTrigger={refreshSchedule}
                                    onEditClick={handleEditMeeting}
                                    onRefresh={() => setRefreshSchedule(prev => prev + 1)}
                                    onOpenSchedule={() => setShowScheduleModal(true)} 
                                    filterDate={selectedDate}
                                />
                            </div>
                        </div>
                    </div>

                </main>
            </div>

            {/* Google Meet Style Full-Screen Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto">
                    {/* Header Minimal Navbar for Preview */}
                    <div className="w-full px-6 py-4 flex items-center justify-between">
                        <img src={logo} alt="Confera" className="h-10 w-auto" />
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 gap-10 lg:gap-20 lg:-mt-16">
                        
                        {/* Camera Preview Section */}
                        <div className="flex flex-col items-center gap-6 w-full max-w-[760px]">
                            <div className="relative w-full aspect-video bg-[#202124] rounded-[24px] overflow-hidden shadow-2xl border border-gray-800">
                                <video 
                                    ref={localVideoRef} 
                                    autoPlay 
                                    muted 
                                    className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`} 
                                />

                                {!isVideoOn && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#202124] z-10">
                                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                                            <MdPerson size={48} className="text-slate-400" />
                                        </div>
                                    </div>
                                )}

                                {/* Camera Controls inside Video */}
                                {!activeDropdown && (
                                    <div className="absolute bottom-6 left-0 w-full flex items-center justify-center z-50">
                                        <div className="flex items-center gap-4 bg-gray-900/60 backdrop-blur-md px-6 py-3 rounded-full">
                                            <button 
                                                onClick={togglePreviewAudio} 
                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${isAudioOn ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                            >
                                                {isAudioOn ? <MdMic size={24} /> : <MdMicOff size={24} />}
                                            </button>
                                            <button 
                                                onClick={togglePreviewVideo} 
                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${isVideoOn ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                            >
                                                {isVideoOn ? <MdVideocam size={24} /> : <MdVideocamOff size={24} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Device Selectors */}
                            <div className="flex flex-wrap justify-center gap-4 w-full relative z-20">
                                <DeviceSelector 
                                    icon={<MdMic size={18} />}
                                    label={devices.audioInputs.find(d => d.deviceId === selectedDevices.audioInput)?.label || "Microphone"}
                                    devices={devices.audioInputs}
                                    selectedId={selectedDevices.audioInput}
                                    onSelect={(id) => switchMicrophone(id)}
                                    isActive={activeDropdown === 'mic'}
                                    onToggle={() => setActiveDropdown(activeDropdown === 'mic' ? null : 'mic')}
                                />
                                <DeviceSelector 
                                    icon={<MdVolumeUp size={18} />}
                                    label={devices.audioOutputs.find(d => d.deviceId === selectedDevices.audioOutput)?.label || "Speaker"}
                                    devices={devices.audioOutputs}
                                    selectedId={selectedDevices.audioOutput}
                                    onSelect={(id) => switchSpeaker(id)}
                                    isActive={activeDropdown === 'speaker'}
                                    onToggle={() => setActiveDropdown(activeDropdown === 'speaker' ? null : 'speaker')}
                                />
                                <DeviceSelector 
                                    icon={<MdVideocam size={18} />}
                                    label={devices.videoInputs.find(d => d.deviceId === selectedDevices.videoInput)?.label || "Camera"}
                                    devices={devices.videoInputs}
                                    selectedId={selectedDevices.videoInput}
                                    onSelect={(id) => switchCamera(id)}
                                    isActive={activeDropdown === 'camera'}
                                    onToggle={() => setActiveDropdown(activeDropdown === 'camera' ? null : 'camera')}
                                />
                            </div>
                        </div>

                        {/* Join Controls Section */}
                        <div className="w-full max-w-[400px] flex flex-col items-center lg:items-start">
                            <h2 className="text-3xl text-slate-900 font-normal tracking-tight text-center lg:text-left mb-2">Ready to join?</h2>
                            
                            {!isJoining && (
                                <p className="text-slate-500 text-[15px] text-center lg:text-left font-medium mb-8">
                                    No one else is here
                                </p>
                            )}
                            {isJoining && <div className="h-8"></div>}

                            <div className="w-full space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                <div>
                                    <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-2 block">Your Name</label>
                                    <div className="relative group">
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-[15px] text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            value={participantName} 
                                            onChange={e=>setParticipantName(e.target.value)} 
                                            placeholder="Enter your name" 
                                        />
                                        <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={22} />
                                    </div>
                                </div>


                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <button 
                                    onClick={startMeeting} 
                                    disabled={!participantName.trim()} 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-[52px] rounded-xl font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
                                >
                                    {isJoining ? 'Ask to join' : 'Join now'}
                                </button>
                            </div>
                            
                            <button onClick={stopPreviewCamera} className="mt-6 text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2 text-[14px] font-semibold transition-colors w-full cursor-pointer hover:bg-slate-50 py-2 rounded-lg">
                                <MdArrowBack size={20} /> Back to home
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isJoiningMeeting && (
                <div className="fixed inset-0 z-[200] bg-[#202124] flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-[38px] h-[38px] border-[4px] border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white mt-6 font-medium text-[15px] tracking-wide">Joining...</p>
                    </div>
                </div>
            )}

            {isCreatingInstantMeeting && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="flex flex-col items-center bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-50">
                            <div className="h-full bg-indigo-600 animate-[loadingBar_2s_ease-in-out_infinite]"></div>
                        </div>
                        <div className="relative mb-8 mt-2">
                            <div className="w-20 h-20 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MdVideoCall size={32} className="text-indigo-600 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 font-heading tracking-tight">Setting up meeting</h3>
                        <p className="text-slate-500 font-medium text-center h-6 text-sm transition-opacity duration-300">{instantMeetingText}</p>
                    </div>
                    <style>{`
                        @keyframes loadingBar {
                            0% { width: 0%; margin-left: 0; }
                            50% { width: 100%; margin-left: 0; }
                            100% { width: 0%; margin-left: 100%; }
                        }
                    `}</style>
                </div>
            )}

            <ScheduleModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} onSuccess={() => setRefreshSchedule(p => p + 1)} meetingToEdit={meetingToEdit} />
        </div>
    );
}

// Reusable component for device dropdowns
const DeviceSelector = ({ icon, label, devices, selectedId, onSelect, isActive, onToggle }) => (
    <div className="relative">
        <button 
            onClick={onToggle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white text-[14px] font-medium text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
        >
            <span className="text-slate-500">{icon}</span>
            <span className="max-w-[140px] truncate">{label}</span>
            <MdArrowDropDown size={20} className="text-slate-400" />
        </button>

        {isActive && (
            <>
                <div className="fixed inset-0 z-40" onClick={onToggle}></div>
                <div 
                    className="absolute bottom-full mb-2 left-0 w-max min-w-[200px] bg-white border border-slate-100 rounded-xl shadow-xl py-2 max-h-60 overflow-y-auto z-50 custom-scrollbar"
                >
                    {devices.length === 0 && <div className="px-4 py-2 text-[14px] text-slate-500">No devices found</div>}
                    {devices.map(d => (
                        <button
                            key={d.deviceId}
                            onClick={() => { onSelect(d.deviceId); onToggle(); }}
                            className={`w-full text-left px-4 py-2.5 text-[14px] font-medium flex items-center hover:bg-slate-50 transition-colors cursor-pointer ${selectedId === d.deviceId ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                        >
                            <span className="truncate pr-4">{d.label || "System Default"}</span>
                            {selectedId === d.deviceId && <MdCheckCircle size={16} className="ml-auto text-indigo-500 shrink-0" />}
                        </button>
                    ))}
                </div>
            </>
        )}
    </div>
);

export default HomeComponent;