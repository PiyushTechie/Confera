import axios, { HttpStatusCode } from "axios";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";
export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
  timeout: 5000,
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useNavigate();

    const fetchUserData = async (token) => {
        try {
            const response = await client.get("/activity",)
            
            setUserData(prev => {
                const current = prev || { token: token };
                return { ...current, history: response.data };
            });
        } catch (error) {
            console.error("Failed to fetch user history:", error);
            
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const query = new URLSearchParams(window.location.search);
                const urlToken = query.get("token");

                if (urlToken) {
                    localStorage.setItem("token", urlToken);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    setUserData({ token: urlToken, history: [] });
                    await fetchUserData(urlToken);
                    return;
                }

                const localToken = localStorage.getItem("token");
                const localUser = localStorage.getItem("userData");

                if (localToken) {
                    if (localUser) {
                        setUserData(JSON.parse(localUser));
                    } else {
                        setUserData({ token: localToken });
                    }
                    
                    await fetchUserData(localToken);
                }
            } catch (error) {
                console.error("Auth Check Error:", error);
                localStorage.removeItem("token");
                localStorage.removeItem("userData");
                setUserData(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

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
            
            await client.post("/activity", {
                meeting_code
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
            let response = await client.get("/activity", { 
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