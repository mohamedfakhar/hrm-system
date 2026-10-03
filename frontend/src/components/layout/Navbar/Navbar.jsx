import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useNotifications } from "../../../context/NotificationContext";

export default function Navbar({ title, onToggleSidebar }) {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications() || {
    notifications: [],
    unreadCount: 0,
    markAsRead: () => {},
    markAllAsRead: () => {},
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between w-full px-4 md:px-8 py-3.5 bg-surface/90 backdrop-blur-md border-b border-outline-variant/40 shadow-sm">
      {/* Left side: Hamburger button + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <h2 className="font-headline text-lg md:text-xl font-bold text-on-surface">
          {title}
        </h2>
      </div>

      {/* Right side: Notifications bell & User profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-transform active:scale-90"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-container-lowest p-4 shadow-xl border border-outline-variant/50 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-sm text-on-surface">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 max-h-72 overflow-y-auto divide-y divide-outline-variant/20">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl text-outline-variant mb-1 block">
                      notifications_none
                    </span>
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`py-2.5 px-2 rounded-lg cursor-pointer transition-colors ${
                        n.is_read
                          ? "opacity-70 hover:bg-surface-container-low"
                          : "bg-primary/5 hover:bg-primary/10 font-medium"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-on-surface">
                          {n.title || n.message}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                      {n.title && (
                        <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-outline mt-1">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-outline-variant/30 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setDropdownOpen(false)}
                  className="inline-block text-xs font-semibold text-primary hover:underline"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/40">
          <div className="w-8 h-8 rounded-full bg-primary-container text-white font-bold flex items-center justify-center text-xs uppercase shadow-sm">
            {user?.email?.[0] || "U"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-on-surface leading-none max-w-[120px] truncate">
              {user?.email?.split("@")[0]}
            </p>
            <span className="text-[10px] text-on-surface-variant uppercase font-medium">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
