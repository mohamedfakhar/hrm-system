import { useState, useEffect } from "react";
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
} from "../../../../api/attendanceApi";

import { FaSignInAlt, FaSignOutAlt, FaCheckCircle } from "react-icons/fa";

import "./MyAttendance.css";

export default function MyAttendance() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Live clock — بيتحدث كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // تحميل البيانات أول ما الصفحة تفتح
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, historyRes] = await Promise.all([
        getTodayStatus(),
        getMyAttendance(),
      ]);

      setTodayStatus(statusRes.data.data);
      setHistory(historyRes.data.data);
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setError("");
    setActionLoading(true);
    try {
      await checkIn();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setError("");
    setActionLoading(true);
    try {
      await checkOut();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  // تنسيق الوقت لشكل HH:MM:SS
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

  // تحديد حالة اليوم
  const hasCheckedIn = !!todayStatus?.check_in;
  const hasCheckedOut = !!todayStatus?.check_out;

  return (
    <div className="attendance-page">
      <h1 className="attendance-page-title">My Attendance</h1>

      {/* Check In / Check Out Card */}
      <div className="checkin-card">
        <div className="checkin-clock">
          <p className="checkin-time">{formattedTime}</p>
          <p className="checkin-date">{formattedDate}</p>
        </div>

        {/* Status Indicator */}
        <div className="checkin-status">
          {!hasCheckedIn && (
            <span className="status-pill status-pill--gray">
              Not Checked In
            </span>
          )}
          {hasCheckedIn && !hasCheckedOut && (
            <span className="status-pill status-pill--green">
              <FaCheckCircle /> Checked In at {todayStatus.check_in}
            </span>
          )}
          {hasCheckedIn && hasCheckedOut && (
            <span className="status-pill status-pill--blue">
              Checked Out — {todayStatus.check_out}
            </span>
          )}
        </div>

        {error && <div className="checkin-error">{error}</div>}

        {/* Buttons */}
        <div className="checkin-actions">
          {!hasCheckedIn && (
            <button
              className="checkin-btn checkin-btn--in"
              onClick={handleCheckIn}
              disabled={actionLoading || loading}
            >
              <FaSignInAlt />
              {actionLoading ? "Checking in..." : "Check In"}
            </button>
          )}

          {hasCheckedIn && !hasCheckedOut && (
            <button
              className="checkin-btn checkin-btn--out"
              onClick={handleCheckOut}
              disabled={actionLoading || loading}
            >
              <FaSignOutAlt />
              {actionLoading ? "Checking out..." : "Check Out"}
            </button>
          )}

          {hasCheckedIn && hasCheckedOut && (
            <p className="checkin-done-msg">
              You've completed your attendance for today ✓
            </p>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="attendance-history-box">
        <h3 className="attendance-history-title">Attendance History</h3>

        <table className="attendance-history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Hours</th>
              <th>Late (min)</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="attendance-history-empty">
                  Loading...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="6" className="attendance-history-empty">
                  No attendance records yet
                </td>
              </tr>
            ) : (
              history.map((rec) => (
                <tr key={rec._id}>
                  <td>{new Date(rec.date).toLocaleDateString()}</td>
                  <td>{rec.check_in || "—"}</td>
                  <td>{rec.check_out || "—"}</td>
                  <td>{rec.working_hours ? `${rec.working_hours}h` : "—"}</td>
                  <td>{rec.late_minutes || 0}</td>
                  <td>
                    <span className={`status-badge status-badge--${rec.status}`}>
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
  );
}