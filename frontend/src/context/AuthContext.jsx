import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );

  const login = (userData, accessToken ) => {
    // Save tokens
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));

    // Update state

    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Remove authentication data

      localStorage.removeItem("token");

      localStorage.removeItem("refreshToken");

      localStorage.removeItem("user");

      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
