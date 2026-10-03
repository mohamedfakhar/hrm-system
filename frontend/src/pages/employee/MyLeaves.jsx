import { useState, useEffect } from "react";
import { getMyLeaves, createLeave } from "../../api/leaveApi";

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const loadLeaves = async () => {
    try {
      const res = await getMyLeaves();
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    setFormLoading(true);

    try {
      await createLeave(form);
      setSuccess("Leave request submitted successfully!");
      setForm({ leave_type: "annual", start_date: "", end_date: "", reason: "" });
      await loadLeaves();
      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit leave request");
    } finally {
      setFormLoading(false);
    }
  };

  // Counts for KPIs
  const totalCount = leaves.length;
  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const rejectedCount = leaves.filter((l) => l.status === "rejected").length;

  // Filtered leaves
  const filteredLeaves = leaves.filter((leave) => {
    const matchesTab = activeTab === "all" || leave.status === activeTab;
    const matchesSearch =
      leave.leave_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
    }
  };

  const getLeaveIcon = (type) => {
    switch (type) {
      case "sick":
        return "medical_services";
      case "emergency":
        return "warning";
      case "unpaid":
        return "money_off";
      default:
        return "beach_access";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">event_available</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Leave Requests</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Submit leave applications and monitor approval statuses in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>Request Leave</span>
        </button>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Applications
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">assignment</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Pending Review
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">pending</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Approved
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">{approvedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Rejected
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">{rejectedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">cancel</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-surface-container-high border border-outline-variant/20">
          {[
            { id: "all", label: "All Requests", count: totalCount },
            { id: "pending", label: "Pending", count: pendingCount },
            { id: "approved", label: "Approved", count: approvedCount },
            { id: "rejected", label: "Rejected", count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-black/5 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
        </div>
      </div>

      {/* Requests Table */}
      <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-xs font-semibold uppercase text-on-surface-variant">
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">From</th>
                <th className="pb-3 px-4">To</th>
                <th className="pb-3 px-4">Days</th>
                <th className="pb-3 px-4">Reason</th>
                <th className="pb-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                      <span>Loading leave applications...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-1 block">
                      event_note
                    </span>
                    <p className="text-sm font-medium">No leave requests found</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Submit a new application or adjust your search filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg">
                            {getLeaveIcon(leave.leave_type)}
                          </span>
                        </div>
                        <span className="font-semibold text-on-surface capitalize">
                          {leave.leave_type} Leave
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface text-xs font-medium">
                      {new Date(leave.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-on-surface text-xs font-medium">
                      {new Date(leave.end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-on-surface text-xs px-2 py-0.5 rounded bg-surface-container">
                        {leave.days_count} {leave.days_count === 1 ? "day" : "days"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-xs max-w-xs truncate">
                      {leave.reason || "—"}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(leave.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">event_available</span>
                </div>
                <div>
                  <h2 className="font-headline text-lg font-bold text-on-surface">Apply for Leave</h2>
                  <p className="text-xs text-on-surface-variant">
                    Submit your application for manager review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                  setSuccess("");
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="m-6 mb-0 p-3.5 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-center gap-2 text-xs font-medium">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="m-6 mb-0 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-2 text-xs font-medium">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Leave Type
                </label>
                <select
                  name="leave_type"
                  value={form.leave_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="emergency">Emergency Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Reason (Optional)
                </label>
                <textarea
                  name="reason"
                  rows="3"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Provide context for your leave request..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {formLoading && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  <span>{formLoading ? "Submitting..." : "Submit Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}