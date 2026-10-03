import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify and synchronize user session against backend /auth/me on mount
  useEffect(() => {
    const syncUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        if (res.data?.data) {
          setUser(res.data.data);
          localStorage.setItem("user", JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.warn("Session validation error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, []);

  const login = (userData, accessToken) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
