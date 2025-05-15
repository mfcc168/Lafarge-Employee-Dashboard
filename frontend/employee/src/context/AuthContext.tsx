import { createContext, useState, useEffect, useContext } from "react";
import { User, AuthContextType } from "@interfaces/index";
import axios from "axios";



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Retrieve tokens from localStorage on initial load
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken"));
  

  const fetchUser = async () => {
    console.log("Fetching user with accessToken:", accessToken); // Debugging line
    if (!accessToken) {
      console.log("No access token found, skipping fetchUser.");
      return; // If there's no access token, skip fetching user
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/protected-endpoint/", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`, // Include token in Authorization header
        },
      });

      console.log("Response from protected endpoint:", res); // Debugging line

      if (res.ok) {
        const data = await res.json();
        console.log("User data fetched:", data); // Debugging line
        setIsAuthenticated(true);
        setUser({ username: data.username, email: data.email, role:data.role, annual_leave_days:data.annual_leave_days  });
      } else {
        console.log("Response was not OK:", res.status); // Debugging line
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
    console.log("useEffect triggered - checking accessToken:", accessToken); // Debugging line
    fetchUser(); // Fetch user on mount if there's a valid access token
  }, [accessToken]); // Re-run the effect when the access token changes


  useEffect(() => {
    const refreshAccessToken = async () => {
      if (!refreshToken) return;
  
      try {
        const res = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
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
    }, 4 * 60 * 1000); // Refresh every 4 minutes
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, [refreshToken]);
  


  const login = async (username: string, password: string) => {
    console.log("Logging in with username:", username); // Debugging line

    const res = await fetch("http://127.0.0.1:8000/api/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    console.log("Response from login endpoint:", res); // Debugging line

    if (!res.ok) {
      console.log("Login failed, response status:", res.status); // Debugging line
      throw new Error("Login failed");
    }

    const data = await res.json();
    console.log("Login successful, token data:", data); // Debugging line

    // Store tokens in localStorage
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);

    setAccessToken(data.access); // Store the access token in state
    setRefreshToken(data.refresh); // Store the refresh token in state

    await fetchUser(); // Make sure user state is updated
  };

  const logout = async () => {
    console.log("Logging out..."); // Debugging line

    // Remove tokens from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    setAccessToken(null); // Clear access token in state
    setRefreshToken(null); // Clear refresh token in state
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await axios.get('http://127.0.0.1:8000/api/protected-endpoint/', {
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
