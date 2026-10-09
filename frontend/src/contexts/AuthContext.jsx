import axios, { HttpStatusCode } from "axios";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
  timeout: 5000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const safeParse = (value) => {
    try {
      if (!value || value === "undefined") return null;
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const fetchUserHistory = async () => {
    try {
      const res = await client.get("/activity");
      return res.data;
    } catch (err) {
      console.error("Failed to fetch history:", err);
      return [];
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
        }

        const token = urlToken || localStorage.getItem("token");
        if (!token) {
          setUserData(null);
          return;
        }

        const cachedUser = safeParse(localStorage.getItem("userData")) || {};
        
        let history = [];
        try {
            history = await fetchUserHistory();
        } catch (e) {
            console.warn("Could not fetch initial history", e);
        }

        const finalUser = { ...cachedUser, history };
        setUserData(finalUser);
        localStorage.setItem("userData", JSON.stringify(finalUser));
      } catch (err) {
        console.error("Auth Check Error:", err);
        localStorage.clear();
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleRegister = async (name, password, email) => {
    const res = await client.post("/register", { name, password, email });
    if (res.status === HttpStatusCode.Created) return res.data.message;
  };

  const handleLogin = async (email, password) => {
    const res = await client.post("/login", { email, password });

    if (res.status === HttpStatusCode.Ok) {
      localStorage.setItem("token", res.data.token);
      const userPayload = res.data.user || {
          name: res.data.name,
          email: res.data.email || email,
          username: res.data.username
      };
      localStorage.setItem("userData", JSON.stringify(userPayload));
      setUserData(userPayload);
      navigate("/home");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserData(null);
    navigate("/auth");
  };

  const addToUserHistory = async (meetingDetails) => {
    try {
      const meeting_code =
        typeof meetingDetails === "object"
          ? meetingDetails.id
          : meetingDetails;

      const token = localStorage.getItem("token");
      if (!token) {
          console.warn("Cannot add history: No token found.");
          return;
      }

      await client.post("/activity", 
        { meeting_code },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
      );

      if (userData) {
        const updated = {
          ...userData,
          history: [...(userData.history || []), { meeting_code, date: new Date() }],
        };
        setUserData(updated);
        localStorage.setItem("userData", JSON.stringify(updated));
      }
      console.log("History added successfully");
    } catch (err) {
      console.error("History update failed:", err);
    }
  };

  const getHistoryOfUser = async () => {
    try {
      const res = await client.get("/activity");
      return res.data;
    } catch {
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        handleLogout,
        getHistoryOfUser,
        addToUserHistory,
        isLoading,
      }}
    >
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};