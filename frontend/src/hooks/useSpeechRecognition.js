// src/hooks/useSpeechRecognition.js
import { useState, useEffect, useRef } from 'react';

// 1. Accept 'username' as a parameter
const useSpeechRecognition = (socket, roomId, username) => {
    const [captions, setCaptions] = useState("");
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Browser support check
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; 
            recognitionRef.current.interimResults = true; 
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                
                // Update your own UI immediately
                setCaptions(transcript);

                // 2. Broadcast to others
                // Only send if we have a valid socket and room
                if(socket && roomId) {
                    socket.emit("send-caption", { 
                        roomId, 
                        caption: transcript, 
                        // Use the real username passed to the hook
                        username: username || "Guest" 
                    });
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
            };
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [socket, roomId, username]); // Add username to dependencies

    const startListening = () => recognitionRef.current?.start();
    const stopListening = () => recognitionRef.current?.stop();

    return { captions, startListening, stopListening };
};

export default useSpeechRecognition;