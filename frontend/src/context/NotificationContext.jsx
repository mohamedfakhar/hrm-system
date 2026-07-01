import {createContext, useContext, useState, useEffect, useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../api/axios";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Connect Socket & Register user 
  useEffect(() => {
    if (!user) return;

    const s = io("http://localhost:5000", { withCredentials: true });
    setSocket(s);

    s.on("connect", () => {
      s.emit("register", user.id);
    });

    s.on("notification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => s.disconnect();
  }, [user]);

  //  Load notifications from DB on mount 
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      const count = await api.get("/notifications/unread-count");
      setNotifications(res.data.data);
      setUnreadCount(count.data.count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  //  Mark one as read 
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
