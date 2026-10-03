import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getHRStats } from "../../../api/dashboardApi";

export default function HRDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res = await getHRStats();
      const data = res?.data?.data || res?.data || {};
      setStats(data);
    } catch (err) {
      console.error("Failed to load HR stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border border-outline-variant/30">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-2 block">
          progress_activity
        </span>
        <p className="text-sm text-on-surface-variant">Loading executive dashboard...</p>
      </div>
    );
  }

  const totalEmp = stats?.totalEmployees ?? 0;
  const presentToday = stats?.presentToday ?? 0;
  const absentToday = stats?.absentToday ?? 0;
  const lateToday = stats?.lateToday ?? 0;
  const pendingLeaves = stats?.pendingLeaves ?? 0;
  const hrManagersCount = stats?.hrManagersCount ?? 0;

  const attendanceRate = totalEmp > 0 ? Math.round((presentToday / totalEmp) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Executive Overview</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            {user?.role === "admin"
              ? "Full system governance and enterprise workforce analytics."
              : "Real-time workforce management, attendance tracking, and HR operations."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/hr/assistant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 border border-primary/30 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">smart_toy</span>
            <span>Ask Smart Assistant</span>
          </Link>
          <Link
            to="/hr/employees/add"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Add Employee</span>
          </Link>
          <Link
            to="/hr/payroll"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-all border border-outline-variant/40"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            <span>Run Payroll</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid: Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Headcount */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Staff
            </span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Total Headcount</p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-0.5">{totalEmp}</p>
          </div>
        </div>

        {/* Present Today */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {attendanceRate}%
            </span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Present Today</p>
            <p className="font-headline text-2xl font-bold text-emerald-600 mt-0.5">{presentToday}</p>
          </div>
        </div>

        {/* Absent Today */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">cancel</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              Absence
            </span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Absent Today</p>
            <p className="font-headline text-2xl font-bold text-rose-600 mt-0.5">{absentToday}</p>
          </div>
        </div>

        {/* Late Today */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">schedule</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Delay
            </span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Late Arrivals</p>
            <p className="font-headline text-2xl font-bold text-amber-600 mt-0.5">{lateToday}</p>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">event_busy</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              Review
            </span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Pending Leaves</p>
            <p className="font-headline text-2xl font-bold text-blue-600 mt-0.5">{pendingLeaves}</p>
          </div>
        </div>

        {/* HR Managers (or System Status) */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              {user?.role === "admin" ? "Managers" : "Status"}
            </span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">
              {user?.role === "admin" ? "HR Managers" : "Ops State"}
            </p>
            <p className="font-headline text-2xl font-bold text-purple-600 mt-0.5">
              {user?.role === "admin" ? hrManagersCount : "Optimal"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
        <h2 className="font-headline text-base font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">touch_app</span>
          HR Operations & Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/hr/employees"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:bg-white transition-all flex items-start gap-3.5 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                Employee Directory
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Browse personnel, view profiles & deactivate
              </p>
            </div>
          </Link>

          <Link
            to="/hr/leaves"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:bg-white transition-all flex items-start gap-3.5 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined">fact_check</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                Leave Approvals
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Review and approve pending time-off
              </p>
            </div>
          </Link>

          <Link
            to="/hr/attendance"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:bg-white transition-all flex items-start gap-3.5 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined">fingerprint</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                Attendance Log
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Monitor live daily check-ins & overtime
              </p>
            </div>
          </Link>

          <Link
            to="/hr/payroll"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:bg-white transition-all flex items-start gap-3.5 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined">request_quote</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                Payroll Management
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Generate monthly cycle and disburse salaries
              </p>
            </div>
          </Link>

          <Link
            to="/hr/performance"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:bg-white transition-all flex items-start gap-3.5 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                Performance Reviews
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Periodic skill appraisals & attendance scoring
              </p>
            </div>
          </Link>

          <Link
            to="/hr/intelligence"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:bg-white transition-all flex items-start gap-3.5 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                HR Intelligence
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Anomaly detection & operational variance review
              </p>
            </div>
          </Link>

          <Link
            to="/hr/recommendations"
            className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:bg-white transition-all flex items-start gap-3.5 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                Recommendations
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Bonuses, promotion reviews &amp; support candidates
              </p>
            </div>
          </Link>

          {user?.role === "admin" && (
            <Link
              to="/admin/add-hr"
              className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 hover:border-purple-400 hover:bg-white transition-all flex items-start gap-3.5 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <span className="material-symbols-outlined">admin_panel_settings</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-purple-900 group-hover:text-purple-700 transition-colors">
                  Add HR Manager
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Create privileged administrator credentials
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* HR Intelligence & Recommendations Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* HR Intelligence Telemetry Section */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Operational Anomaly Telemetry
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {stats?.openAnomalies > 0
                  ? `${stats.openAnomalies} active operational pattern anomalies detected across attendance, leave, or payroll.`
                  : "Workforce patterns are within normal operational thresholds. No open anomalies."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            {stats?.openAnomalies > 0 ? (
              <span className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-xs font-bold border border-rose-500/20">
                {stats?.highAnomalies > 0 ? `${stats.highAnomalies} High Priority` : `${stats.openAnomalies} Open`}
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-medium border border-emerald-500/20">
                Normal Patterns
              </span>
            )}
            <Link
              to="/hr/intelligence"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface rounded-xl text-xs font-semibold transition-all"
            >
              <span>View Anomalies</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Smart Recommendations Section */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Smart Employee Recommendations
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {stats?.suggestedRecommendations > 0
                  ? `${stats.suggestedRecommendations} candidates currently suggested for bonus consideration, promotion, or support review.`
                  : "All recommendations reviewed or ready for next scheduled evaluation scan."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            {stats?.suggestedRecommendations > 0 ? (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20">
                {stats.suggestedRecommendations} Suggestions
              </span>
            ) : (
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-medium border border-outline-variant/20">
                Up to Date
              </span>
            )}
            <Link
              to="/hr/recommendations"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:opacity-95 shadow-md shadow-primary/20 transition-all"
            >
              <span>View Recommendations</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
