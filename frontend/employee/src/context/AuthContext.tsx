import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { User, AuthContextType } from "@interfaces/index";
import { backendUrl } from "@configs/DotEnv";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authAxios = axios.create({
  baseURL: backendUrl,
});


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken"));

  // Axios interceptor for adding the token to requests
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

        // Token expired
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;

          try {
            const res = await axios.post(`${backendUrl}/api/token/refresh/`, {
              refresh: refreshToken,
            });

            const newAccess = res.data.access;
            localStorage.setItem("accessToken", newAccess);
            setAccessToken(newAccess);

            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return authAxios(originalRequest);
          } catch (err) {
            logout(); // auto-logout on refresh failure
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

  const fetchUser = async (tokenOverride?: string) => {
    try {
      const res = await axios.get(`${backendUrl}/api/protected-endpoint/`, {
        headers: {
          Authorization: `Bearer ${tokenOverride || accessToken}`,
        },
      });

      const data = res.data;
      setIsAuthenticated(true);
      setUser({
        username: data.username,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        role: data.role,
        annual_leave_days: data.annual_leave_days,
      });
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await axios.post(`${backendUrl}/api/token/`, {
      username,
      password,
    });

    const data = res.data;
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
    await fetchUser(data.access); // use token directly to avoid race
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const res = await authAxios.get(`/api/protected-endpoint/`);
      setUser(res.data);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  // Refresh token every 30 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!refreshToken) return;

      try {
        const res = await axios.post(`${backendUrl}/api/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccess = res.data.access;
        localStorage.setItem("accessToken", newAccess);
        setAccessToken(newAccess);
      } catch (err) {
        console.error("Failed to refresh token:", err);
        logout();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [refreshToken]);

  useEffect(() => {
    if (accessToken) {
      fetchUser(accessToken);
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, accessToken, refreshToken, user, login, logout, refreshUser }}
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
