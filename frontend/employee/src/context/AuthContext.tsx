import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";
import { User, AuthContextType } from "@interfaces/index";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken"));
  const queryClient = useQueryClient();

  // Fetch user data with React Query
  const { refetch: fetchUser } = useQuery({
    queryKey: ['auth-user', accessToken],
    queryFn: async () => {
      if (!accessToken) {
        setIsAuthenticated(false);
        setUser(null);
        return null;
      }

      try {
        const response = await axios.get(`${backendUrl}/api/protected-endpoint/`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        setIsAuthenticated(true);
        setUser(response.data);
        return response.data;
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        throw error;
      }
    },
    enabled: false, // Disable automatic fetching
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Initial fetch on mount and when accessToken changes
  useEffect(() => {
    fetchUser();
  }, [accessToken, fetchUser]);

  // Token refresh function
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return;

    try {
      const response = await axios.post(`${backendUrl}/api/token/refresh/`, {
        refresh: refreshToken
      });
      
      localStorage.setItem("accessToken", response.data.access);
      setAccessToken(response.data.access);
      return response.data.access;
    } catch (error) {
      console.error("Token refresh failed", error);
      logout();
      throw error;
    }
  }, [refreshToken]);

  // Setup token refresh interval
  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(() => {
      refreshAccessToken();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [refreshToken, refreshAccessToken]);

  const login = async (username: string, password: string) => {
    const response = await axios.post(`${backendUrl}/api/token/`, {
      username,
      password
    });

    localStorage.setItem("accessToken", response.data.access);
    localStorage.setItem("refreshToken", response.data.refresh);
    setAccessToken(response.data.access);
    setRefreshToken(response.data.refresh);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    setUser(null);
    queryClient.removeQueries({ queryKey: ['auth-user'] });
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const value = {
    isAuthenticated,
    user,
    accessToken,
    refreshToken,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};