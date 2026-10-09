import React, { useEffect, useRef } from "react";

const VideoPlayer = ({
  stream,
  isLocal,
  isMirrored,
  className,
  audioOutputId,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch((e) => console.warn("Autoplay blocked", e));
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

export default VideoPlayer;
