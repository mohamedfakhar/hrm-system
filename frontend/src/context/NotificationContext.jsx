import { createContext, useContext, useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../api/axios";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // Load notifications from DB
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      const countRes = await api.get("/notifications/unread-count");
      setNotifications(res.data.data || []);
      setUnreadCount(countRes.data.count ?? countRes.data.data?.count ?? 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // Mark one as read
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Connect Socket & Listen for user notifications
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem("token");
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const s = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = s;

    s.on("connect", () => {
      // Backend automatically maps socket.user.id from verified JWT handshake
    });

    s.on("connect_error", (err) => {
      // Gracefully ignore socket disconnects in offline/fallback mode
      if (import.meta.env.DEV) {
        console.debug("[Socket] Real-time updates offline:", err.message);
      }
    });

    s.on("notification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Initial fetch on user change
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
