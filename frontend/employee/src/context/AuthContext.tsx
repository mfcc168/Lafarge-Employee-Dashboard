// AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { User, AuthContextType } from "@interfaces/index";
import { backendUrl } from "@configs/DotEnv";

// Create context with undefined initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create axios instance for authenticated requests
const authAxios = axios.create({
  baseURL: backendUrl,
});

/**
 * AuthProvider Component
 * 
 * Provides authentication context to the application with:
 * - Token management (access & refresh)
 * - User data fetching
 * - Automatic token refresh
 * - Login/logout functionality
 * 
 * Features:
 * - Persistent session via localStorage
 * - Axios interceptors for token handling
 * - Query-based user data management
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  
  // Token state management
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refreshToken")
  );
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  // Setup axios interceptors for request/response handling
  useEffect(() => {
    // Request interceptor to attach token to headers
    const requestInterceptor = authAxios.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    // Response interceptor to handle token refresh
    const responseInterceptor = authAxios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Check for 401 error and attempt token refresh
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            refreshToken) {
          originalRequest._retry = true;
          
          try {
            const { data } = await axios.post(`${backendUrl}/api/token/refresh/`, {
              refresh: refreshToken,
            });
            
            // Update tokens in state and storage
            localStorage.setItem("accessToken", data.access);
            setAccessToken(data.access);
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
            
            // Retry original request with new token
            return authAxios(originalRequest);
          } catch (err) {
            // If refresh fails, logout user
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      authAxios.interceptors.request.eject(requestInterceptor);
      authAxios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken]);

  /**
   * User data query
   * Fetches and caches user information when authenticated
   */
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await authAxios.get('/api/protected-endpoint/');
      return {
        username: res.data.username,
        firstname: res.data.firstname,
        lastname: res.data.lastname,
        email: res.data.email,
        role: res.data.role,
        annual_leave_days: res.data.annual_leave_days,
      } as User;
    },
    enabled: !!accessToken && initialCheckComplete,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  // Initial authentication check
  useEffect(() => {
    const checkAuth = async () => {
      if (accessToken && initialCheckComplete === false) {
        try {
          // Verify token validity by fetching user data
          await userQuery.refetch();
        } catch (error) {
          // Logout if token is invalid
          logout();
        } finally {
          setInitialCheckComplete(true);
        }
      } else {
        setInitialCheckComplete(true);
      }
    };

    checkAuth();
  }, [accessToken]);

  /**
   * Login function
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @throws {Error} When authentication fails
   */
  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post(`${backendUrl}/api/token/`, { 
        username, 
        password 
      });
      
      // Store tokens and update state
      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);
      setAccessToken(res.data.access);
      setRefreshToken(res.data.refresh);
      
      // Invalidate any cached user data
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Refresh user data
   * Forces a refetch of the current user's data
   */
  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  /**
   * Logout function
   * Clears authentication state and storage
   */
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setRefreshToken(null);
    queryClient.removeQueries({ queryKey: ['user'] });
  };

  // Determine authentication status
  const isAuthenticated = !!accessToken && !userQuery.isError;

  // Context value provided to consumers
  const contextValue = {
    isAuthenticated,
    accessToken,
    refreshToken,
    initialCheckComplete,
    user: userQuery.data || null,
    refreshUser,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Provides access to authentication context
 * @returns {AuthContextType} Authentication context
 * @throws {Error} When used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};