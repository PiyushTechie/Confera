import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
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
  Check,
  Users,
  LayoutDashboard,
  ShieldAlert,
  UserMinus,
  UserCheck,
  Lock,
  Hand,
  Smile,
  Unlock,
  Trash2,
  Pin,
  Settings,
  Volume2,
  Power,
  Crown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCog,
  MoreHorizontal,
  Captions,
  Disc,
  AlertCircle,
} from "lucide-react";
import server from "../environment";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

const server_url = server;

const peerConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* --------------------- AVATAR HELPERS --------------------- */
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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const AvatarFallback = ({ username, className = "" }) => {
  const initial = (username || "Guest").charAt(0).toUpperCase();
  const colorClass = getAvatarColor(username || "Guest");

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-neutral-800 ${className}`}
    >
      <div
        className={`${colorClass} rounded-full flex items-center justify-center text-white font-bold shadow-lg aspect-square h-[50%] max-h-[150px] min-h-[40px]`}
      >
        <span className="text-[clamp(1rem,4vw,4rem)] leading-none">
          {initial}
        </span>
      </div>
    </div>
  );
};

/* --------------------- SMART VIDEO PLAYER --------------------- */
const VideoPlayer = ({
  stream,
  isLocal,
  isMirrored,
  className,
  audioOutputId,
  username,
}) => {
  const videoRef = useRef(null);
  const [isTrackMuted, setIsTrackMuted] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch((e) => console.warn("Autoplay blocked", e));

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setIsTrackMuted(!videoTrack.enabled || videoTrack.muted);

        const handleMute = () => setIsTrackMuted(true);
        const handleUnmute = () => setIsTrackMuted(false);
        const handleEnded = () => setIsTrackMuted(true);

        videoTrack.addEventListener("mute", handleMute);
        videoTrack.addEventListener("unmute", handleUnmute);
        videoTrack.addEventListener("ended", handleEnded);

        return () => {
          videoTrack.removeEventListener("mute", handleMute);
          videoTrack.removeEventListener("unmute", handleUnmute);
          videoTrack.removeEventListener("ended", handleEnded);
        };
      }
    } else if (!stream) {
      setIsTrackMuted(true);
    }
  }, [stream]);

  useEffect(() => {
    if (
      videoRef.current &&
      audioOutputId &&
      typeof videoRef.current.setSinkId === "function"
    ) {
      videoRef.current
        .setSinkId(audioOutputId)
        .catch((err) => console.warn("Audio Sink Error:", err));
    }
  }, [audioOutputId]);

  if (isTrackMuted) {
    return <AvatarFallback username={username} className={className} />;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isLocal}
      playsInline
      className={`${className} ${isMirrored ? "-scale-x-100" : ""}`}
    />
  );
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { url: meetingCode } = useParams();

  const {
    bypassLobby = false,
    isAudioOn = true,
    isVideoOn = true,
    username = "Guest",
    isHost = false,
    passcode = null,
  } = location.state || {};

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
  const [userName, setUsername] = useState(username || "Guest");
  const [video, setVideo] = useState(isVideoOn ?? true);
  const [audio, setAudio] = useState(isAudioOn ?? true);
  const [screen, setScreen] = useState(false);

  const [videos, setVideos] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [roomHostId, setRoomHostId] = useState(null);

  const amIHost =
    roomHostId && socketIdRef.current
      ? roomHostId === socketIdRef.current
      : isHost;

  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  });
  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: "",
    videoInput: "",
    audioOutput: "",
  });
  const [isAudioConnected, setIsAudioConnected] = useState(true);

  const [viewMode, setViewMode] = useState("GRID");
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [gridPage, setGridPage] = useState(0);
  const GRID_PAGE_SIZE = 4;

  const [showInfo, setShowInfo] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojis, setActiveEmojis] = useState({});

  const [showCaptions, setShowCaptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [toasts, setToasts] = useState([]);
  const [remoteCaption, setRemoteCaption] = useState(null);

  const {
    startListening,
    stopListening,
    captions: localCaption,
  } = useSpeechRecognition(socketInstance, meetingCode, userName);

  const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "👏", "🎉"];
  const pendingIce = useRef({});

  /* --------------------- TOAST SYSTEM --------------------- */
  const addToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
  };

  /* --------------------- ACTIONS (RECORDING/CAPTIONS) --------------------- */
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

  /* --------------------- MEDIA --------------------- */
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (!video) stream.getVideoTracks().forEach((t) => (t.enabled = false));
      if (!audio) stream.getAudioTracks().forEach((t) => (t.enabled = false));
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (!audioContextRef.current)
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
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
    const constraints = {
      audio:
        type === "audioInput" ? { deviceId: { exact: deviceId } } : undefined,
      video:
        type === "videoInput" ? { deviceId: { exact: deviceId } } : undefined,
    };
    if (type === "audioInput" && video) constraints.video = true;
    if (type === "videoInput" && isAudioConnected) constraints.audio = true;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack =
        type === "audioInput"
          ? newStream.getAudioTracks()[0]
          : newStream.getVideoTracks()[0];
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
        const sender = pc
          .getSenders()
          .find(
            (s) =>
              s.track &&
              s.track.kind === (type === "audioInput" ? "audio" : "video")
          );
        if (sender) sender.replaceTrack(newTrack);
      });
      if (type === "audioInput") newTrack.enabled = audio;
      if (type === "videoInput") newTrack.enabled = video;
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
        const newTrack = stream.getAudioTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        Object.values(connectionsRef.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "audio");
          if (sender) sender.replaceTrack(newTrack);
          else pc.addTrack(newTrack, localStreamRef.current);
        });
        setIsAudioConnected(true);
        setAudio(true);
        socketRef.current.emit("toggle-audio", { isMuted: false });
      } catch (e) {
        console.error("Audio Reconnect Failed", e);
      }
    }
  };

  /* ------------------ ACTIVE SPEAKER ------------------ */
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
            v.stream
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
        }
      );
      if (loudestSpeaker && loudestSpeaker !== activeSpeakerId)
        setActiveSpeakerId(loudestSpeaker);
    }, 500);
    return () => clearInterval(interval);
  }, [activeSpeakerId]);

  /* ------------------ SOCKET & PEER ------------------ */
  const createPeer = (targetId) => {
    const pc = new RTCPeerConnection(peerConfig);
    pc.targetId = targetId;
    connectionsRef.current[targetId] = pc;
    const videoTrack =
      screen && displayStreamRef.current
        ? displayStreamRef.current.getVideoTracks()[0]
        : localStreamRef.current?.getVideoTracks()[0];
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (videoTrack) pc.addTrack(videoTrack, localStreamRef.current);
    if (audioTrack && isAudioConnected)
      pc.addTrack(audioTrack, localStreamRef.current);
    pc.onicecandidate = (e) => {
      if (e.candidate)
        socketRef.current.emit(
          "signal",
          targetId,
          JSON.stringify({ ice: e.candidate })
        );
    };
    pc.ontrack = (e) => {
      setVideos((prev) => {
        if (prev.some((v) => v.socketId === pc.targetId)) return prev;
        return [...prev, { socketId: pc.targetId, stream: e.streams[0] }];
      });
    };
    return pc;
  };

  const initiateOffer = async (targetId) => {
    const pc = connectionsRef.current[targetId];
    if (!pc) return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit(
        "signal",
        targetId,
        JSON.stringify({ sdp: pc.localDescription })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const connectSocket = () => {
    if (socketRef.current && socketRef.current.connected) return;

    const token = localStorage.getItem("token");
    socketRef.current = io(server_url, {
      auth: { token: token },
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      setSocketInstance(socketRef.current);
      socketIdRef.current = socketRef.current.id;

      const payload = {
        path: meetingCode,
        username: userName,
        passcode: passcodeInput || passcode,
        isVideoOff: !video,
        isMuted: !audio,
      };

      if (isHost) {
        socketRef.current.emit("join-call", payload);
      } else {
        socketRef.current.emit("request-join", payload);
        setIsInWaitingRoom(true);
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
    socketRef.current.on("invalid-meeting", () => {
      addToast("Meeting not found!", "error");
      setTimeout(cleanupAndLeave, 2000);
    });

    socketRef.current.on("meeting-ended", () => {
      if (!amIHost) {
        addToast("Host ended the meeting.", "error");
        setTimeout(cleanupAndLeave, 1500);
      }
    });

    socketRef.current.on("force-mute", () => {
      if (localStreamRef.current) {
        const t = localStreamRef.current.getAudioTracks()[0];
        if (t) t.enabled = false;
        setAudio(false);
        socketRef.current.emit("toggle-audio", { isMuted: true });
      }
      addToast("Host muted everyone", "info");
    });

    socketRef.current.on("force-stop-video", () => {
      if (localStreamRef.current) {
        const t = localStreamRef.current.getVideoTracks()[0];
        if (t) t.enabled = false;
        setVideo(false);
        socketRef.current.emit("toggle-video", { isVideoOff: true });
      }
      addToast("Host stopped all video", "info");
    });
    socketRef.current.on("update-host-id", (hostId) => setRoomHostId(hostId));

    socketRef.current.on("lock-update", (isLocked) => {
      setIsMeetingLocked(isLocked);
      addToast(
        isLocked ? "Meeting has been Locked 🔒" : "Meeting is Unlocked 🔓",
        "info"
      );
      if (navigator.vibrate) navigator.vibrate(200);
    });

    socketRef.current.on("admitted", () => {
      setIsInWaitingRoom(false);
      socketRef.current.emit("join-call", {
        path: meetingCode,
        username: userName,
        passcode: passcodeInput || passcode,
        isVideoOff: !video,
        isMuted: !audio,
      });
      addToast("You have been admitted!", "success");
    });
    socketRef.current.on("update-waiting-list", (users) => {
      if (amIHost) setWaitingUsers(users);
    });
    socketRef.current.on("all-users", (users) => {
      users.forEach((u) =>
        setUserMap((prev) => ({ ...prev, [u.socketId]: u }))
      );
    });
    socketRef.current.on("user-joined", (user) => {
      setUserMap((prev) => ({ ...prev, [user.socketId]: user }));
      createPeer(user.socketId);
      initiateOffer(user.socketId);
      addToast(`${user.username} joined`, "info");
    });

    socketRef.current.on("hand-toggled", ({ socketId, isRaised, username }) => {
      if (socketId === socketRef.current.id) setIsHandRaised(isRaised);

      if (isRaised && socketId !== socketRef.current.id) {
        addToast(`${username || "Someone"} raised their hand ✋`, "info");
      }

      setUserMap((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], isHandRaised: isRaised },
      }));
    });

    socketRef.current.on("audio-toggled", ({ socketId, isMuted }) => {
      setUserMap((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], isMuted: isMuted },
      }));
    });
    socketRef.current.on("video-toggled", ({ socketId, isVideoOff }) => {
      setUserMap((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], isVideoOff: isVideoOff },
      }));
    });
    socketRef.current.on("emoji-received", ({ socketId, emoji }) => {
      setActiveEmojis((prev) => ({ ...prev, [socketId]: emoji }));
      setTimeout(() => {
        setActiveEmojis((prev) => {
          const newState = { ...prev };
          delete newState[socketId];
          return newState;
        });
      }, 3000);
    });

    socketRef.current.on("receive-caption", (data) => {
      if (showCaptions) {
        setRemoteCaption(data);
        setTimeout(() => setRemoteCaption(null), 4000);
      }
    });

    socketRef.current.on("signal", async (fromId, msg) => {
      const signal = JSON.parse(msg);
      let pc = connectionsRef.current[fromId];
      if (!pc) pc = createPeer(fromId);
      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({ sdp: pc.localDescription })
          );
        }
        if (pendingIce.current[fromId]) {
          pendingIce.current[fromId].forEach((c) =>
            pc.addIceCandidate(new RTCIceCandidate(c))
          );
          delete pendingIce.current[fromId];
        }
      } else if (signal.ice) {
        if (pc.remoteDescription)
          await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
        else {
          pendingIce.current[fromId] = pendingIce.current[fromId] || [];
          pendingIce.current[fromId].push(signal.ice);
        }
      }
    });
    socketRef.current.on("user-left", (id) => {
      connectionsRef.current[id]?.close();
      delete connectionsRef.current[id];
      setVideos((v) => v.filter((x) => x.socketId !== id));
      setUserMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    });
    socketRef.current.on("receive-message", (data) => {
      const isMe = data.socketId === socketRef.current.id;
      setMessages((prev) => [...prev, { ...data, isMe }]);
    });
  };

  const cleanupAndLeave = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;

    Object.values(connectionsRef.current).forEach((pc) => pc.close());

    if (socketRef.current) {
      socketRef.current.emit("leave-room");
      socketRef.current.disconnect();
    }

    navigate("/");
  };

  /* ------------------ ACTIONS ------------------ */
  const handleToggleHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    socketRef.current.emit("toggle-hand", { isRaised: newState });
    if (isMobile) setShowMobileMenu(false);
  };
  const handleSendEmoji = (emoji) => {
    setShowEmojiPicker(false);
    if (isMobile) setShowMobileMenu(false);
    setActiveEmojis((prev) => ({ ...prev, [socketIdRef.current]: emoji }));
    setTimeout(() => {
      setActiveEmojis((prev) => {
        const newState = { ...prev };
        delete newState[socketIdRef.current];
        return newState;
      });
    }, 3000);
    socketRef.current.emit("send-emoji", { emoji });
  };
  const handleSendMessage = () => {
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
    if (isMobile) setShowMobileMenu(false);
  };

  const handleTransferHost = (targetId) => {
    if (
      window.confirm("Make this user the Host? You will lose admin controls.")
    ) {
      socketRef.current.emit("transfer-host", targetId);
      addToast("Host transferred", "success");
    }
  };

  const handleKickUser = (targetId) => {
    if (window.confirm("Remove this participant?")) {
      socketRef.current.emit("kick-user", targetId);
      addToast("User removed", "error");
    }
  };
  const handleMuteAll = () => {
    if (window.confirm("Mute everyone?")) {
      socketRef.current.emit("mute-all");
      addToast("Muted everyone", "info");
    }
  };
  const handleStopVideoAll = () => {
    if (window.confirm("Stop everyone's video?")) {
      socketRef.current.emit("stop-video-all");
      addToast("Stopped all videos", "info");
    }
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

  const handleScreen = async () => {
    if (isMobile) {
      addToast("Not supported on mobile.", "error");
      return;
    }
    if (!screen) {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        displayStreamRef.current = display;
        const track = display.getVideoTracks()[0];
        Object.values(connectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track.kind === "video");
          if (sender) sender.replaceTrack(track);
        });
        track.onended = () => handleScreen();
        setScreen(true);
      } catch (err) {
        console.log("Cancelled");
      }
    } else {
      displayStreamRef.current?.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      Object.values(connectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
      setScreen(false);
    }
  };

  const handleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !video;
      setVideo(!video);
      socketRef.current.emit("toggle-video", { isVideoOff: video });
    }
  };

  const handleAudio = () => {
    if (!isAudioConnected) {
      setShowSettings(true);
      return;
    }
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !audio;
      setAudio(!audio);
      socketRef.current.emit("toggle-audio", { isMuted: audio });
    }
  };

  const handleAdmit = (socketId) => {
    socketRef.current.emit("admit-user", socketId);
    addToast("User admitted", "success");
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
    let isMounted = true;

    getMedia().then(() => {
      if (isMounted) {
        if (bypassLobby || (username && username !== "Guest")) {
          connectSocket();
        } else {
          setAskForUsername(true);
        }
      }
    });

    return () => {
      isMounted = false;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    if (
      !showChat &&
      messages.length > 0 &&
      !messages[messages.length - 1].isMe
    )
      setUnreadMessages((prev) => prev + 1);
  }, [messages]);
  useEffect(() => {
    if (showChat) setUnreadMessages(0);
  }, [showChat]);
  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(
        /Mobi|Android|iPhone/i.test(navigator.userAgent) ||
          window.innerWidth < 768
      );
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const connect = () => {
    setAskForUsername(false);
    connectSocket();
  };

  const getMainSocketId = () => {
    if (pinnedUserId) return pinnedUserId;
    if (
      activeSpeakerId &&
      activeSpeakerId !== socketIdRef.current &&
      videos.some((v) => v.socketId === activeSpeakerId)
    )
      return activeSpeakerId;
    if (videos.length > 0) return videos[0].socketId;
    return "local";
  };

  const renderMainSpotlight = () => {
    const mainId = getMainSocketId();
    const isLocal = mainId === "local" || mainId === socketIdRef.current;
    const emojiToShow =
      activeEmojis[mainId] || (isLocal && activeEmojis[socketIdRef.current]);

    let user, stream, isCamOff, displayName, isThisHost;

    if (isLocal) {
      user = {
        username: userName,
        isHandRaised: isHandRaised,
        isVideoOff: !video,
      };
      stream = localStream;
      isCamOff = !video;
      displayName = `${userName} (You)`;
      isThisHost = amIHost;
    } else {
      user = userMap[mainId] || { username: "Guest" };
      const v = videos.find((v) => v.socketId === mainId);
      stream = v?.stream;
      isCamOff = user.isVideoOff;
      displayName = user.username;
      isThisHost = mainId === roomHostId;
    }

    if (isCamOff) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/90">
          <AvatarFallback username={displayName} />

          {showCaptions && (remoteCaption || localCaption) && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center max-w-2xl transition-all animate-in slide-in-from-bottom-2 z-40">
              <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">
                {remoteCaption ? remoteCaption.username : "You"}
              </p>
              <p className="text-white text-lg font-medium leading-relaxed">
                {remoteCaption ? remoteCaption.caption : localCaption}
              </p>
            </div>
          )}

          <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 z-30">
            <span className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
              {displayName}
              {isThisHost && (
                <Crown size={16} className="text-yellow-400 fill-yellow-400" />
              )}
            </span>
            {user.isHandRaised && (
              <Hand size={20} className="text-yellow-500 animate-pulse" />
            )}
            {pinnedUserId === mainId && (
              <Pin size={16} className="text-blue-400 rotate-45" />
            )}
          </div>
          {emojiToShow && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in zoom-in fade-in duration-300">
              <span className="text-[12rem] filter drop-shadow-2xl leading-none">
                {emojiToShow}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black/90">
        <VideoPlayer
          stream={stream}
          isLocal={isLocal}
          isMirrored={isLocal && !screen}
          className="max-w-full max-h-full object-contain shadow-2xl"
          audioOutputId={selectedDevices.audioOutput}
          username={displayName}
        />

        {showCaptions && (remoteCaption || localCaption) && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center max-w-2xl transition-all animate-in slide-in-from-bottom-2 z-40">
            <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">
              {remoteCaption ? remoteCaption.username : "You"}
            </p>
            <p className="text-white text-lg font-medium leading-relaxed">
              {remoteCaption ? remoteCaption.caption : localCaption}
            </p>
          </div>
        )}

        <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 z-30">
          <span className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
            {displayName}
            {isThisHost && (
              <Crown size={16} className="text-yellow-400 fill-yellow-400" />
            )}
          </span>
          {user.isHandRaised && (
            <Hand size={20} className="text-yellow-500 animate-pulse" />
          )}
          {pinnedUserId === mainId && (
            <Pin size={16} className="text-blue-400 rotate-45" />
          )}
        </div>
        {emojiToShow && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in zoom-in fade-in duration-300">
            <span className="text-[12rem] filter drop-shadow-2xl leading-none">
              {emojiToShow}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderSideStrip = () => {
    const mainId = getMainSocketId();
    const allParticipants = [
      { socketId: "local", stream: localStream, isLocal: true },
      ...videos.map((v) => ({ ...v, isLocal: false })),
    ];
    const stripParticipants = allParticipants.filter((p) => {
      const pId = p.isLocal ? socketIdRef.current || "local" : p.socketId;
      const mId =
        mainId === "local" ? socketIdRef.current || "local" : mainId;
      return pId !== mId;
    });

    return stripParticipants.map((p) => {
      const pId = p.isLocal ? socketIdRef.current || "local" : p.socketId;
      const user = p.isLocal
        ? { username: userName, isHandRaised: isHandRaised, isVideoOff: !video }
        : userMap[pId] || { username: "Guest" };
      const isCamOff = user.isVideoOff;
      const displayName = p.isLocal ? `${userName} (You)` : user.username;
      const isThisHost = p.isLocal ? amIHost : pId === roomHostId;

      return (
        <div
          key={pId}
          onClick={() => handleTileClick(pId)}
          className={`relative flex-shrink-0 bg-neutral-800 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
            isMobile ? "w-28 h-20" : "w-full h-32"
          } ${
            activeSpeakerId === pId && !p.isLocal
              ? "border-green-500"
              : "border-transparent hover:border-neutral-500"
          }`}
        >
          {isCamOff ? (
            <AvatarFallback username={displayName} />
          ) : (
            <VideoPlayer
              stream={p.stream}
              isLocal={p.isLocal}
              isMirrored={p.isLocal && !screen}
              className="w-full h-full object-cover"
              audioOutputId={selectedDevices.audioOutput}
              username={displayName}
            />
          )}
          <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 rounded text-[10px] truncate max-w-[90%] flex items-center gap-1">
            {displayName}
            {isThisHost && (
              <Crown size={10} className="text-yellow-400 fill-yellow-400" />
            )}
          </div>
          {user.isHandRaised && (
            <div className="absolute top-1 right-1 text-yellow-500">
              <Hand size={14} />
            </div>
          )}
        </div>
      );
    });
  };

  const renderPaginatedGrid = () => {
    const allParticipants = [
      { socketId: "local", stream: localStream, isLocal: true },
      ...videos.map((v) => ({ ...v, isLocal: false })),
    ];

    // FIX: Define totalPages so pagination buttons work on desktop
    const totalPages = Math.ceil(allParticipants.length / GRID_PAGE_SIZE);

    // Mobile: Auto scroll, no pagination limits
    const visibleParticipants = isMobile
      ? allParticipants
      : allParticipants.slice(
          gridPage * GRID_PAGE_SIZE,
          (gridPage + 1) * GRID_PAGE_SIZE
        );

    const count = visibleParticipants.length;
    let gridClass = "grid-cols-1";

    // Zoom-style layouts
    if (count === 2) gridClass = "grid-cols-1 md:grid-cols-2";
    if (count >= 3) gridClass = "grid-cols-2";
    if (!isMobile && count >= 5) gridClass = "grid-cols-2 lg:grid-cols-3";

    return (
      <div className="relative w-full h-full bg-black p-2 flex flex-col items-center overflow-y-auto pb-28">
        <div
          className={`grid ${gridClass} gap-2 w-full max-w-6xl transition-all duration-300 ${
            !isMobile ? "h-full" : "auto-rows-fr"
          }`}
        >
          {visibleParticipants.map((p) => {
            const pId = p.isLocal
              ? socketIdRef.current || "local"
              : p.socketId;
            const user = p.isLocal
              ? {
                  username: userName,
                  isHandRaised: isHandRaised,
                  isVideoOff: !video,
                }
              : userMap[pId] || { username: "Guest" };
            const displayName = p.isLocal ? `${userName} (You)` : user.username;
            const isThisHost = p.isLocal ? amIHost : pId === roomHostId;
            const isCamOff = p.isLocal ? !video : user.isVideoOff;
            const emojiToShow =
              activeEmojis[p.socketId] ||
              (p.isLocal && activeEmojis[socketIdRef.current]);

            const showCaptionOnThisTile =
              showCaptions &&
              ((p.isLocal && localCaption) ||
                (!p.isLocal &&
                  remoteCaption &&
                  remoteCaption.username === user.username));

            return (
              <div
                key={pId}
                className={`relative bg-neutral-800 rounded-xl overflow-hidden border-2 w-full aspect-video ${
                  isMobile ? "min-h-[150px]" : "h-full"
                } ${
                  activeSpeakerId === pId && !p.isLocal
                    ? "border-green-500"
                    : "border-neutral-700"
                }`}
              >
                {isCamOff ? (
                  <AvatarFallback username={displayName} />
                ) : (
                  <VideoPlayer
                    stream={p.stream}
                    isLocal={p.isLocal}
                    isMirrored={p.isLocal && !screen}
                    className="w-full h-full object-cover"
                    audioOutputId={selectedDevices.audioOutput}
                    username={displayName}
                  />
                )}

                {showCaptionOnThisTile && (
                  <div className="absolute bottom-10 left-2 right-2 bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-center transition-all animate-in slide-in-from-bottom-2 z-40">
                    <p className="text-white text-xs md:text-sm font-medium leading-tight">
                      {p.isLocal ? localCaption : remoteCaption.caption}
                    </p>
                  </div>
                )}

                {/* Name Label with higher Z-index */}
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1 z-50 max-w-[85%] truncate">
                  <span className="truncate">{displayName}</span>
                  {isThisHost && (
                    <Crown
                      size={10}
                      className="text-yellow-400 fill-yellow-400 flex-shrink-0"
                    />
                  )}
                </div>

                {user.isHandRaised && (
                  <div className="absolute top-2 right-2 bg-yellow-500 p-1.5 rounded-full text-black shadow-lg animate-bounce z-50">
                    <Hand size={14} />
                  </div>
                )}
                {emojiToShow && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in zoom-in fade-in duration-300">
                    <span className="text-6xl md:text-8xl filter drop-shadow-lg leading-none">
                      {emojiToShow}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isMobile && totalPages > 1 && (
          <>
            {gridPage > 0 && (
              <button
                onClick={() => setGridPage((p) => p - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full hover:bg-black/80 text-white transition-all z-20"
              >
                <ChevronLeft size={32} />
              </button>
            )}
            {gridPage < totalPages - 1 && (
              <button
                onClick={() => setGridPage((p) => p + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full hover:bg-black/80 text-white transition-all z-20"
              >
                <ChevronRight size={32} />
              </button>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-xs font-medium text-gray-300">
              Page {gridPage + 1} / {totalPages}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`bg-neutral-800 border-l-4 ${
              t.type === "error"
                ? "border-red-500"
                : t.type === "success"
                ? "border-green-500"
                : "border-blue-500"
            } p-4 rounded shadow-2xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 pointer-events-auto min-w-[200px]`}
          >
            {t.type === "error" ? (
              <ShieldAlert size={20} className="text-red-500" />
            ) : t.type === "success" ? (
              <Check size={20} className="text-green-500" />
            ) : (
              <Info size={20} className="text-blue-500" />
            )}
            <span className="text-sm font-medium text-white">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-800 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-neutral-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings size={20} /> Audio & Video Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Microphone
                </label>
                <select
                  className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2.5 text-sm outline-none"
                  value={selectedDevices.audioInput}
                  onChange={(e) =>
                    handleDeviceChange("audioInput", e.target.value)
                  }
                >
                  {devices.audioInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Mic ${d.deviceId}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Camera
                </label>
                <select
                  className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2.5 text-sm outline-none"
                  value={selectedDevices.videoInput}
                  onChange={(e) =>
                    handleDeviceChange("videoInput", e.target.value)
                  }
                >
                  {devices.videoInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Cam ${d.deviceId}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Speaker
                </label>
                <select
                  className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2.5 text-sm outline-none"
                  value={selectedDevices.audioOutput}
                  onChange={(e) =>
                    handleDeviceChange("audioOutput", e.target.value)
                  }
                  disabled={!devices.audioOutputs.length}
                >
                  {devices.audioOutputs.length > 0 ? (
                    devices.audioOutputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Speaker ${d.deviceId}`}
                      </option>
                    ))
                  ) : (
                    <option>Default</option>
                  )}
                </select>
              </div>
              <div className="pt-4 border-t border-neutral-700">
                <button
                  onClick={toggleAudioConnection}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                    isAudioConnected
                      ? "bg-red-500/20 text-red-500"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {isAudioConnected ? (
                    <>
                      <Power size={18} /> Leave Audio
                    </>
                  ) : (
                    <>
                      <Volume2 size={18} /> Join Audio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASSCODE MODAL */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-neutral-700 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Passcode Required</h2>
            <form onSubmit={handleSubmitPasscode}>
              <input
                type="password"
                autoFocus
                className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-white mb-4"
                placeholder="Enter Passcode"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
              />
              {passcodeError && (
                <p className="text-red-500 text-xs mb-3 text-left">
                  Incorrect.
                </p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOBBY / JOIN SCREEN */}
      {askForUsername && !showPasscodeModal && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Join Meeting
            </h2>
            <input
              className="bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg block w-full p-2.5 mb-6"
              placeholder="Enter name"
              value={userName}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className="relative mb-6 rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
              {localStream ? (
                <VideoPlayer
                  stream={localStream}
                  isLocal={true}
                  isMirrored={true}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <Loader2 size={32} className="animate-spin mb-2" /> Loading
                  Camera...
                </div>
              )}
            </div>
            <button
              onClick={connect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-3"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {/* WAITING ROOM */}
      {isInWaitingRoom && !askForUsername && !showPasscodeModal && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
          <div className="bg-neutral-800 p-10 rounded-2xl shadow-2xl border border-neutral-700 max-w-lg w-full text-center">
            <ShieldAlert size={40} className="text-yellow-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Waiting for Host</h2>
            <div className="flex justify-center gap-2 mt-4">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN MEETING UI */}
      {!askForUsername && !isInWaitingRoom && !showPasscodeModal && (
        <div className="flex flex-col h-screen relative">
          <div className="flex-1 flex flex-col md:flex-row bg-black overflow-hidden relative">
            {isMobile ? (
              renderPaginatedGrid()
            ) : viewMode === "GRID" ? (
              renderPaginatedGrid()
            ) : (
              <>
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden order-1 md:order-1">
                  {renderMainSpotlight()}
                </div>
                <div
                  className={`flex bg-neutral-900 border-neutral-800 md:flex-col md:w-64 md:border-l md:overflow-y-auto md:order-2 md:p-3 md:gap-3 flex-row w-full overflow-x-auto p-2 gap-2 h-24 border-t order-2 md:h-auto`}
                >
                  {renderSideStrip()}
                </div>
              </>
            )}
          </div>

          {/* DESKTOP FOOTER */}
          <div className="hidden md:flex h-20 bg-neutral-900 border-t border-neutral-800 items-center justify-center z-20 px-4 gap-4 relative">
            {/* ... desktop buttons ... */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 absolute left-4"
            >
              <Settings size={24} />
            </button>

            <button
              onClick={handleAudio}
              className="flex flex-col items-center gap-1 min-w-[50px]"
            >
              <div
                className={`p-3 rounded-xl ${
                  audio ? "bg-neutral-700" : "bg-red-500"
                }`}
              >
                {audio ? <Mic size={24} /> : <MicOff size={24} />}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Mic</span>
            </button>

            <button
              onClick={handleVideo}
              className="flex flex-col items-center gap-1 min-w-[50px]"
            >
              <div
                className={`p-3 rounded-xl ${
                  video ? "bg-neutral-700" : "bg-red-500"
                }`}
              >
                {video ? <Video size={24} /> : <VideoOff size={24} />}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Cam</span>
            </button>

            <button
              onClick={handleToggleHand}
              className="flex flex-col items-center gap-1 min-w-[50px]"
            >
              <div
                className={`p-3 rounded-xl ${
                  isHandRaised
                    ? "bg-yellow-500 text-black"
                    : "bg-neutral-700 text-white"
                }`}
              >
                <Hand size={24} />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                Hand
              </span>
            </button>

            {/* Emoji Picker */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div className="p-3 rounded-xl bg-neutral-700 hover:bg-neutral-600">
                  <Smile size={24} />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  Emoji
                </span>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 p-2 rounded-full flex gap-2 shadow-xl animate-in slide-in-from-bottom-5">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendEmoji(emoji)}
                      className="text-2xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleScreen}
              className="flex flex-col items-center gap-1 min-w-[50px]"
            >
              <div
                className={`p-3 rounded-xl ${
                  screen ? "bg-blue-600" : "bg-neutral-700"
                }`}
              >
                {screen ? <MonitorOff size={24} /> : <ScreenShare size={24} />}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                Share
              </span>
            </button>

            {/* CAPTION & RECORD BUTTONS */}
            <button
              onClick={toggleCaptions}
              className="flex flex-col items-center gap-1 min-w-[50px]"
              title="Captions"
            >
              <div
                className={`p-3 rounded-xl transition-all ${
                  showCaptions
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-700 text-white"
                }`}
              >
                <Captions size={24} />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                Caps
              </span>
            </button>

            <button
              onClick={handleToggleRecord}
              className="flex flex-col items-center gap-1 min-w-[50px]"
              title="Record"
            >
              <div
                className={`p-3 rounded-xl transition-all ${
                  isRecording
                    ? "bg-red-600 animate-pulse text-white"
                    : "bg-neutral-700 text-white"
                }`}
              >
                <Disc size={24} />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Rec</span>
            </button>

            <button
              onClick={handleEndCall}
              className="flex flex-col items-center gap-1 min-w-[50px]"
            >
              <div className="p-3 rounded-xl bg-red-600 text-white">
                <PhoneOff size={24} />
              </div>
              <span className="text-[10px] text-red-500 font-bold">End</span>
            </button>

            {/* LOCK BUTTON */}
            <button
              onClick={handleToggleLock}
              className="flex flex-col items-center gap-1 min-w-[50px]"
              title={isMeetingLocked ? "Unlock Meeting" : "Lock Meeting"}
            >
              <div
                className={`p-3 rounded-xl transition-all duration-300 transform ${
                  isMeetingLocked
                    ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] scale-110"
                    : "bg-neutral-700 text-white hover:bg-neutral-600"
                }`}
              >
                {isMeetingLocked ? <Lock size={24} /> : <Unlock size={24} />}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                {isMeetingLocked ? "Unlock" : "Lock"}
              </span>
            </button>

            <div className="absolute right-6 gap-3 flex">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-3 rounded-xl bg-neutral-800"
              >
                <Info size={24} />
              </button>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="p-3 rounded-xl bg-neutral-800 relative"
              >
                <Users size={24} />
                {amIHost && waitingUsers && waitingUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {waitingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="p-3 rounded-xl bg-neutral-800 relative"
              >
                <MessageSquare size={24} />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* MOBILE SLIDER (FOOTER) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-4 z-50">
            <div className="flex w-full items-center justify-between overflow-x-auto no-scrollbar gap-6 px-2">
              <button
                onClick={handleAudio}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div
                  className={`p-3 rounded-xl ${
                    audio ? "bg-neutral-800" : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {audio ? <Mic size={24} /> : <MicOff size={24} />}
                </div>
                <span className="text-[10px] text-gray-400">Mic</span>
              </button>

              <button
                onClick={handleVideo}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div
                  className={`p-3 rounded-xl ${
                    video ? "bg-neutral-800" : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {video ? <Video size={24} /> : <VideoOff size={24} />}
                </div>
                <span className="text-[10px] text-gray-400">Cam</span>
              </button>

              <button
                onClick={handleToggleHand}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div
                  className={`p-3 rounded-xl ${
                    isHandRaised
                      ? "bg-yellow-500 text-black"
                      : "bg-neutral-800"
                  }`}
                >
                  <Hand size={24} />
                </div>
                <span className="text-[10px] text-gray-400">Hand</span>
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className="flex flex-col items-center gap-1 min-w-[50px] relative"
              >
                <div className="p-3 rounded-xl bg-neutral-800">
                  <MessageSquare size={24} />
                </div>
                {unreadMessages > 0 && (
                  <span className="absolute top-0 right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-neutral-900"></span>
                )}
                <span className="text-[10px] text-gray-400">Chat</span>
              </button>

              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="flex flex-col items-center gap-1 min-w-[50px] relative"
              >
                <div className="p-3 rounded-xl bg-neutral-800">
                  <Users size={24} />
                </div>
                {amIHost && waitingUsers.length > 0 && (
                  <span className="absolute top-0 right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-neutral-900"></span>
                )}
                <span className="text-[10px] text-gray-400">People</span>
              </button>

              <button
                onClick={handleScreen}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div
                  className={`p-3 rounded-xl ${
                    screen ? "bg-blue-600" : "bg-neutral-800"
                  }`}
                >
                  {screen ? (
                    <MonitorOff size={24} />
                  ) : (
                    <ScreenShare size={24} />
                  )}
                </div>
                <span className="text-[10px] text-gray-400">Share</span>
              </button>

              <button
                onClick={toggleCaptions}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div
                  className={`p-3 rounded-xl ${
                    showCaptions
                      ? "bg-indigo-600 text-white"
                      : "bg-neutral-800"
                  }`}
                >
                  <Captions size={24} />
                </div>
                <span className="text-[10px] text-gray-400">Caps</span>
              </button>

              <button
                onClick={handleToggleRecord}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div
                  className={`p-3 rounded-xl ${
                    isRecording
                      ? "bg-red-500/20 text-red-500 animate-pulse"
                      : "bg-neutral-800"
                  }`}
                >
                  <Disc size={24} />
                </div>
                <span className="text-[10px] text-gray-400">Rec</span>
              </button>

              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div className="p-3 rounded-xl bg-neutral-800">
                  <MoreHorizontal size={24} />
                </div>
                <span className="text-[10px] text-gray-400">More</span>
              </button>

              <button
                onClick={handleEndCall}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div className="p-3 rounded-xl bg-red-600 text-white">
                  <PhoneOff size={24} />
                </div>
                <span className="text-[10px] text-red-500 font-bold">End</span>
              </button>
            </div>
          </div>

          {/* MOBILE MORE MENU */}
          {showMobileMenu && (
            <div
              className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end justify-center"
              onClick={() => setShowMobileMenu(false)}
            >
              <div
                className="bg-neutral-900 w-full rounded-t-2xl p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">More Options</h3>
                  <button onClick={() => setShowMobileMenu(false)}>
                    <X size={24} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowInfo(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800"
                >
                  <Info size={24} /> Meeting Info
                </button>

                {amIHost && (
                  <>
                    <button
                      onClick={() => {
                        handleMuteAll();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800 text-red-400"
                    >
                      <MicOff size={24} /> Mute All
                    </button>
                    <button
                      onClick={() => {
                        handleStopVideoAll();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800 text-red-400"
                    >
                      <VideoOff size={24} /> Stop All Video
                    </button>
                    <button
                      onClick={() => {
                        handleToggleLock();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800"
                    >
                      {isMeetingLocked ? (
                        <Unlock size={24} />
                      ) : (
                        <Lock size={24} />
                      )}{" "}
                      {isMeetingLocked ? "Unlock Meeting" : "Lock Meeting"}
                    </button>
                  </>
                )}

                <div className="flex justify-between bg-neutral-800 p-4 rounded-xl">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleSendEmoji(emoji);
                        setShowMobileMenu(false);
                      }}
                      className="text-3xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SIDEBARS: PARTICIPANTS */}
          {showParticipants && (
            <div className="absolute right-0 top-0 h-[calc(100vh-6rem)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-[70] flex flex-col slide-in-right shadow-2xl">
              <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900">
                <h3 className="font-bold">Participants</h3>
                <button onClick={() => setShowParticipants(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-20">
                {amIHost && waitingUsers && waitingUsers.length > 0 && (
                  <div className="pb-4 border-b border-neutral-700">
                    <h4 className="text-xs font-bold text-yellow-500 uppercase mb-3">
                      Waiting
                    </h4>
                    {waitingUsers.map((u) => (
                      <div
                        key={u.socketId}
                        className="flex justify-between items-center bg-neutral-700/50 p-2 rounded mb-2"
                      >
                        <span className="text-sm">{u.username || "Guest"}</span>
                        <button
                          onClick={() => handleAdmit(u.socketId)}
                          className="p-1 bg-green-600 rounded text-xs"
                        >
                          <UserCheck size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center bg-neutral-700/50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">
                      {(userName || "G").charAt(0)}
                    </div>
                    <span className="text-sm">
                      {userName} (You){" "}
                      {amIHost && (
                        <Crown
                          size={12}
                          className="text-yellow-400 fill-yellow-400 inline ml-1"
                        />
                      )}
                    </span>
                  </div>
                </div>
                {userMap &&
                  Object.values(userMap).map((u) => {
                    const isUserHost = u.socketId === roomHostId;
                    return (
                      <div
                        key={u.socketId}
                        className="flex justify-between items-center bg-neutral-700/50 p-2 rounded group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">
                            {(u.username || "G").charAt(0)}
                          </div>
                          <span className="text-sm">
                            {u.username || "Guest"}{" "}
                            {isUserHost && (
                              <Crown
                                size={12}
                                className="text-yellow-400 fill-yellow-400 inline ml-1"
                              />
                            )}
                          </span>
                          {u.isHandRaised && (
                            <Hand
                              size={14}
                              className="text-yellow-500 ml-1 animate-pulse"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={
                              u.isVideoOff ? "text-red-500" : "text-gray-400"
                            }
                          >
                            {u.isVideoOff ? (
                              <VideoOff size={14} />
                            ) : (
                              <Video size={14} />
                            )}
                          </div>
                          <div
                            className={
                              u.isMuted ? "text-red-500" : "text-gray-400"
                            }
                          >
                            {u.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                          </div>

                          {amIHost && (
                            <>
                              <button
                                onClick={() => handleTransferHost(u.socketId)}
                                className="text-gray-500 hover:text-blue-500 transition-colors"
                                title="Make Host"
                              >
                                <UserCog size={14} />
                              </button>
                              <button
                                onClick={() => handleKickUser(u.socketId)}
                                className="text-gray-500 hover:text-red-500 transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SIDEBARS: CHAT */}
          {showChat && (
            <div className="absolute right-0 top-0 h-[calc(100vh-6rem)] w-full md:w-80 bg-neutral-800 border-l border-neutral-700 z-[70] flex flex-col slide-in-right shadow-2xl">
              <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900">
                <h3 className="font-bold">Chat</h3>
                <button onClick={() => setShowChat(false)}>
                  <X size={20} />
                </button>
              </div>
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      {msg.sender}
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg text-sm ${
                        msg.isMe ? "bg-blue-600" : "bg-neutral-700"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-neutral-900 border-t border-neutral-700">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    className="flex-1 bg-neutral-700 rounded-lg p-2 text-sm"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type..."
                  />
                  <button type="submit" className="p-2 bg-blue-600 rounded-lg">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* INFO MODAL (CENTERED & HIGH Z-INDEX) */}
          {showInfo && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-neutral-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-neutral-700 relative animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl">Meeting Info</h3>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="p-1 hover:bg-neutral-700 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      Meeting Code
                    </label>
                    <div className="flex items-center justify-between bg-neutral-900 p-3 rounded-lg mt-2 border border-neutral-700">
                      <span className="font-mono font-bold text-lg tracking-wider text-blue-400">
                        {meetingCode}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="p-2 hover:bg-neutral-800 rounded-md text-gray-400 hover:text-white transition-colors"
                      >
                        {copied ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {amIHost && (
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                        Host Controls
                      </label>
                      <button
                        onClick={handleToggleLock}
                        className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold transition-all ${
                          isMeetingLocked
                            ? "bg-red-500/20 text-red-500 border border-red-500/50"
                            : "bg-neutral-700 text-white hover:bg-neutral-600"
                        }`}
                      >
                        {isMeetingLocked ? (
                          <Lock size={18} />
                        ) : (
                          <Unlock size={18} />
                        )}
                        {isMeetingLocked ? "Unlock Meeting" : "Lock Meeting"}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                  >
                    Copy Invite Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}