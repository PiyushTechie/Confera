import React, { useRef, useState, useEffect } from "react";
import { PenTool, X } from "lucide-react";

const CollaborativeWhiteboard = ({ socket, roomId, onClose, isHost }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = "#8ab4f8";
    ctx.lineWidth = 3;
    ctxRef.current = ctx;

    const handleRemoteDraw = (data) => {
      if (!ctxRef.current) return;
      if (data.socketId === socket.id) return;

      if (data.type === "start") {
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(data.x * canvas.width, data.y * canvas.height);
      } else if (data.type === "draw") {
        ctxRef.current.lineTo(data.x * canvas.width, data.y * canvas.height);
        ctxRef.current.stroke();
      } else if (data.type === "end") {
        ctxRef.current.closePath();
      } else if (data.type === "clear") {
        ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    socket.on("whiteboard-draw", handleRemoteDraw);
    return () => socket.off("whiteboard-draw", handleRemoteDraw);
  }, [socket]);

  const startDrawing = ({ nativeEvent }) => {
    if (!isHost) return;
    const { offsetX, offsetY } = nativeEvent;
    const canvas = canvasRef.current;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    socket.emit("whiteboard-draw", {
      roomId,
      socketId: socket.id,
      type: "start",
      x: offsetX / canvas.width,
      y: offsetY / canvas.height,
    });
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !isHost) return;
    const { offsetX, offsetY } = nativeEvent;
    const canvas = canvasRef.current;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
    socket.emit("whiteboard-draw", {
      roomId,
      socketId: socket.id,
      type: "draw",
      x: offsetX / canvas.width,
      y: offsetY / canvas.height,
    });
  };

  const endDrawing = () => {
    if (!isHost || !isDrawing) return;
    ctxRef.current.closePath();
    setIsDrawing(false);
    socket.emit("whiteboard-draw", { roomId, type: "end" });
  };

  const clearCanvas = () => {
    if (!isHost) return;
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("whiteboard-draw", { roomId, type: "clear" });
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#202124]/95 flex flex-col backdrop-blur-sm">
      <div className="h-14 bg-[#303134] flex items-center justify-between px-6 border-b border-[#3c4043]">
        <div className="flex items-center gap-3 text-white font-medium">
          <PenTool size={20} className="text-[#8ab4f8]" /> Collaborative
          Whiteboard
        </div>
        <div className="flex items-center gap-4">
          {isHost && (
            <button
              onClick={clearCanvas}
              className="text-sm bg-[#3c4043] hover:bg-[#4c5055] px-4 py-1.5 rounded-full text-white transition cursor-pointer"
            >
              Clear All
            </button>
          )}
          {isHost && (
            <button
              onClick={onClose}
              className="text-[#ea4335] hover:bg-[#ea4335]/20 p-2 rounded-full transition cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          className="absolute inset-0 bg-transparent"
        />
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;
