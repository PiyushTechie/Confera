import axios, { HttpStatusCode } from "axios";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://localhost:8000/api/v1/users",
    timeout: 5000 // FIX 1: Add timeout so it doesn't hang forever
});

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useNavigate();

    const fetchUserData = async (token) => {
        try {
            const response = await client.get("/get_all_activity", {
                params: { token: token }
            });
            
            setUserData(prev => {
                const current = prev || { token: token };
                return { ...current, history: response.data };
            });
        } catch (error) {
            console.error("Failed to fetch user history:", error);
            // We do NOT logout here automatically to prevent flicker 
            // if it's just a network glitch.
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            // FIX 2: Wrap everything in try/finally to GUARANTEE loading stops
            try {
                // 1. Check URL Token
                const query = new URLSearchParams(window.location.search);
                const urlToken = query.get("token");

                if (urlToken) {
                    localStorage.setItem("token", urlToken);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    setUserData({ token: urlToken, history: [] });
                    await fetchUserData(urlToken);
                    return; // "finally" block will still run!
                }

                // 2. Check Local Storage
                const localToken = localStorage.getItem("token");
                const localUser = localStorage.getItem("userData");

                if (localToken) {
                    // Restore name immediately
                    if (localUser) {
                        setUserData(JSON.parse(localUser));
                    } else {
                        setUserData({ token: localToken });
                    }
                    
                    // Fetch updates (awaiting here is what caused the stuck screen before)
                    await fetchUserData(localToken);
                }
            } catch (error) {
                console.error("Auth Check Error:", error);
                // If critical error, clear everything so user can try login again
                localStorage.removeItem("token");
                localStorage.removeItem("userData");
                setUserData(null);
            } finally {
                // FIX 3: THIS ALWAYS RUNS. The loading screen WILL disappear.
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // ... Keep your handleRegister, handleLogin, etc. exactly the same ...
    const handleRegister = async (name, username, password) => {
        let request = await client.post("/register", { name, username, password });
        if (request.status === HttpStatusCode.Created) return request.data.message;
    };

    const handleLogin = async (username, password) => {
        let request = await client.post("/login", { username, password });
        if (request.status === HttpStatusCode.Ok) {
            localStorage.setItem("token", request.data.token);
            localStorage.setItem("userData", JSON.stringify(request.data.user)); 
            setUserData(request.data.user);
            router("/home");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setUserData(null);
        router("/auth");
    };

    const addToUserHistory = async (meetingDetails) => {
        try {
            const token = localStorage.getItem("token");
            const meeting_code = typeof meetingDetails === 'object' ? meetingDetails.id : meetingDetails;
            
            await client.post("/add_to_activity", { 
            token: token, 
            meeting_code: meeting_code 
        });

            if (userData) {
                const newHistoryItem = typeof meetingDetails === 'object' ? meetingDetails : { meetingCode: meetingDetails, date: new Date() };
                const newHistory = [...(userData.history || []), newHistoryItem];
                const updatedUser = { ...userData, history: newHistory };
                
                setUserData(updatedUser);
                localStorage.setItem("userData", JSON.stringify(updatedUser)); 
            }
        } catch (e) { console.error(e); }
    };

    const getHistoryOfUser = async () => {
        try {
            const token = localStorage.getItem("token");
            let response = await client.get("/get_all_activity", { 
            params: { token: token } 
        });
            return response.data;
        } catch (e) { return []; }
    }

    return (
        <AuthContext.Provider value={{ 
            userData, setUserData, handleRegister, handleLogin, handleLogout, 
            getHistoryOfUser, addToUserHistory, isLoading 
        }}>
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#fff", color: "#333" }}>
                    Loading...
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}