import { createContext, useState, useEffect, useContext } from "react";
import { User, AuthContextType } from "@interfaces/index";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Retrieve tokens from localStorage on initial load
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken"));
  

  const fetchUser = async () => {
    if (!accessToken) {
      return; // If there's no access token, skip fetching user
    }

    try {
      const res = await fetch(`${backendUrl}/api/protected-endpoint/`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`, // Include token in Authorization header
        },
      });


      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setUser({ 
          username: data.username, 
          firstname: data.firstname, 
          lastname: data.lastname, 
          email: data.email, 
          role:data.role, 
          annual_leave_days:data.annual_leave_days  
        });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser(); // Fetch user on mount if there's a valid access token
  }, [accessToken]); // Re-run the effect when the access token changes


  useEffect(() => {
    const refreshAccessToken = async () => {
      if (!refreshToken) return;
  
      try {
        const res = await fetch(`${backendUrl}/api/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
  
        if (res.ok) {
          const data = await res.json();
          console.log("Token refreshed successfully:", data);
  
          localStorage.setItem("accessToken", data.access);
          setAccessToken(data.access); // This will re-trigger fetchUser()
        } else {
          console.warn("Failed to refresh token, logging out");
          logout();
        }
      } catch (err) {
        console.error("Error refreshing token:", err);
        logout();
      }
    };
  
    const interval = setInterval(() => {
      refreshAccessToken();
    }, 30 * 60 * 1000); // Refresh every 30 minutes
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, [refreshToken]);
  


  const login = async (username: string, password: string) => {

    const res = await fetch(`${backendUrl}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });


    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = await res.json();

    // Store tokens in localStorage
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);

    setAccessToken(data.access); // Store the access token in state
    setRefreshToken(data.refresh); // Store the refresh token in state

    await fetchUser(); // Make sure user state is updated
  };

  const logout = async () => {

    // Remove tokens from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    setAccessToken(null); // Clear access token in state
    setRefreshToken(null); // Clear refresh token in state
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await axios.get(`${backendUrl}/api/protected-endpoint/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, accessToken, refreshToken, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
