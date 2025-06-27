// AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { User, AuthContextType } from "@interfaces/index";
import { backendUrl } from "@configs/DotEnv";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authAxios = axios.create({
  baseURL: backendUrl,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken"));
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  // Axios interceptor setup
  useEffect(() => {
    const requestInterceptor = authAxios.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    const responseInterceptor = authAxios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;
          try {
            const { data } = await axios.post(`${backendUrl}/api/token/refresh/`, {
              refresh: refreshToken,
            });
            localStorage.setItem("accessToken", data.access);
            setAccessToken(data.access);
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
            return authAxios(originalRequest);
          } catch (err) {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      authAxios.interceptors.request.eject(requestInterceptor);
      authAxios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken]);

  // User query
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
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });


  useEffect(() => {
    const checkAuth = async () => {
      if (accessToken && initialCheckComplete === false) {
        try {
          await userQuery.refetch();
        } catch (error) {
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


  // Login function that matches the interface
  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post(`${backendUrl}/api/token/`, { username, password });
      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);
      setAccessToken(res.data.access);
      setRefreshToken(res.data.refresh);
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setRefreshToken(null);
    queryClient.removeQueries({ queryKey: ['user'] });
  };

  const isAuthenticated = !!accessToken && !userQuery.isError;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        refreshToken,
        initialCheckComplete,
        user: userQuery.data || null,
        refreshUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};