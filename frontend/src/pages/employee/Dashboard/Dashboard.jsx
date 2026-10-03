import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getEmployeeStats } from "../../../api/dashboardApi";
import { getMyAttendance } from "../../../api/attendanceApi";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [statsRes, attendanceRes] = await Promise.all([
        getEmployeeStats(),
        getMyAttendance(),
      ]);

      setStats(statsRes?.data?.data || statsRes?.data || {});
      setAttendance(attendanceRes?.data?.data || attendanceRes?.data || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const employeeName = user?.email?.split("@")[0] || "Team Member";
  const recentRecords = attendance.slice(0, 5);

  const statusBadge = (status) => {
    if (status === "present") return "bg-green-100 text-green-700";
    if (status === "late") return "bg-amber-100 text-amber-700";
    if (status === "absent") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-on-surface-variant font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const leaveBalance = stats?.leaveBalance ?? 21;
  const leaveUsed = Math.max(0, 21 - leaveBalance);
  const leavePct = Math.min(100, Math.round((leaveUsed / 21) * 100));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface">
            Good day, <span className="capitalize">{employeeName}</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Here is what is happening with your workspace and attendance today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/employee/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-md shadow-primary/20 hover:bg-primary-container transition"
          >
            <span className="material-symbols-outlined text-[18px]">fingerprint</span>
            <span>Check In / Out</span>
          </Link>
        </div>
      </section>

      {/* Bento Grid Top Layer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Leave Balance Card (Bento Large) */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Annual Leave Balance
              </p>
              <p className="font-headline text-4xl font-extrabold text-primary">
                {leaveBalance}{" "}
                <span className="text-lg font-medium text-on-surface-variant">Days</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/20">
            <div className="flex justify-between text-xs font-medium text-on-surface-variant mb-2">
              <span>Annual Leave Used: {leaveUsed} of 21 days</span>
              <span className="text-on-surface font-semibold">{leavePct}% utilized</span>
            </div>
            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${leavePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Salary Status Card (Bento Small) */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/40 shadow-sm flex flex-col justify-between text-center items-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container/40 text-secondary flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>

          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-wider mb-1">
              Latest Salary Sheet
            </p>
            <p className="font-headline text-2xl font-extrabold text-on-surface">
              {stats?.lastSalary ? `${stats.lastSalary.toLocaleString()} EGP` : "Pending"}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {stats?.lastSalaryMonth || "Current Period"}
            </p>
          </div>

          <Link
            to="/employee/salary"
            className="mt-4 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>View Salary Breakdown</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

      </div>

      {/* KPI Counters Layer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Present Days</p>
            <p className="font-headline text-xl font-bold text-on-surface mt-0.5">
              {stats?.presentDaysThisMonth ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">schedule</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Late Days</p>
            <p className="font-headline text-xl font-bold text-on-surface mt-0.5">
              {stats?.lateDaysThisMonth ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Pending Requests</p>
            <p className="font-headline text-xl font-bold text-on-surface mt-0.5">
              {stats?.pendingLeaveRequests ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">beach_access</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Leave Balance</p>
            <p className="font-headline text-xl font-bold text-on-surface mt-0.5">
              {leaveBalance} Days
            </p>
          </div>
        </div>

      </div>

      {/* Quick Actions & Recent Attendance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Actions (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h2 className="font-headline text-base font-bold text-on-surface mb-1">
            Quick Actions
          </h2>

          <Link
            to="/employee/leaves"
            className="flex items-center gap-4 p-4 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">add_circle</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Apply for Leave</p>
              <p className="text-xs text-on-surface-variant">Submit new annual or sick leave</p>
            </div>
          </Link>

          <Link
            to="/employee/attendance"
            className="flex items-center gap-4 p-4 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">fingerprint</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Check Attendance</p>
              <p className="text-xs text-on-surface-variant">Log daily punch-in or check history</p>
            </div>
          </Link>

          <Link
            to="/employee/profile"
            className="flex items-center gap-4 p-4 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">badge</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">View My Profile</p>
              <p className="text-xs text-on-surface-variant">Employee details & code</p>
            </div>
          </Link>
        </div>

        {/* Recent Attendance (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
            <h2 className="font-headline text-base font-bold text-on-surface">
              Recent Attendance
            </h2>
            <Link
              to="/employee/attendance"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View Full History →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-medium">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Check In</th>
                  <th className="px-6 py-3">Check Out</th>
                  <th className="px-6 py-3">Working Hours</th>
                  <th className="px-6 py-3">Late (min)</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-on-surface-variant">
                      No attendance records logged yet
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((r) => (
                    <tr key={r._id} className="hover:bg-surface-container-low/50 transition">
                      <td className="px-6 py-3.5 font-medium text-on-surface">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 text-on-surface-variant">
                        {r.check_in || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-on-surface-variant">
                        {r.check_out || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-on-surface-variant">
                        {r.working_hours ? `${r.working_hours} hrs` : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-on-surface-variant">
                        {r.late_minutes || 0}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusBadge(
                            r.status
                          )}`}
                        >
                          {r.status}
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
    </div>
  );
}
