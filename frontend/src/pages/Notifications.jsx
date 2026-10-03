import { useState } from "react";
import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState("all");

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.is_read;
    if (filter === "read") return notif.is_read;
    return true;
  });

  const getNotificationIcon = (title = "", message = "") => {
    const text = `${title} ${message}`.toLowerCase();
    if (text.includes("leave")) return "event_available";
    if (text.includes("attendance") || text.includes("check")) return "fingerprint";
    if (text.includes("payroll") || text.includes("salary")) return "payments";
    if (text.includes("announcement")) return "campaign";
    return "notifications";
  };

  const getNotificationColor = (title = "", message = "") => {
    const text = `${title} ${message}`.toLowerCase();
    if (text.includes("leave")) return "bg-primary/10 text-primary";
    if (text.includes("attendance")) return "bg-emerald-50 text-emerald-600";
    if (text.includes("payroll")) return "bg-blue-50 text-blue-600";
    if (text.includes("announcement")) return "bg-purple-50 text-purple-600";
    return "bg-surface-container-high text-on-surface-variant";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">notifications</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Notifications Center</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Stay updated with real-time approvals, payroll events, and corporate announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs hover:opacity-90 shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">done_all</span>
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex p-1 rounded-xl bg-surface-container-high border border-outline-variant/20">
        {[
          { id: "all", label: "All Alerts", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadCount },
          { id: "read", label: "Read", count: notifications.length - unreadCount },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              filter === tab.id
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                filter === tab.id ? "bg-primary/10 text-primary" : "bg-black/5 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-outline-variant/30">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl">notifications_off</span>
            </div>
            <h3 className="font-headline text-base font-bold text-on-surface">All caught up!</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
              You don't have any {filter !== "all" ? filter : ""} notifications at this time.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isUnread = !n.is_read;
            const icon = getNotificationIcon(n.title, n.message);
            const iconColor = getNotificationColor(n.title, n.message);
            const timeAgo = n.createdAt
              ? new Date(n.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now";

            return (
              <div
                key={n._id}
                className={`glass-card p-4 sm:p-5 rounded-2xl flex items-start gap-4 transition-all relative overflow-hidden border ${
                  isUnread
                    ? "border-primary/40 shadow-sm bg-white/95 border-l-4 border-l-primary"
                    : "border-outline-variant/30 opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}
                >
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4
                      className={`text-sm font-bold truncate ${
                        isUnread ? "text-on-surface" : "text-on-surface-variant"
                      }`}
                    >
                      {n.title || "Notification"}
                    </h4>
                    <span className="text-[11px] text-on-surface-variant font-mono shrink-0">
                      {timeAgo}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {n.message}
                  </p>

                  {isUnread && (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => markAsRead(n._id)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">done</span>
                        <span>Mark as read</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUnread && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
