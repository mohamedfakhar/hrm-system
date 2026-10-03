import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAnomalies,
  getAnomalyStats,
  runAnomalyScan,
  reviewAnomaly,
  dismissAnomaly
} from "../../api/intelligenceApi";

export default function HRIntelligence() {
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState({ totalOpen: 0, highOpen: 0, mediumOpen: 0, lowOpen: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [domainFilter, setDomainFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Modal State
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [anomRes, statsRes] = await Promise.all([
        getAnomalies({
          domain: domainFilter === "all" ? undefined : domainFilter,
          severity: severityFilter === "all" ? undefined : severityFilter,
          status: statusFilter === "all" ? undefined : statusFilter
        }),
        getAnomalyStats()
      ]);
      setAnomalies(anomRes.data?.data || []);
      setStats(statsRes.data?.data || { totalOpen: 0, highOpen: 0, mediumOpen: 0, lowOpen: 0 });
    } catch (err) {
      console.error("Failed to load anomalies:", err);
      setMessage({ text: "Failed to load anomaly detection data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [domainFilter, severityFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScan = async () => {
    try {
      setScanning(true);
      const res = await runAnomalyScan();
      const { alerts_created, alerts_updated, scanned_employees } = res.data?.data || {};
      setMessage({
        text: `Scan complete: Scanned ${scanned_employees} employees. ${alerts_created} new alert(s) generated, ${alerts_updated} updated.`,
        type: "success"
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
      await loadData();
    } catch (err) {
      console.error("Scan failed:", err);
      setMessage({ text: "Anomaly scan failed.", type: "error" });
    } finally {
      setScanning(false);
    }
  };

  const handleAction = async (actionType) => {
    if (!resolutionNote.trim()) {
      alert("Please provide a resolution note before submitting.");
      return;
    }

    try {
      setActionLoading(true);
      if (actionType === "review") {
        await reviewAnomaly(selectedAnomaly._id, resolutionNote);
        setMessage({ text: "Anomaly successfully marked as reviewed.", type: "success" });
      } else {
        await dismissAnomaly(selectedAnomaly._id, resolutionNote);
        setMessage({ text: "Anomaly dismissed.", type: "success" });
      }

      setSelectedAnomaly(null);
      setResolutionNote("");
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      await loadData();
    } catch (err) {
      console.error("Action error:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to process anomaly.",
        type: "error"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setResolutionNote(anomaly.resolution_note || "");
  };

  const filteredAnomalies = anomalies.filter((item) => {
    const empName = item.employee_id?.full_name?.toLowerCase() || "";
    const empCode = item.employee_id?.employee_code?.toLowerCase() || "";
    const title = item.title?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();

    return !q || empName.includes(q) || empCode.includes(q) || title.includes(q);
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "high":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
    }
  };

  const getDomainIcon = (domain) => {
    switch (domain) {
      case "attendance":
        return "fingerprint";
      case "leave":
        return "calendar_today";
      case "payroll":
        return "payments";
      default:
        return "warning";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {message.text && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between transition-all duration-200 ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ text: "", type: "" })}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
            <h2 className="text-2xl font-bold font-headline text-on-surface">
              HR Intelligence &amp; Anomaly Detection
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant">
            Continuously analyzes attendance, leave patterns, and payroll variances using non-punitive statistical baseline rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/hr/assistant"
            className="px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">smart_toy</span>
            <span>Smart Assistant</span>
          </Link>
          <Link
            to="/hr/recommendations"
            className="px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            <span>View Recommendations</span>
          </Link>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-md shadow-primary/20 hover:opacity-95 transition-opacity disabled:opacity-50 text-xs sm:text-sm"
          >
            {scanning ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-xl">radar</span>
            )}
            {scanning ? "Scanning Workforce..." : "Run Anomaly Scan"}
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Open */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-outline font-bold uppercase tracking-wider">Open Anomalies</p>
            <p className="text-3xl font-extrabold text-on-surface font-headline mt-1">
              {stats.totalOpen}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Pending HR Review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
        </div>

        {/* High Severity */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-rose-500/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">High Severity</p>
            <p className="text-3xl font-extrabold text-rose-600 font-headline mt-1">
              {stats.highOpen}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Immediate Review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">priority_high</span>
          </div>
        </div>

        {/* Medium Severity */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-amber-500/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Medium Severity</p>
            <p className="text-3xl font-extrabold text-amber-600 font-headline mt-1">
              {stats.mediumOpen}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Lateness Surges</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">schedule</span>
          </div>
        </div>

        {/* Low Severity */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-blue-500/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Low Severity</p>
            <p className="text-3xl font-extrabold text-blue-600 font-headline mt-1">
              {stats.lowOpen}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Schedule Clustering</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">info</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Domain Filter */}
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">All Domains</option>
            <option value="attendance">Attendance</option>
            <option value="leave">Leave</option>
            <option value="payroll">Payroll</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="open">Open Alerts</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search employee or pattern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-outline gap-3">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading intelligence telemetry...</p>
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-outline gap-2">
            <span className="material-symbols-outlined text-4xl text-emerald-500">verified</span>
            <p className="text-sm font-semibold text-on-surface">No anomalies found</p>
            <p className="text-xs text-on-surface-variant">
              All employee operational patterns are currently within normal baseline thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-outline text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-4">Domain</th>
                  <th className="py-4 px-4">Pattern / Code</th>
                  <th className="py-4 px-4 text-center">Severity</th>
                  <th className="py-4 px-4">Detected At</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredAnomalies.map((item) => {
                  const emp = item.employee_id || {};
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      {/* Employee */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                            {emp.full_name ? emp.full_name.charAt(0) : "E"}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface leading-tight">
                              {emp.full_name || "Unknown Employee"}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {emp.employee_code || "N/A"} • {emp.department || "No Department"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Domain */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 capitalize text-xs font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-sm text-outline">
                            {getDomainIcon(item.domain)}
                          </span>
                          {item.domain}
                        </div>
                      </td>

                      {/* Pattern Title */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-on-surface text-xs leading-tight">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-outline font-mono mt-0.5">
                            {item.anomaly_code}
                          </p>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityBadge(
                            item.severity
                          )}`}
                        >
                          {item.severity}
                        </span>
                      </td>

                      {/* Detected At */}
                      <td className="py-4 px-4 text-xs text-on-surface-variant">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.status === "open"
                              ? "bg-rose-500/10 text-rose-600"
                              : item.status === "reviewed"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-surface-container text-outline"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === "open"
                                ? "bg-rose-500"
                                : item.status === "reviewed"
                                ? "bg-emerald-500"
                                : "bg-outline"
                            }`}
                          />
                          {item.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openModal(item)}
                          className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-semibold transition-colors"
                        >
                          Review &amp; Notes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ANOMALY REVIEW MODAL */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant/30 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getSeverityBadge(selectedAnomaly.severity)}`}>
                    {selectedAnomaly.severity} Severity
                  </span>
                  <span className="text-xs font-mono text-outline">{selectedAnomaly.anomaly_code}</span>
                </div>
                <h3 className="text-xl font-bold font-headline text-on-surface mt-1">
                  {selectedAnomaly.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Employee Card */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-outline font-bold uppercase tracking-wider">Employee</p>
                <p className="text-base font-bold text-on-surface">{selectedAnomaly.employee_id?.full_name}</p>
                <p className="text-xs text-on-surface-variant">
                  {selectedAnomaly.employee_id?.employee_code} • {selectedAnomaly.employee_id?.department}
                </p>
              </div>
              <div className="text-right text-xs text-on-surface-variant">
                <p>Domain: <strong className="capitalize">{selectedAnomaly.domain}</strong></p>
                <p>Status: <strong className="uppercase">{selectedAnomaly.status}</strong></p>
              </div>
            </div>

            {/* Factual Description */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-outline uppercase tracking-wider">Observable Telemetry</p>
              <p className="p-3 rounded-xl bg-surface-container-low text-on-surface text-sm leading-relaxed">
                {selectedAnomaly.description}
              </p>
            </div>

            {/* Metrics Snapshot */}
            {selectedAnomaly.metrics_snapshot && (
              <div className="p-3 bg-surface-container-low rounded-xl space-y-1 text-xs">
                <p className="font-bold text-outline uppercase tracking-wider mb-2">Metrics Snapshot</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-surface-container-lowest rounded-lg">
                    <p className="text-outline">Baseline</p>
                    <p className="font-bold text-on-surface">{selectedAnomaly.metrics_snapshot.baseline ?? "N/A"}</p>
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded-lg">
                    <p className="text-outline">Observed</p>
                    <p className="font-bold text-primary">{selectedAnomaly.metrics_snapshot.observed ?? "N/A"}</p>
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded-lg">
                    <p className="text-outline">Deviation</p>
                    <p className="font-bold text-rose-600">{selectedAnomaly.metrics_snapshot.deviation ?? "N/A"}</p>
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded-lg">
                    <p className="text-outline">Timeframe</p>
                    <p className="font-bold text-on-surface text-[11px] truncate">{selectedAnomaly.metrics_snapshot.timeframe ?? "14 Days"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Resolution Note (Required) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-outline uppercase tracking-wider">
                HR Resolution Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Document your findings, e.g. 'Discussed with team lead: employee had temporary family emergency'..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction("dismiss")}
                  className="px-4 py-2 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Dismiss Alert
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction("review")}
                  className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  Mark as Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
