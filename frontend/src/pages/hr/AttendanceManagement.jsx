import { useState, useEffect } from "react";
import { getAllAttendance } from "../../api/attendanceApi";

export default function AttendanceManagement() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadAttendance = async (selectedDate) => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllAttendance(selectedDate);
      setRecords(res.data.data || []);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setError("Failed to load daily attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(date);
  }, [date]);

  const presentCount = records.filter((r) => r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  const totalWorkedHours = records
    .reduce((acc, curr) => acc + (Number(curr.working_hours) || 0), 0);
  const avgHours = records.length > 0 ? (totalWorkedHours / records.length).toFixed(1) : "0.0";

  const filteredRecords = records.filter((rec) => {
    if (statusFilter === "all") return true;
    return rec.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">fingerprint</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Attendance Monitor</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Live workforce logs, check-in timestamps, working durations, and punctuality tracking.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Select Date:
          </label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs font-semibold rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              calendar_month
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Present Today
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">{presentCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">person_check</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Late Clock-ins
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">{lateCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">schedule</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Absences Logged
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">{absentCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">person_off</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Average Hours
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">{avgHours} hrs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">query_stats</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-xl bg-surface-container-high border border-outline-variant/20">
          {[
            { id: "all", label: "All Logs", count: records.length },
            { id: "present", label: "Present", count: presentCount },
            { id: "late", label: "Late", count: lateCount },
            { id: "absent", label: "Absent", count: absentCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab.id
                    ? "bg-primary/10 text-primary"
                    : "bg-black/5 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <span className="text-xs font-medium text-on-surface-variant hidden sm:inline">
          Date: {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-xs font-semibold uppercase text-on-surface-variant">
                <th className="pb-3 px-4">Employee</th>
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
                  <td colSpan="7" className="py-12 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">
                        progress_activity
                      </span>
                      <span>Loading attendance records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-1 block">
                      event_busy
                    </span>
                    <p className="text-sm font-medium">No attendance logs found for this date.</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Select another date or wait for employees to clock in.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const empName = rec.employee_id?.full_name || "Employee";
                  const initials = empName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={rec._id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface text-sm">{empName}</p>
                            <p className="text-[11px] text-on-surface-variant font-mono">
                              {rec.employee_id?.employee_code || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-on-surface">
                        {new Date(rec.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-on-surface">
                        {rec.check_in || "—"}
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-on-surface">
                        {rec.check_out || "—"}
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-on-surface">
                        {rec.working_hours ? `${rec.working_hours}h` : "—"}
                      </td>

                      <td className="py-3 px-4">
                        {rec.late_minutes > 0 ? (
                          <span className="text-xs font-bold text-amber-600">
                            +{rec.late_minutes} min
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            rec.status === "present"
                              ? "bg-emerald-100 text-emerald-800"
                              : rec.status === "late"
                              ? "bg-amber-100 text-amber-800"
                              : rec.status === "absent"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              rec.status === "present"
                                ? "bg-emerald-500"
                                : rec.status === "late"
                                ? "bg-amber-500"
                                : rec.status === "absent"
                                ? "bg-rose-500"
                                : "bg-blue-500"
                            }`}
                          />
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}