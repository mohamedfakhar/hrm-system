import { useState, useEffect } from "react";
import { getAllLeaves, approveLeave, rejectLeave } from "../../api/leaveApi";

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  const loadLeaves = async (status) => {
    try {
      setLoading(true);
      const res = await getAllLeaves(status === "all" ? undefined : status);
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error("Failed to load leaves:", err);
      setMessage({ text: "Failed to load leave requests.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (id, empName) => {
    try {
      setActionLoading(id);
      await approveLeave(id);
      setMessage({
        text: `Leave request for ${empName} approved successfully.`,
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      await loadLeaves(statusFilter);
    } catch (err) {
      console.error("Failed to approve leave:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to approve leave request.",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, empName) => {
    try {
      setActionLoading(id);
      await rejectLeave(id);
      setMessage({
        text: `Leave request for ${empName} has been rejected.`,
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      await loadLeaves(statusFilter);
    } catch (err) {
      console.error("Failed to reject leave:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to reject leave request.",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    const name = leave.employee_id?.full_name?.toLowerCase() || "";
    const code = leave.employee_id?.employee_code?.toLowerCase() || "";
    const reason = leave.reason?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || code.includes(query) || reason.includes(query);
  });

  const getLeaveTypeBadge = (type) => {
    switch (type) {
      case "sick":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "emergency":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "unpaid":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">pending_actions</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Leave Approvals</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Review personnel time-off applications, check allowances, and authorize absence requests.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          Authorizer Workspace
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-surface-container-high border border-outline-variant/20 w-full md:w-auto">
          {["pending", "approved", "rejected", "all"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === tab
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab === "all" ? "All Requests" : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search employee or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-error-container/40 text-error border-error/30"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Leave Requests Table */}
      <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-xs font-semibold uppercase text-on-surface-variant">
                <th className="pb-3 px-4">Employee</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Timeframe</th>
                <th className="pb-3 px-4">Duration</th>
                <th className="pb-3 px-4">Reason</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4 text-right">Review Action</th>
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
                      <span>Loading leave requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-1 block">
                      event_note
                    </span>
                    <p className="text-sm font-medium">
                      No {statusFilter !== "all" ? statusFilter : ""} leave applications found.
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Check other tabs or search criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const empName = leave.employee_id?.full_name || "Employee";
                  const initials = empName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={leave._id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface text-sm">{empName}</p>
                            <p className="text-[11px] text-on-surface-variant font-mono">
                              {leave.employee_id?.employee_code || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${getLeaveTypeBadge(
                            leave.leave_type
                          )}`}
                        >
                          {leave.leave_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-on-surface">
                        <span className="font-medium">
                          {new Date(leave.start_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-on-surface-variant mx-1.5">→</span>
                        <span className="font-medium">
                          {new Date(leave.end_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-xs px-2.5 py-0.5 rounded bg-surface-container text-on-surface">
                          {leave.days_count} {leave.days_count === 1 ? "day" : "days"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-on-surface-variant max-w-[200px] truncate">
                        {leave.reason || "No notes provided"}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            leave.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : leave.status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              leave.status === "approved"
                                ? "bg-emerald-500"
                                : leave.status === "rejected"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {leave.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {leave.status === "pending" ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={actionLoading === leave._id}
                              onClick={() => handleApprove(leave._id, empName)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                              title="Approve leave request"
                            >
                              {actionLoading === leave._id ? (
                                <span className="material-symbols-outlined text-sm animate-spin">
                                  progress_activity
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-sm">check</span>
                              )}
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === leave._id}
                              onClick={() => handleReject(leave._id, empName)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                              title="Reject leave request"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">
                            Decided
                          </span>
                        )}
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