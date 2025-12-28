// src/hooks/useSpeechRecognition.js
import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = (socket, roomId, username) => {
    const [captions, setCaptions] = useState("");
    const recognitionRef = useRef(null);

    useEffect(() => {
        // 1. Check if browser supports it
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("❌ Browser does not support Speech API");
            return;
        }

        console.log("🎤 Initializing Speech Recognition...");
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        // 2. Add Error Listener
        recognitionRef.current.onerror = (event) => {
            console.error("❌ Speech Error:", event.error); // <--- LOOK AT THIS LOG
        };

        recognitionRef.current.onstart = () => {
             console.log("✅ Microphone is listening...");
        };

        recognitionRef.current.onend = () => {
             console.log("⚠️ Microphone stopped listening.");
        };

        recognitionRef.current.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            console.log("🗣️ Heard:", transcript); // <--- CHECK IF THIS PRINTS
            
            setCaptions(transcript);

            if(socket && roomId) {
                socket.emit("send-caption", { 
                    roomId, 
                    caption: transcript, 
                    username: username || "Guest" 
                });
            }
        };

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [socket, roomId, username]);

    const startListening = () => {
        console.log("▶️ Start command sent");
        try {
            recognitionRef.current?.start();
        } catch(e) {
            console.error("Could not start:", e);
        }
    }
    
    const stopListening = () => {
        console.log("Tw Stop command sent");
        recognitionRef.current?.stop();
    }

    return { captions, startListening, stopListening };
};

export default useSpeechRecognition;