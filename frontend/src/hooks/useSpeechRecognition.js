import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = (socket, roomId, username) => {
    const [captions, setCaptions] = useState("");
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Browser does not support Speech API");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onerror = (event) => {
            console.error("Speech Error:", event.error);
        };

        recognitionRef.current.onstart = () => {
             console.log("Microphone is listening...");
        };

        recognitionRef.current.onend = () => {
             console.log("Microphone stopped listening.");
        };

        recognitionRef.current.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
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
        try {
            recognitionRef.current?.start();
        } catch(e) {
            console.error("Could not start:", e);
        }
    }
    
    const stopListening = () => {
        recognitionRef.current?.stop();
    }

    return { captions, startListening, stopListening };
};

export default useSpeechRecognition;