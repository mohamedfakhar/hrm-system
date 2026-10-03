import { useState, useEffect } from "react";
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
} from "../../../../api/attendanceApi";

export default function MyAttendance() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        getTodayStatus(),
        getMyAttendance(),
      ]);

      setTodayStatus(statusRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckIn = async () => {
    setError("");
    setSuccessMsg("");
    setActionLoading(true);
    try {
      const res = await checkIn();
      setSuccessMsg(res.data?.message || "Successfully checked in!");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Check-in failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setError("");
    setSuccessMsg("");
    setActionLoading(true);
    try {
      const res = await checkOut();
      setSuccessMsg(res.data?.message || "Successfully checked out!");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Check-out failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasCheckedIn = Boolean(todayStatus?.check_in);
  const hasCheckedOut = Boolean(todayStatus?.check_out);

  // Compute stats from real history
  const totalDays = history.length;
  const lateDays = history.filter((r) => (r.late_minutes || 0) > 0).length;
  const totalHours = history
    .reduce((acc, curr) => acc + (Number(curr.working_hours) || 0), 0)
    .toFixed(1);

  // Compute live duration if checked in today
  const getSessionDuration = () => {
    if (!hasCheckedIn) return "00:00:00";
    if (hasCheckedOut && todayStatus?.working_hours) {
      const hrs = Math.floor(todayStatus.working_hours);
      const mins = Math.round((todayStatus.working_hours - hrs) * 60);
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
    }
    // Calculate elapsed time from check_in string (HH:MM or HH:MM:SS)
    try {
      const [h, m, s = 0] = todayStatus.check_in.split(":").map(Number);
      const checkInDate = new Date();
      checkInDate.setHours(h, m, s, 0);
      const diffMs = Math.max(0, currentTime.getTime() - checkInDate.getTime());
      const diffSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    } catch {
      return "00:00:00";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Daily Attendance</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            {formattedDate} • <span className="font-bold text-primary">{formattedTime}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>HQ Office • Network Verified</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>Shift: 09:00 AM - 05:00 PM</span>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Main Interactive Attendance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Punch In / Out Card */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-8 border border-outline-variant/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />

          {/* Session Timer */}
          <div className="mb-6 relative z-10">
            <span className="font-headline text-4xl sm:text-5xl font-extrabold text-primary tracking-tight block">
              {getSessionDuration()}
            </span>
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold mt-2 block">
              {hasCheckedIn && !hasCheckedOut
                ? "Active Shift Duration"
                : hasCheckedIn && hasCheckedOut
                ? "Total Completed Time"
                : "Shift Duration (Idle)"}
            </span>
          </div>

          {/* Interactive Button */}
          <div className="relative my-4 z-10">
            {!hasCheckedIn ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={actionLoading || loading}
                className="w-48 h-48 rounded-full bg-gradient-to-tr from-primary to-blue-600 text-white shadow-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <span className="material-symbols-outlined text-4xl">fingerprint</span>
                </div>
                <span className="font-headline font-bold text-lg">
                  {actionLoading ? "Processing..." : "Check In"}
                </span>
                <span className="text-[11px] text-white/80">Tap to start shift</span>
              </button>
            ) : !hasCheckedOut ? (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={actionLoading || loading}
                className="w-48 h-48 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <span className="material-symbols-outlined text-4xl">logout</span>
                </div>
                <span className="font-headline font-bold text-lg">
                  {actionLoading ? "Processing..." : "Check Out"}
                </span>
                <span className="text-[11px] text-white/80">Conclude shift</span>
              </button>
            ) : (
              <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xl flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl">check</span>
                </div>
                <span className="font-headline font-bold text-base">Completed</span>
                <span className="text-[11px] text-white/80">Shift logged for today</span>
              </div>
            )}
          </div>

          {/* Timing details breakdown */}
          <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md pt-6 border-t border-outline-variant/20 relative z-10">
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Check-In</p>
              <p className="text-sm font-bold text-on-surface mt-1">
                {todayStatus?.check_in || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Check-Out</p>
              <p className="text-sm font-bold text-on-surface mt-1">
                {todayStatus?.check_out || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Status</p>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  todayStatus?.status === "present"
                    ? "bg-emerald-100 text-emerald-800"
                    : todayStatus?.status === "late"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {todayStatus?.status || "Not Checked In"}
              </span>
            </div>
          </div>
        </div>

        {/* Side Panel: Summary Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-5 border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">timer</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Total Logged Hours</p>
                <p className="text-xl font-bold text-on-surface">{totalHours} hrs</p>
              </div>
            </div>
            <span className="text-xs text-primary font-semibold">Cumulative</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Days Recorded</p>
                <p className="text-xl font-bold text-on-surface">{totalDays} days</p>
              </div>
            </div>
            <span className="text-xs text-emerald-600 font-semibold">All Time</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined">alarm_on</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Late Arrivals</p>
                <p className="text-xl font-bold text-on-surface">{lateDays} days</p>
              </div>
            </div>
            <span className="text-xs text-amber-600 font-semibold">Attention</span>
          </div>

          {/* Workplace Info */}
          <div className="glass-card rounded-2xl p-5 border border-outline-variant/30 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline text-sm font-bold text-on-surface">Workplace Policy</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Standard
                </span>
              </div>
              <ul className="text-xs text-on-surface-variant space-y-2">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                  <span>Grace period: 15 minutes past 09:00 AM</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                  <span>Minimum 8 working hours per full day</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                  <span>Requires valid check-out before midnight</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">Attendance Log History</h2>
          </div>
          <span className="text-xs text-on-surface-variant">Showing latest {history.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-xs font-semibold uppercase text-on-surface-variant">
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 px-4">Check In</th>
                <th className="pb-3 px-4">Check Out</th>
                <th className="pb-3 px-4">Hours</th>
                <th className="pb-3 px-4">Late (mins)</th>
                <th className="pb-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                      <span>Loading attendance history...</span>
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl text-outline mb-1 block">event_busy</span>
                    <span>No attendance logs found yet.</span>
                  </td>
                </tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-medium text-on-surface">
                      {new Date(rec.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-on-surface font-mono text-xs">
                      {rec.check_in || "—"}
                    </td>
                    <td className="py-3 px-4 text-on-surface font-mono text-xs">
                      {rec.check_out || "—"}
                    </td>
                    <td className="py-3 px-4 text-on-surface font-semibold">
                      {rec.working_hours ? `${rec.working_hours}h` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {rec.late_minutes > 0 ? (
                        <span className="text-amber-600 font-semibold text-xs">
                          +{rec.late_minutes} min
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          rec.status === "present"
                            ? "bg-emerald-100 text-emerald-800"
                            : rec.status === "late"
                            ? "bg-amber-100 text-amber-800"
                            : rec.status === "absent"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}