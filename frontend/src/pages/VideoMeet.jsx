import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MonitorOff,
  MessageSquare,
  PhoneOff,
  Info,
  X,
  Send,
  Copy,
  Users,
  Lock,
  Hand,
  Smile,
  Unlock,
  Pin,
  Crown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Captions,
  Disc,
  LogOut,
  ChevronUp,
  Check,
  BarChart2,
  PenTool,
  Layers,
  BatteryCharging,
  Shield,
  UserPlus,
  ShieldAlert,
  Keyboard,
  Search,
  Video as VideoIcon,
  Volume2,
  Settings,
  AlertTriangle,
} from "lucide-react";
import server from "../environment";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import waitingIllustration from "../assets/waiting-illustration.png";
const server_url = server;
import { MediasoupClient } from "../lib/MediasoupClient";

const getUserColor = (socketId = "") => {
  const colors = [
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
    "#f97316",
    "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < socketId.length; i++)
    hash = socketId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getAvatarColor = (name) => {
  const colors = [
    "bg-red-600",
    "bg-orange-600",
    "bg-amber-600",
    "bg-green-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-violet-600",
    "bg-purple-600",
    "bg-fuchsia-600",
    "bg-pink-600",
    "bg-rose-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};


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

import AvatarFallback from "../components/Meeting/AvatarFallback";
import VideoPlayer from "../components/Meeting/VideoPlayer";
import WaitingRoom from "../components/Meeting/WaitingRoom";
import CollaborativeWhiteboard from "../components/Meeting/CollaborativeWhiteboard";
import { MeetingContext } from "../../contexts/MeetingContext";
import LeftMeetingScreen from "../components/Meeting/Screens/LeftMeetingScreen";
import JoinMeetingScreen from "../components/Meeting/Screens/JoinMeetingScreen";
import PasscodeModal from "../components/Meeting/Screens/PasscodeModal";
import ParticipantsPanel from "../components/Meeting/Sidebars/ParticipantsPanel";
import ChatPanel from "../components/Meeting/Sidebars/ChatPanel";
import InfoPanel from "../components/Meeting/Sidebars/InfoPanel";
import HostControlsPanel from "../components/Meeting/Sidebars/HostControlsPanel";
import BottomControlBar from "../components/Meeting/BottomControlBar";
import VideoGrid from "../components/Meeting/Grid/VideoGrid";


export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { url: meetingCodeParam } = useParams();
  const meetingCode = meetingCodeParam
    ? meetingCodeParam.trim().toLowerCase()
    : "";

  const {
    bypassLobby = false,
    isAudioOn = true,
    isVideoOn = true,
    username = "Guest",
    passcode = null,
    isGuest = false,
    isHost = false,
  } = location.state || {};
  const hasToken = Boolean(localStorage.getItem("token"));
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const connectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const displayStreamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalysersRef = useRef({});
  const [askForUsername, setAskForUsername] = useState(false);
  const [userName, setUsername] = useState(() => {
    if (hasToken && (!username || username === "Guest")) return "User";
    return username || "Guest";
  });
  const isMountedRef = useRef(true);
  const [video, setVideo] = useState(isVideoOn ?? true);
  const [audio, setAudio] = useState(isAudioOn ?? true);
  const [screen, setScreen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [userMap, setUserMap] = useState({});
  const userMapRef = useRef(userMap);
  useEffect(() => {
    userMapRef.current = userMap;
  }, [userMap]);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [roomHostId, setRoomHostId] = useState(null);
  const [amIHost, setAmIHost] = useState(isHost || false);
  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  });
  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: location.state?.selectedAudioInput || "",
    videoInput: location.state?.selectedVideoInput || "",
    audioOutput: "",
  });
  const [isAudioConnected, setIsAudioConnected] = useState(true);
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [gridPage, setGridPage] = useState(0);
  const GRID_PAGE_SIZE = 16;
  const [isAskingToJoin, setIsAskingToJoin] = useState(false);
  
  // UI Toggles
  const [showInfo, setShowInfo] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHostSidebar, setShowHostSidebar] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [isScreenShareLocked, setIsScreenShareLocked] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeEmojis, setActiveEmojis] = useState({});
  const [showCaptions, setShowCaptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [remoteCaption, setRemoteCaption] = useState(null);
  const [handQueue, setHandQueue] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeReactions, setActiveReactions] = useState({});
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [showMeetingReadyCard, setShowMeetingReadyCard] = useState(true);
  const [hasLeftMeeting, setHasLeftMeeting] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const addFloatingReaction = (emoji, socketId) => {
    const senderName = socketId === "Me" ? "You" : userMapRef.current[socketId]?.username || "Someone";
    const id = Date.now() + Math.random();
    const leftPos = Math.floor(Math.random() * 20) + 5;
    setFloatingReactions((prevReactions) => [...prevReactions, { id, emoji, senderName, left: leftPos }]);
    setTimeout(() => {
      setFloatingReactions((prevReactions) => prevReactions.filter((r) => r.id !== id));
    }, 4000);
  };
  const {
    startListening,
    stopListening,
    captions: localCaption,
  } = useSpeechRecognition(socketInstance, meetingCode, userName);
  const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "👏", "🎉"];
  const getRoomId = () => meetingCode.trim().toLowerCase();
  const pendingIce = useRef({});
  const roomHostIdRef = useRef(null);
  const screenRef = useRef(false);           
  const isAudioConnectedRef = useRef(true);
  const mediasoupClientRef = useRef(null);
  const [showLeaveMenu, setShowLeaveMenu] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [hasVoted, setHasVoted] = useState(false);
  
  
  
  
const amIHostRef = useRef(amIHost);
const waitingUsersRef = useRef(waitingUsers);

useEffect(() => {
  amIHostRef.current = amIHost;
}, [amIHost]);

useEffect(() => {
  waitingUsersRef.current = waitingUsers;
}, [waitingUsers]);

  const [securitySettings, setSecuritySettings] = useState({
    isMeetingLocked: false,
    isScreenShareLocked: false,
    isChatLocked: false,
    isMicLocked: false,
    isCamLocked: false,
    isReactionsLocked: false,
    isWhiteboardLocked: false,
  });

  const toggleSecuritySetting = (settingKey) => {
    if (!amIHost) return;
    const newSettings = { ...securitySettings, [settingKey]: !securitySettings[settingKey] };
    setSecuritySettings(newSettings);
    
    if (socketRef.current) {
      socketRef.current.emit("update-security", newSettings);
    }
  };

  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    roomHostIdRef.current = roomHostId;
  }, [roomHostId]);
  

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const addToast = (msg, type = "info") => {
    switch (type) {
      case "error":
        toast.error(msg);
        break;
      case "success":
        toast.success(msg);
        break;
      default:
        toast(msg, { icon: "ℹ️" });
        break;
    }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const videoElements = Array.from(document.getElementsByTagName("video"));
        
        if (videoElements.length > 0) {
          const targetVideo = videoElements.find(v => !v.muted) || videoElements[0];
          await targetVideo.requestPictureInPicture();
          
          setShowMoreMenu(false);
        } else {
          addToast("No video available to pop out", "error");
        }
      }
    } catch (err) {
      console.error(err);
      addToast("PiP failed: Your browser might block this action", "error");
    }
  };

  const toggleAudioOnly = () => {
    const newState = !isAudioOnly;
    setIsAudioOnly(newState);
    setVideos((prev) =>
      prev.map((v) => {
        if (v.stream && !v.isLocal) {
          v.stream.getVideoTracks().forEach((t) => (t.enabled = !newState));
        }
        return v;
      }),
    );
    addToast(newState ? "Audio Only Mode Active" : "Video Enabled", "info");
  };

  const handleToggleWhiteboard = (open = true) => {
    if (typeof open !== "boolean") open = true;
    if (open && !amIHost && securitySettings.isWhiteboardLocked) {
      addToast("The host has disabled the whiteboard.", "error");
      return;
    }
    setShowMoreMenu(false);
    try {
      const roomId = meetingCode.trim().toLowerCase();
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("whiteboard-toggle", { roomId, isOpen: open });
      }
    } catch (e) {
      console.warn("Whiteboard toggle emit failed", e);
    }
    setShowWhiteboard(open);
  };

  const handleSpotlightUser = (targetId) => {
    if (amIHost) {
      socketRef.current.emit("spotlight-user", targetId);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addToast("Recording saved", "success");
    } else {
      const stream = displayStreamRef.current || localStreamRef.current;
      if (!stream) return addToast("No stream to record", "error");
      const options = { mimeType: "video/webm; codecs=vp9" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        recordedChunksRef.current = [];
      };
      mediaRecorder.start();
      setIsRecording(true);
      addToast("Recording started", "info");
    }
  };
  const toggleCaptions = () => {
    if (!showCaptions) {
      startListening();
      setShowCaptions(true);
      addToast("Captions enabled", "success");
    } else {
      stopListening();
      setShowCaptions(false);
      addToast("Captions disabled", "info");
    }
  };
  const getMedia = async () => {
    try {
      const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768;
      const videoConstraints = isMobileDevice 
        ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }
        : true;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedDevices.videoInput ? { ...(isMobileDevice ? videoConstraints : {}), deviceId: { exact: selectedDevices.videoInput } } : videoConstraints,
        audio: selectedDevices.audioInput ? { deviceId: { exact: selectedDevices.audioInput } } : true,
      });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      if (!video) stream.getVideoTracks().forEach((t) => (t.enabled = false));
      if (!audio) stream.getAudioTracks().forEach((t) => (t.enabled = false));
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (!audioContextRef.current)
        audioContextRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      await getDeviceList();
    } catch (err) {
      console.error("Media error:", err);
      addToast("Camera/Mic access denied", "error");
    }
  };
  const getDeviceList = async () => {
    try {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        audioInputs: deviceInfos.filter((d) => d.kind === "audioinput"),
        videoInputs: deviceInfos.filter((d) => d.kind === "videoinput"),
        audioOutputs: deviceInfos.filter((d) => d.kind === "audiooutput"),
      });
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };
  
  const handleDeviceChange = async (type, deviceId) => {
  setSelectedDevices((prev) => ({ ...prev, [type]: deviceId }));
  if (type === "audioOutput") return;

  const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768;
  const videoConstraints = isMobileDevice ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } : {};

  const constraints = {
    audio: type === "audioInput" ? { deviceId: { exact: deviceId } } : undefined,
    video: type === "videoInput" ? { ...videoConstraints, deviceId: { exact: deviceId } } : undefined,
  };

  try {
    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    const newTrack =
      type === "audioInput"
        ? newStream.getAudioTracks()[0]
        : newStream.getVideoTracks()[0];

    if (type === "audioInput") newTrack.enabled = audio;
    if (type === "videoInput") newTrack.enabled = video;

    const oldTrack =
      type === "audioInput"
        ? localStreamRef.current.getAudioTracks()[0]
        : localStreamRef.current.getVideoTracks()[0];

    if (oldTrack) {
      localStreamRef.current.removeTrack(oldTrack);
      oldTrack.stop();
    }

    localStreamRef.current.addTrack(newTrack);
    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

    Object.values(connectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find(
        (s) => s.track && s.track.kind === (type === "audioInput" ? "audio" : "video")
      );
      if (sender) sender.replaceTrack(newTrack);
    });
  } catch (err) {
    console.error("Device switch failed", err);
  }
};

  const toggleAudioConnection = async () => {
    if (isAudioConnected) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = false;
        t.stop();
      });
      setIsAudioConnected(false);
      isAudioConnectedRef.current = false;
      setAudio(false);
      socketRef.current.emit("toggle-audio", { isMuted: true });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: selectedDevices.audioInput
              ? { exact: selectedDevices.audioInput }
              : undefined,
          },
        });
        const newTrack = stream.getAudioTracks();
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        Object.values(connectionsRef.current).forEach((pc) => {
          const audioTrack = Array.isArray(newTrack) ? newTrack[0] : newTrack;
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "audio");

        if (sender) sender.replaceTrack(audioTrack);
        else pc.addTrack(audioTrack, localStreamRef.current);
        });
        setIsAudioConnected(true);
        isAudioConnectedRef.current = true;
        setAudio(true);
        socketRef.current.emit("toggle-audio", { isMuted: false });
      } catch (e) {
        console.error("Audio Reconnect Failed", e);
      }
    }
  };

  useEffect(() => {
    if (!socketRef.current) return;

    const handleSecurityUpdate = (newSettings) => {
      setSecuritySettings(newSettings);
      if (amIHost) return;

      if (newSettings.isMicLocked && audio) {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) track.enabled = false;
        setAudio(false);
        socketRef.current.emit("toggle-audio", { isMuted: true });
        addToast("Host muted all microphones", "error");
      }
      
      if (newSettings.isCamLocked && video) {
        const track = localStreamRef.current?.getVideoTracks()[0];
        if (track) track.enabled = false;
        setVideo(false);
        socketRef.current.emit("toggle-video", { isVideoOff: true });
        addToast("Host disabled all cameras", "error");
      }

      if (newSettings.isScreenShareLocked && screen) {
        displayStreamRef.current?.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        Object.values(connectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender && camTrack) sender.replaceTrack(camTrack);
        });
        setScreen(false);
        if (pinnedUserId === "local" || pinnedUserId === socketRef.current.id) {
          setPinnedUserId(null);
          socketRef.current.emit("spotlight-user", null);
        }
        addToast("Host disabled screen sharing", "error");
      }
    };

    socketRef.current.on("security-updated", handleSecurityUpdate);
    return () => socketRef.current.off("security-updated", handleSecurityUpdate);
  }, [audio, video, screen, amIHost, pinnedUserId]);


  useEffect(() => {
    if (!audioContextRef.current) return;
    videos.forEach((v) => {
      if (
        v.stream &&
        v.stream.active &&
        v.stream.getAudioTracks().length > 0 &&
        !audioAnalysersRef.current[v.socketId]
      ) {
        try {
          const source = audioContextRef.current.createMediaStreamSource(
            v.stream,
          );
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          audioAnalysersRef.current[v.socketId] = analyser;
        } catch (e) {}
      }
    });
    const currentSocketIds = videos.map((v) => v.socketId);
    Object.keys(audioAnalysersRef.current).forEach((id) => {
      if (!currentSocketIds.includes(id)) delete audioAnalysersRef.current[id];
    });
  }, [videos]);
  
  useEffect(() => {
    if (localCaption && socketRef.current) {
      socketRef.current.emit("send-caption", {
        roomId: meetingCode.trim().toLowerCase(),
        caption: localCaption,
        username: userName,
      });
    }
  }, [localCaption, meetingCode, userName]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!audioContextRef.current) return;
      let maxVolume = 0;
      let loudestSpeaker = null;
      Object.entries(audioAnalysersRef.current).forEach(
        ([socketId, analyser]) => {
          try {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const volume = sum / dataArray.length;
            if (volume > 20 && volume > maxVolume) {
              maxVolume = volume;
              loudestSpeaker = socketId;
            }
          } catch (e) {}
        },
      );
      if (loudestSpeaker && loudestSpeaker !== activeSpeakerId)
        setActiveSpeakerId(loudestSpeaker);
    }, 500);
    return () => clearInterval(interval);
  }, [activeSpeakerId]);

  // WebRTC logic moved to MediasoupClient

  const connectSocket = () => {
    console.log("🚨 connectSocket called");
    console.log("🚨 isHost:", isHost);
    console.log("🚨 isGuest:", isGuest);
    console.log("🚨 bypassLobby:", bypassLobby);
    console.log("🚨 hasToken:", hasToken);
    console.log("🚨 username:", username);
    console.log("🚨 location.state:", location.state);

    if (socketRef.current) return;
    const token = localStorage.getItem("token");
    socketRef.current = io(server_url, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
       console.log("🚨 TAKING PATH - isHost:", isHost);
  socketIdRef.current = socketRef.current.id;
  const payload = {
    path: meetingCode.trim().toLowerCase(),
    username: userName,
    passcode: passcodeInput || passcode,
  };

  if (isHost) {
    // 1. The user clicked "New Meeting"
    socketRef.current.emit("create-meeting", {
      path: getRoomId(),
      passcode: payload.passcode,
      username: userName,
    });

    socketRef.current.once("meeting-created", () => {
      setAmIHost(true);
      setIsInWaitingRoom(false);
      socketRef.current.emit("join-call", {
        path: payload.path,
        username: userName,
        passcode: payload.passcode,
      });
    });

    socketRef.current.once("room-already-active", () => {
      // Host dropped connection and is rejoining their own room
      setAmIHost(true);
      setIsInWaitingRoom(false); 
      socketRef.current.emit("join-call", {
        path: payload.path,
        username: userName,
        passcode: payload.passcode,
      });
    });
    
  } else {
    // 2. This is a participant joining an existing meeting
    setIsInWaitingRoom(true);

    if (isGuest) {
      socketRef.current.emit("guest-request-join", {
        meetingCode: getRoomId(),
        username: userName,
        passcode: passcodeInput || passcode,
      });
    } else {
      socketRef.current.emit("request-join", {
        path: getRoomId(),
        username: userName,
        passcode: payload.passcode,
      });
    }
  }
});
    
    socketRef.current.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
      if (
        err.message === "Socket token missing" ||
        err.message === "Invalid or expired socket token"
      ) {
        addToast("Connection refused: " + err.message, "error");
      }
    });

    socketRef.current.on("passcode-required", () => {
      setIsInWaitingRoom(false);
      setShowPasscodeModal(true);
      setPasscodeError(true);
      socketRef.current.disconnect();
    });
    
    socketRef.current.on("meeting-locked", () => {
      addToast("This meeting is locked", "error");
      setTimeout(cleanupAndLeave, 2000);
    });
    
    socketRef.current.on("invalid-meeting", () => {
      addToast("Meeting not found!", "error");
      setTimeout(cleanupAndLeave, 2000);
    });
    
    
    
    socketRef.current.on("guest-rejected", () => {
      addToast("Host rejected your request", "error");
      setTimeout(cleanupAndLeave, 1500);
    });
    
    socketRef.current.on("meeting-ended", () => {
      const currentHostId = roomHostIdRef.current;
      const myId = socketRef.current?.id;
      if (currentHostId !== myId) {
        addToast("Host ended the meeting.", "error");
        setTimeout(() => cleanupAndLeave(), 1500);
      }
    });
    
    
    const handleAdmitted = () => {
  console.log("✅ USER ADMITTED -> JOINING CALL");

  setIsInWaitingRoom(false);

  socketRef.current.emit("join-call", {
    path: meetingCode.trim().toLowerCase(),
    username: userName,
    passcode: passcodeInput || passcode,
  });
};

socketRef.current.on("guest-admitted", handleAdmitted);
socketRef.current.on("admitted", handleAdmitted);

socketRef.current.on("update-waiting-list", (users) => {
console.log("WAITING LIST RECEIVED:", users);

  // Safeguard: Force it into an array in case the backend sends a single object
  const waitingArray = Array.isArray(users) ? users : [users];

  // Use the refs to read the fresh state instead of the trapped initial state
  if (amIHostRef.current && waitingArray.length > waitingUsersRef.current.length) {
    addToast("Someone is waiting to join", "info");
  }

  // Update the actual state using the sanitized array
  setWaitingUsers(waitingArray);
});

    socketRef.current.on("all-users", async (users) => {
      const newUsers = {};
      users.forEach((u) => {
        newUsers[u.socketId] = u;
      });
      setUserMap((prev) => ({ ...prev, ...newUsers }));

      if (!mediasoupClientRef.current) {
        try {
          const mc = new MediasoupClient(socketRef.current, meetingCode.trim().toLowerCase(), (producerSocketId, track, kind, appData) => {
              const stream = new MediaStream([track]);
              setVideos((prev) => {
                const existingIndex = prev.findIndex((v) => v.socketId === producerSocketId);
                if (existingIndex > -1) {
                    const existingStream = prev[existingIndex].stream;
                    if (existingStream) existingStream.addTrack(track);
                    return [...prev];
                } else {
                    return [...prev, { socketId: producerSocketId, stream }];
                }
              });
          });
          mediasoupClientRef.current = mc;
          await mc.init();
  
          const videoTrack = localStreamRef.current?.getVideoTracks()[0];
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
  
          if (videoTrack) await mc.produce(videoTrack, { type: 'video' });
          if (audioTrack && isAudioConnectedRef.current) await mc.produce(audioTrack, { type: 'audio' });
  
          socketRef.current.emit('getProducers', async (res) => {
              if (res.producers && !res.error) {
                  for (const p of res.producers) {
                      await mc.consume(p.producerId, p.socketId, p.appData);
                  }
              }
          });
        } catch (err) {
          console.error("Mediasoup init error", err);
        }
      }
    });

    socketRef.current.on("user-joined", (user) => {
      if (user.socketId === socketRef.current.id) return;
      const completeUser = {
        ...user,
        isHandRaised: false,
        isVideoOff: false, 
        isMuted: false,
      };
      setUserMap((prev) => ({ ...prev, [user.socketId]: completeUser }));
      addToast(`${user.username} joined`, "info");
    });

    socketRef.current.on("poll-started", (poll) => {
      setActivePoll(poll);
      setShowPolls(true);
      addToast("A new poll has started!", "info");
    });
    socketRef.current.on("poll-updated", (updatedPoll) => {
      setActivePoll(updatedPoll);
    });
    socketRef.current.on("poll-ended", () => {
      setActivePoll(null);
      setShowPolls(false);
      addToast("Poll ended", "info");
    });
    socketRef.current.on("whiteboard-toggle", (isOpen) => {
      setShowWhiteboard(!!isOpen);
    });
    
    socketRef.current.on("spotlight-user", (userId) => {
      setPinnedUserId(userId);
      if (userId) {
        addToast("A participant's screen was pinned", "info");
      }
    });
    
    socketRef.current.on("hand-toggled", ({ socketId, isRaised, username }) => {
      if (socketId === socketRef.current.id) {
        setIsHandRaised(isRaised);
        return;
      }
      
      setUserMap((prev) => {
        const targetUser = prev[socketId];
        
        if (isRaised && targetUser) {
          addToast(`${targetUser.username} raised their hand ✋`, "info");
        }
        
        if (!targetUser) return prev;
        return {
          ...prev,
          [socketId]: { ...targetUser, isHandRaised: isRaised },
        };
      });
    });

    socketRef.current.on("audio-toggled", ({ socketId, isMuted }) => {
      if (socketId === socketRef.current.id) return;
      setUserMap((prev) => {
        if (!prev[socketId]) return prev;
        return { ...prev, [socketId]: { ...prev[socketId], isMuted: isMuted } };
      });
    });
    socketRef.current.on("video-toggled", ({ socketId, isVideoOff }) => {
      if (socketId === socketRef.current.id) return;
      setUserMap((prev) => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: { ...prev[socketId], isVideoOff: isVideoOff },
        };
      });
    });
    socketRef.current.on("emoji-received", ({ socketId, emoji }) => {
      if (socketId !== socketIdRef.current) {
        addFloatingReaction(emoji, socketId);
      }
      setActiveEmojis((prev) => ({ ...prev, [socketId]: emoji }));
      setTimeout(() => {
        setActiveEmojis((prev) => {
          const newState = { ...prev };
          delete newState[socketId];
          return newState;
        });
      }, 3000);
    });
    socketRef.current.on("reaction-received", ({ socketId, reaction }) => {
      if (socketId !== socketIdRef.current) {
        addFloatingReaction(reaction, socketId);
      }
      setActiveReactions((prev) => ({ ...prev, [socketId]: reaction }));
      setTimeout(() => {
        setActiveReactions((prev) => {
          const newState = { ...prev };
          delete newState[socketId];
          return newState;
        });
      }, 5000);
    });
    socketRef.current.on("receive-caption", (data) => {
      if (showCaptions) {
        setRemoteCaption(data);
        setTimeout(() => setRemoteCaption(null), 4000);
      }
    });
    socketRef.current.on("hand-queue-update", (queue) => {
      setHandQueue(queue);
    });
    socketRef.current.on("hand-lowered", () => {
      setIsHandRaised(false);
      addToast("Host lowered your hand", "info");
    });
    socketRef.current.on("denied", () => {
      addToast("Host denied your entry", "error");
      cleanupAndLeave();
    });
    socketRef.current.on("kicked", () => {
      addToast("You have been removed from the meeting", "error");
      setTimeout(cleanupAndLeave, 1500);
    });
    socketRef.current.on("force-mute", () => {
      if (localStreamRef.current) {
        const t = localStreamRef.current.getAudioTracks();
        if (t) t.enabled = false;
        setAudio(false);
        socketRef.current.emit("toggle-audio", { isMuted: true });
      }
      addToast("Host muted everyone", "info");
    });

    socketRef.current.on("force-stop-video", () => {
      if (localStreamRef.current) {
        const t = localStreamRef.current.getVideoTracks();
        if (t) t.enabled = false;
        setVideo(false);
        socketRef.current.emit("toggle-video", { isVideoOff: true });
      }
      addToast("Host stopped all video", "info");
    });

socketRef.current.on("update-host-id", (hostId) => {
      setRoomHostId(hostId);
      if (hostId === socketRef.current?.id || hostId === socketIdRef.current) {
        setAmIHost(true);
      } else {
        setAmIHost(false);
      }
    });

    socketRef.current.on("lock-update", (isLocked) => {
      setIsMeetingLocked(isLocked);
      addToast(
        isLocked ? "Meeting has been Locked 🔒" : "Meeting is Unlocked 🔓",
        "info",
      );
      if (navigator.vibrate) navigator.vibrate(200);
    });
    socketRef.current.on("newProducer", async ({ producerId, socketId, kind, appData }) => {
        if (mediasoupClientRef.current) {
            await mediasoupClientRef.current.consume(producerId, socketId, appData);
        }
    });
    
    socketRef.current.on("producerClosed", ({ producerId }) => {
        // Track removal handled by video stream mapping
    });
    socketRef.current.on("user-left", (data) => {
      const leftSocketId = data.socketId || data;
      const leftUsername = data.username || "Guest";
      setVideos((v) => v.filter((x) => x.socketId !== leftSocketId));
      setUserMap((prev) => {
        const copy = { ...prev };
        delete copy[leftSocketId];
        return copy;
      });
      addToast(`${leftUsername} left`, "info");
    });
    socketRef.current.on("receive-message", (data) => {
      const isMe = data.socketId === socketRef.current.id;
      setMessages((prev) => [...prev, { ...data, isMe }]);
    });
    socketRef.current.on("screen-lock-update", (isLocked) => {
      setIsScreenShareLocked(isLocked);
      addToast(
        isLocked ? "Host disabled screen sharing" : "Screen sharing enabled",
        "info",
      );
      if (isLocked && screen && !amIHost) {
        handleScreen();
      }
    });
  };

  const cleanupAndLeave = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        t.enabled = false;
        t.stop();
      });
    }
    
    if (localStream) {
      localStream.getTracks().forEach((t) => {
        t.enabled = false;
        t.stop();
      });
    }

    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => {
        t.enabled = false;
        t.stop();
      });
    }

    if (mediasoupClientRef.current) {
        mediasoupClientRef.current.close();
        mediasoupClientRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;

    Object.values(connectionsRef.current).forEach((pc) => {
      pc.close();
    });
    connectionsRef.current = {};

    if (socketRef.current) {
      socketRef.current.emit("leave-room");
      socketRef.current.disconnect();
    }
    
    setHasLeftMeeting(true);
  };

  const handleToggleHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    socketRef.current.emit("toggle-hand", { isRaised: newState });
    setShowMoreMenu(false);
    
    if (newState) {
      addToast("You raised your hand ✋", "info");
    }
  };

  const handleSendEmoji = (emoji) => {
    if (!amIHost && securitySettings.isReactionsLocked) {
      addToast("The host has disabled reactions.", "error");
      return;
    }

    setShowEmojiPicker(false);
    setShowMoreMenu(false);
    
    addFloatingReaction(emoji, "Me");
    
    setActiveReactions((prev) => ({ ...prev, [socketIdRef.current]: emoji }));
    setTimeout(() => {
      setActiveReactions((prev) => {
        const newState = { ...prev };
        delete newState[socketIdRef.current];
        return newState;
      });
    }, 3000);
    socketRef.current.emit("send-reaction", { reaction: emoji });
  };
  const handleSendMessage = () => {
    if (!amIHost && securitySettings.isChatLocked) {
      addToast("The host has disabled the chat.", "error");
      return;
    }

    if (!currentMessage.trim() || !socketRef.current) return;
    const msg = {
      text: currentMessage,
      sender: userName,
      socketId: socketRef.current.id,
      timestamp: new Date().toISOString(),
    };
    socketRef.current.emit("send-message", msg);
    setMessages((prev) => [...prev, { ...msg, isMe: true }]);
    setCurrentMessage("");
  };
  const handleCreatePollSubmit = () => {
    if (!pollQuestion.trim() || pollOptions.some((opt) => !opt.trim())) {
      addToast("Please fill the question and all options", "error");
      return;
    }
    const poll = {
      id: Date.now().toString(),
      question: pollQuestion,
      options: pollOptions,
      votes: new Array(pollOptions.length).fill(0),
      votedUsers: [],
    };
    socketRef.current.emit("start-poll", {
      roomId: meetingCode.trim().toLowerCase(),
      poll,
    });
    setActivePoll(poll);
    setIsCreatingPoll(false);
    setHasVoted(false);
    setShowPolls(true);
  };

  const handleVote = (optionIndex) => {
    if (hasVoted) return;
    socketRef.current.emit("vote-poll", {
      roomId: meetingCode.trim().toLowerCase(),
      optionIndex,
      socketId: socketRef.current.id,
    });
    setHasVoted(true);

    setActivePoll((prev) => {
      const newVotes = [...prev.votes];
      newVotes[optionIndex] += 1;
      return { ...prev, votes: newVotes };
    });
  };

  const handleEndPoll = () => {
    socketRef.current.emit("end-poll", {
      roomId: meetingCode.trim().toLowerCase(),
    });
    setActivePoll(null);
    setShowPolls(false);
    addToast("Poll ended", "info");
  };

  const handleSubmitPasscode = (e) => {
    e.preventDefault();
    if (passcodeInput.trim()) {
      setShowPasscodeModal(false);
      setPasscodeError(false);
      connectSocket();
    }
  };
  
  const handleToggleLock = () => {
    socketRef.current.emit("toggle-lock");
  };
  
  const handleToggleScreenLock = () => {
    socketRef.current.emit("toggle-screen-lock");
  };
  
  const handleTransferHost = (targetId) => {
    setConfirmAction({
      title: "Transfer Host",
      message: "Make this user the Host? You will lose admin controls.",
      onConfirm: () => {
        socketRef.current.emit("transfer-host", targetId);
        addToast("Host transferred", "success");
      }
    });
  };
  
  const handleKickUser = (targetId) => {
    setConfirmAction({
      title: "Remove Participant",
      message: "Are you sure you want to remove this participant from the meeting?",
      onConfirm: () => {
        socketRef.current.emit("kick-user", targetId);
        addToast("User removed", "error");
      }
    });
  };
  
  const handleMuteAll = () => {
    setConfirmAction({
      title: "Mute Everyone",
      message: "Are you sure you want to mute all participants? They will be locked and cannot unmute themselves.",
      onConfirm: () => {
        socketRef.current.emit("mute-all"); 
        
        const newSettings = { ...securitySettings, isMicLocked: true };
        setSecuritySettings(newSettings);
        socketRef.current.emit("update-security", newSettings);
        
        addToast("Muted and locked everyone's mic", "success");
      }
    });
  };

  const handleStopVideoAll = () => {
    setConfirmAction({
      title: "Stop All Video",
      message: "Are you sure you want to stop everyone's video? They will be locked and cannot turn it back on.",
      onConfirm: () => {
        socketRef.current.emit("stop-video-all"); 
        
        const newSettings = { ...securitySettings, isCamLocked: true };
        setSecuritySettings(newSettings);
        socketRef.current.emit("update-security", newSettings);
        
        addToast("Stopped and locked all videos", "success");
      }
    });
  };
  
  const handleEndCall = () => {
    if (amIHost) {
      if (window.confirm("Do you want to end the meeting for everyone?")) {
        socketRef.current.emit("end-meeting-for-all");
        setTimeout(() => cleanupAndLeave(), 100);
      }
    } else {
      cleanupAndLeave();
    }
  };
  
  const handleHostLeaveClick = () => {
    if (amIHost) {
      setShowLeaveMenu(!showLeaveMenu);
    } else {
      cleanupAndLeave();
    }
  };
  const handleHostEndForAll = () => {
    setShowLeaveMenu(false);
    socketRef.current.emit("end-meeting-for-all");
    setTimeout(() => cleanupAndLeave(), 100);
  };
  const handleHostLeaveSilently = () => {
    setShowLeaveMenu(false);
    cleanupAndLeave();
  };
  
  const handleScreen = async () => {
    if (isMobile) {
      addToast("Not supported on mobile.", "error");
      return;
    }
    if (!amIHost && securitySettings.isScreenShareLocked && !screen) {
      addToast("The host has disabled screen sharing.", "error");
      return;
    }

    if (!screen) {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        displayStreamRef.current = display;
        const track = display.getVideoTracks()[0];
        if (mediasoupClientRef.current) {
            await mediasoupClientRef.current.produce(track, { type: 'screen' });
        }
        track.onended = () => handleScreen();
        setScreen(true);
        screenRef.current = true;
        setPinnedUserId("local"); 
        
        if (socketRef.current) {
          socketRef.current.emit("spotlight-user", socketRef.current.id);
        }
        
        addToast("Screen sharing started", "success");
      } catch (err) {
        console.log("Screen share cancelled or failed:", err);
        addToast("Screen share cancelled", "info");
      }
    } else {
      displayStreamRef.current?.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      Object.values(connectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
      setScreen(false);
      screenRef.current = false;
      if (pinnedUserId === "local" || pinnedUserId === socketRef.current?.id) {
        setPinnedUserId(null);
      }
      
      if (socketRef.current) {
        socketRef.current.emit("spotlight-user", null);
      }
      
      addToast("Screen sharing stopped", "info");
    }
  };
  
  const handleVideo = () => {
    if (!amIHost && securitySettings.isCamLocked && !video) {
      addToast("The host has disabled cameras.", "error");
      return;
    }

    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;

    const newState = !video;
    track.enabled = newState;

    setVideo(newState);
    socketRef.current.emit("toggle-video", { isVideoOff: !newState });
  };

  const handleAudio = () => {
    if (!amIHost && securitySettings.isMicLocked && !audio) {
      addToast("The host has disabled microphones.", "error");
      return;
    }

    if (!isAudioConnected) {
      setShowSettings(true);
      return;
    }

    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;

    const newState = !audio;
    track.enabled = newState;

    setAudio(newState);
    socketRef.current.emit("toggle-audio", { isMuted: !newState });
  };

  const handleAdmit = (socketId) => {
    socketRef.current.emit("admit-user", socketId);
    addToast("User admitted", "success");
  };
  const handleDeny = (socketId) => { 
   socketRef.current.emit("deny-user", socketId); 
   addToast("User denied entry", "info"); 
};
  const handleTileClick = (id) => {
    if (pinnedUserId === id) setPinnedUserId(null);
    else setPinnedUserId(id);
  };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast("Link copied to clipboard", "success");
  };

  useEffect(() => {
    isMountedRef.current = true; 
    getMedia().then(() => { 
        if (!isMountedRef.current && localStreamRef.current) {
             localStreamRef.current.getTracks().forEach(t => t.stop());
             return;
        }

        if (isMountedRef.current && localStreamRef.current) { 
            if (isHost) {
                setIsInWaitingRoom(false);
                setAskForUsername(false);
                connectSocket();
            } else if (bypassLobby || isGuest || (username && username !== "Guest") || hasToken) { 
                setIsInWaitingRoom(true);
                connectSocket(); 
            } else { 
                setAskForUsername(true); 
            }
        }
    });

    return () => {
      isMountedRef.current = false;
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setLocalStream((prevStream) => {
        if (prevStream) prevStream.getTracks().forEach(t => t.stop());
        return null;
      });
      if (socketRef.current) socketRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    if (!showChat && messages.length > 0 && !messages[messages.length - 1].isMe)
      setUnreadMessages((prev) => prev + 1);
  }, [messages]);
  useEffect(() => {
    if (showChat) setUnreadMessages(0);
  }, [showChat]);
  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(
        /Mobi|Android|iPhone/i.test(navigator.userAgent) ||
          window.innerWidth < 768,
      );
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  const connect = () => { 
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      
      setAskForUsername(false); 
      setIsInWaitingRoom(true); 
      connectSocket(); 
  };


  useEffect(() => {
    if (hasLeftMeeting && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (hasLeftMeeting && countdown === 0) {
      navigate("/");
    }
  }, [hasLeftMeeting, countdown, navigate]);

  const meetingContextValue = {
    EMOJI_LIST,
    GRID_PAGE_SIZE,
    activeDropdown,
    activeEmojis,
    activePoll,
    activeReactions,
    activeSpeakerId,
    addFloatingReaction,
    addToast,
    amIHost,
    amIHostRef,
    askForUsername,
    audio,
    audioAnalysersRef,
    audioContextRef,
    bypassLobby,
    chatContainerRef,
    cleanupAndLeave,
    confirmAction,
    connect,
    connectSocket,
    connectionsRef,
    copied,
    countdown,
    currentMessage,
    devices,
    displayStreamRef,
    floatingReactions,
    getAvatarColor,
    getRoomId,
    getUserColor,
    gridPage,
    handQueue,
    handleAdmit,
    handleAdmitted,
    handleAudio,
    handleCopyLink,
    handleCreatePollSubmit,
    handleDeny,
    handleEndCall,
    handleEndPoll,
    handleHostEndForAll,
    handleHostLeaveClick,
    handleHostLeaveSilently,
    handleKickUser,
    handleMuteAll,
    handleSecurityUpdate,
    handleSendEmoji,
    handleSendMessage,
    handleSpotlightUser,
    handleStopVideoAll,
    handleSubmitPasscode,
    handleTileClick,
    handleToggleHand,
    handleToggleLock,
    handleToggleRecord,
    handleToggleScreenLock,
    handleToggleWhiteboard,
    handleTransferHost,
    handleVideo,
    handleVote,
    hasLeftMeeting,
    hasToken,
    hasVoted,
    isAskingToJoin,
    isAudioConnected,
    isAudioConnectedRef,
    isAudioOn,
    isAudioOnly,
    isCreatingPoll,
    isGuest,
    isHandRaised,
    isHost,
    isInWaitingRoom,
    isMeetingLocked,
    isMobile,
    isMountedRef,
    isRecording,
    isScreenShareLocked,
    isVideoOn,
    localStream,
    localStreamRef,
    location,
    mediaRecorderRef,
    mediasoupClientRef,
    meetingCode,
    messages,
    navigate,
    participantSearch,
    passcode,
    passcodeError,
    passcodeInput,
    pendingIce,
    pinnedUserId,
    pollOptions,
    pollQuestion,
    recordedChunksRef,
    remoteCaption,
    renderGrid,
    renderTile,
    roomHostId,
    roomHostIdRef,
    screen,
    screenRef,
    securitySettings,
    selectedDevices,
    setActiveDropdown,
    setActiveEmojis,
    setActivePoll,
    setActiveReactions,
    setActiveSpeakerId,
    setAmIHost,
    setAskForUsername,
    setAudio,
    setConfirmAction,
    setCopied,
    setCountdown,
    setCurrentMessage,
    setDevices,
    setFloatingReactions,
    setGridPage,
    setHandQueue,
    setHasLeftMeeting,
    setHasVoted,
    setIsAskingToJoin,
    setIsAudioConnected,
    setIsAudioOnly,
    setIsCreatingPoll,
    setIsHandRaised,
    setIsInWaitingRoom,
    setIsMeetingLocked,
    setIsMobile,
    setIsRecording,
    setIsScreenShareLocked,
    setLocalStream,
    setMessages,
    setParticipantSearch,
    setPasscodeError,
    setPasscodeInput,
    setPinnedUserId,
    setPollOptions,
    setPollQuestion,
    setRemoteCaption,
    setRoomHostId,
    setScreen,
    setSecuritySettings,
    setSelectedDevices,
    setShowCaptions,
    setShowChat,
    setShowEmojiPicker,
    setShowHostSidebar,
    setShowInfo,
    setShowInviteModal,
    setShowLeaveMenu,
    setShowMeetingReadyCard,
    setShowMoreMenu,
    setShowParticipants,
    setShowPasscodeModal,
    setShowPolls,
    setShowSettings,
    setShowWhiteboard,
    setSocketInstance,
    setUnreadMessages,
    setUserMap,
    setUsername,
    setVideo,
    setVideos,
    setWaitingUsers,
    showCaptions,
    showChat,
    showEmojiPicker,
    showHostSidebar,
    showInfo,
    showInviteModal,
    showLeaveMenu,
    showMeetingReadyCard,
    showMoreMenu,
    showParticipants,
    showPasscodeModal,
    showPolls,
    showSettings,
    showWhiteboard,
    socketIdRef,
    socketInstance,
    socketRef,
    toggleAudioOnly,
    toggleCaptions,
    toggleSecuritySetting,
    togglePiP,
    getCurrentTime,
    unreadMessages,
    userMap,
    userMapRef,
    userName,
    username,
    video,
    videos,
    waitingUsers,
    waitingUsersRef,
  };

  const isSidebarOpen =
    showParticipants || showChat || showInfo || showHostSidebar;

  if (hasLeftMeeting) {
    return (
      <MeetingContext.Provider value={meetingContextValue}>
        <LeftMeetingScreen />
      </MeetingContext.Provider>
    );
  }

  if (askForUsername && !showPasscodeModal) {
    return (
      <MeetingContext.Provider value={meetingContextValue}>
        <JoinMeetingScreen />
      </MeetingContext.Provider>
    );
  }

  return (
    <MeetingContext.Provider value={meetingContextValue}>
      <div className="h-screen w-screen bg-[#202124] text-white flex flex-col overflow-hidden font-sans">
      <Toaster
        position="bottom-left"
        toastOptions={{ style: { background: "#3c4043", color: "#fff" } }}
      />

      {isInWaitingRoom && !askForUsername && !showPasscodeModal && (
        <WaitingRoom
          localStream={localStream}    
          username={userName}
          video={video}
          audio={audio}
          onToggleAudio={handleAudio}
          onToggleVideo={handleVideo}
          onCancel={cleanupAndLeave}
        />
      )}

      {!askForUsername && !isInWaitingRoom && !showPasscodeModal && (
        <>
          <div className="flex-1 flex overflow-hidden w-full">
            <div
              className={`flex-1 flex flex-col transition-all duration-300 ease-in-out`}
            >
              <VideoGrid />
            </div>

            <div
              className={`bg-[#202124] flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-50 ${isSidebarOpen ? "fixed md:relative inset-0 md:inset-auto w-full md:w-[360px] opacity-100 md:border border-[#3c4043] md:rounded-2xl md:my-4 md:mr-4 md:ml-2" : "w-0 opacity-0 border-0 m-0"}`}
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-[#3c4043] shrink-0 bg-[#202124]">
                <h2 className="font-medium text-lg text-white">
                  {showParticipants && "People"}
                  {showChat && "In-call messages"}
                  {showInfo && "Meeting details"}
                  {showHostSidebar && "Host controls"}
                </h2>
                <button
                  onClick={() => {
                    setShowParticipants(false);
                    setShowChat(false);
                    setShowInfo(false);
                    setShowHostSidebar(false);
                  }}
                  className="p-2 hover:bg-[#3c4043] rounded-full text-white cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#202124]">
                
                {showParticipants && <ParticipantsPanel />}

                {showHostSidebar && <HostControlsPanel />}

                {showChat && <ChatPanel />}

                {showInfo && <InfoPanel />}
              </div>
            </div>
          </div>

          {showCaptions && (localCaption || remoteCaption) && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 max-w-[80%] w-full flex flex-col items-center pointer-events-none">
              
              {remoteCaption && (
                <div className="bg-black/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-2xl mb-2 border border-white/10 animate-fade-in text-center max-w-2xl">
                  <p className="text-[#8ab4f8] text-xs font-bold uppercase tracking-wider mb-1">
                    {remoteCaption.username}
                  </p>
                  <p className="text-white text-lg md:text-xl font-medium leading-relaxed">
                    {remoteCaption.caption}
                  </p>
                </div>
              )}

              {localCaption && (
                <div className="bg-black/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-2xl border border-white/10 animate-fade-in text-center max-w-2xl">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                    You
                  </p>
                  <p className="text-white text-lg md:text-xl font-medium leading-relaxed">
                    {localCaption}
                  </p>
                </div>
              )}
            </div>
          )}

          <BottomControlBar />
        </>
      )}

      {showLeaveMenu && amIHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#202124] text-white p-6 rounded-lg shadow-2xl w-80 border border-gray-700">
            <h3 className="text-xl font-normal mb-6">Leave call?</h3>
            <div className="space-y-3">
              <button
                onClick={handleHostEndForAll}
                className="w-full text-left px-4 py-3 bg-[#3c4043] hover:bg-[#45484c] rounded text-sm transition-colors mb-2 cursor-pointer"
              >
                End the call for everyone
              </button>
              <button
                onClick={handleHostLeaveSilently}
                className="w-full text-left px-4 py-3 bg-[#3c4043] hover:bg-[#45484c] rounded text-sm transition-colors cursor-pointer"
              >
                Just leave the call
              </button>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowLeaveMenu(false)}
                  className="text-[#8ab4f8] text-sm font-medium hover:bg-[#2c3036] px-4 py-2 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasscodeModal && <PasscodeModal />}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#202124] text-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-700 transform transition-all">
            <h3 className="text-xl font-normal mb-2">{confirmAction.title}</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              {confirmAction.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-5 py-2.5 rounded-full hover:bg-[#3c4043] transition-colors font-medium text-sm text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-5 py-2.5 bg-[#8ab4f8] text-[#202124] rounded-full hover:bg-[#d2e3fc] transition-colors font-medium text-sm shadow-md cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}


      {showPolls && (
        <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#202124] w-full max-w-md rounded-2xl shadow-2xl border border-[#3c4043] flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[#3c4043] flex justify-between items-center bg-[#303134] rounded-t-2xl">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <BarChart2 size={20} className="text-[#8ab4f8]" />
                {activePoll
                  ? "Active Poll"
                  : isCreatingPoll
                    ? "Create a Poll"
                    : "Polls"}
              </h3>
              <button
                onClick={() => setShowPolls(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {activePoll ? (
                <div className="space-y-4">
                  <h4 className="text-xl text-white font-medium mb-4">
                    {activePoll.question}
                  </h4>
                  <div className="space-y-3">
                    {activePoll.options.map((option, index) => {
                      const totalVotes = activePoll.votes.reduce(
                        (a, b) => a + b,
                        0,
                      );
                      const percentage =
                        totalVotes === 0
                          ? 0
                          : Math.round(
                              (activePoll.votes[index] / totalVotes) * 100,
                            );

                      return (
                        <button
                          key={index}
                          onClick={() => handleVote(index)}
                          disabled={hasVoted || amIHost}
                          className="w-full relative overflow-hidden bg-[#303134] border border-[#3c4043] rounded-lg p-4 text-left hover:bg-[#3c4043] transition-colors disabled:opacity-90 disabled:cursor-default group cursor-pointer"
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-[#8ab4f8]/20 transition-all duration-500"
                            style={{
                              width: `${hasVoted || amIHost ? percentage : 0}%`,
                            }}
                          ></div>
                          <div className="relative flex justify-between items-center z-10 text-white">
                            <span>{option}</span>
                            {(hasVoted || amIHost) && (
                              <span className="text-sm text-gray-400">
                                {percentage}% ({activePoll.votes[index]})
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {amIHost && (
                    <button
                      onClick={handleEndPoll}
                      className="w-full mt-6 bg-[#ea4335] text-white py-3 rounded-full font-medium hover:bg-[#d93025] transition-colors cursor-pointer"
                    >
                      End Poll
                    </button>
                  )}
                </div>
              ) : isCreatingPoll ? (
                <div className="space-y-4">
                  <input
                    placeholder="Ask a question..."
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full bg-[#303134] border border-[#5f6368] rounded px-4 py-3 text-white focus:outline-none focus:border-[#8ab4f8]"
                  />
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...pollOptions];
                          newOpts[i] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        className="w-full bg-[#303134] border border-[#5f6368] rounded px-4 py-3 text-white focus:outline-none focus:border-[#8ab4f8]"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() =>
                            setPollOptions(
                              pollOptions.filter((_, idx) => idx !== i),
                            )
                          }
                          className="p-3 text-gray-400 hover:text-red-400 cursor-pointer"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-[#8ab4f8] text-sm font-medium hover:underline cursor-pointer"
                  >
                    + Add Option
                  </button>
                  <div className="flex gap-3 pt-4 border-t border-[#3c4043]">
                    <button
                      onClick={() => setIsCreatingPoll(false)}
                      className="flex-1 py-3 rounded-full hover:bg-[#3c4043] transition-colors text-white font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePollSubmit}
                      className="flex-1 bg-[#8ab4f8] text-[#202124] py-3 rounded-full hover:bg-[#d2e3fc] transition-colors font-medium cursor-pointer"
                    >
                      Launch Poll
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                  <div className="bg-[#303134] p-6 rounded-full">
                    <BarChart2 size={40} className="text-[#8ab4f8]" />
                  </div>
                  <h4 className="text-xl font-normal text-white">
                    Engage your audience
                  </h4>
                  <p className="text-sm text-gray-400 max-w-[250px]">
                    Polls let you quickly check in with your audience and gather
                    feedback.
                  </p>
                  {amIHost ? (
                    <button
                      onClick={() => setIsCreatingPoll(true)}
                      className="bg-[#8ab4f8] text-[#202124] px-8 py-3 rounded-full font-medium mt-4 hover:bg-[#d2e3fc] transition-colors cursor-pointer shadow-lg"
                    >
                      Start a poll
                    </button>
                  ) : (
                    <p className="text-[#8ab4f8] bg-[#8ab4f8]/10 px-4 py-2 rounded-full mt-4 text-sm">
                      Waiting for host to start a poll...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showWhiteboard && (
        <CollaborativeWhiteboard
          socket={socketRef.current}
          roomId={meetingCode.trim().toLowerCase()}
          onClose={() => handleToggleWhiteboard(false)}
          isHost={amIHost}
        />
      )}

      {/* Floating Reactions */}
      <div className="fixed bottom-24 left-0 w-[40%] h-3/4 pointer-events-none z-[45] overflow-hidden">
        {floatingReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute bottom-0 flex flex-col items-center animate-[floatUp_3s_ease-out_forwards]"
            style={{ left: `${reaction.left}%` }}
          >
            <div className="text-4xl md:text-5xl filter drop-shadow-lg transform transition-transform hover:scale-110">{reaction.emoji}</div>
            <div className="bg-black/60 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full mt-2 backdrop-blur-sm whitespace-nowrap shadow-md border border-white/10">
              {reaction.senderName}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(100px) scale(0.5); opacity: 0; }
          15% { transform: translateY(0px) scale(1.2); opacity: 1; }
          30% { transform: translateY(-100px) scale(1) rotate(-5deg); opacity: 1; }
          60% { transform: translateY(-300px) scale(1) rotate(5deg); opacity: 0.9; }
          100% { transform: translateY(-500px) scale(0.8) rotate(0deg); opacity: 0; }
        }
      `}</style>
    </div>
    </MeetingContext.Provider>
  );
}