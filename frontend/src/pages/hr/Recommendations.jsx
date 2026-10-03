import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getRecommendations,
  getRecommendationStats,
  generateRecommendations,
  acceptRecommendation,
  rejectRecommendation
} from "../../api/recommendationApi";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({
    totalSuggested: 0,
    totalAccepted: 0,
    totalRejected: 0,
    byType: {
      bonus_consideration: 0,
      promotion_review: 0,
      recognition: 0,
      support_check_in: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("suggested");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Modal State
  const [selectedRec, setSelectedRec] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState(null); // 'accept' or 'reject'

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [recsRes, statsRes] = await Promise.all([
        getRecommendations({
          type: typeFilter === "all" ? undefined : typeFilter,
          status: statusFilter === "all" ? undefined : statusFilter
        }),
        getRecommendationStats()
      ]);
      setRecommendations(recsRes.data?.data || []);
      setStats(statsRes.data?.data || {
        totalSuggested: 0,
        totalAccepted: 0,
        totalRejected: 0,
        byType: {
          bonus_consideration: 0,
          promotion_review: 0,
          recognition: 0,
          support_check_in: 0
        }
      });
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setMessage({ text: "Failed to load employee recommendations.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await generateRecommendations();
      const { recommendations_created, recommendations_updated, scanned_employees } = res.data?.data || {};
      setMessage({
        text: `Analysis complete: Scanned ${scanned_employees} employees. Generated ${recommendations_created} new suggestions, updated ${recommendations_updated} with latest telemetry.`,
        type: "success"
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      await loadData();
    } catch (err) {
      console.error("Generation failed:", err);
      setMessage({ text: "Failed to run recommendation analysis.", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleActionSubmit = async () => {
    if (actionType === "reject" && !reviewNote.trim()) {
      alert("A review note is required when rejecting a recommendation.");
      return;
    }

    try {
      setActionLoading(true);
      if (actionType === "accept") {
        await acceptRecommendation(selectedRec._id, reviewNote);
        setMessage({ text: "Recommendation successfully accepted for further action.", type: "success" });
      } else {
        await rejectRecommendation(selectedRec._id, reviewNote);
        setMessage({ text: "Recommendation rejected with review notes archived.", type: "success" });
      }

      setSelectedRec(null);
      setActionType(null);
      setReviewNote("");
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
      await loadData();
    } catch (err) {
      console.error("Action error:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to update recommendation status.",
        type: "error"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRecs = recommendations.filter((r) => {
    const empName = r.employee_id?.full_name?.toLowerCase() || "";
    const empCode = r.employee_id?.employee_code?.toLowerCase() || "";
    const title = r.title?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return !q || empName.includes(q) || empCode.includes(q) || title.includes(q);
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case "bonus_consideration":
        return {
          bg: "bg-amber-500/10 text-amber-700 border-amber-500/20",
          icon: "payments",
          label: "Bonus Consideration"
        };
      case "promotion_review":
        return {
          bg: "bg-purple-500/10 text-purple-700 border-purple-500/20",
          icon: "military_tech",
          label: "Promotion Review"
        };
      case "recognition":
        return {
          bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
          icon: "workspace_premium",
          label: "Recognition"
        };
      case "support_check_in":
        return {
          bg: "bg-rose-500/10 text-rose-700 border-rose-500/20",
          icon: "support_agent",
          label: "Support Check-In"
        };
      default:
        return {
          bg: "bg-blue-500/10 text-blue-700 border-blue-500/20",
          icon: "lightbulb",
          label: type
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
      case "rejected":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
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
            <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
            <h2 className="text-2xl font-bold font-headline text-on-surface">
              Smart Employee Recommendations
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant">
            Data-backed candidate suggestions for bonuses, promotion reviews, recognition, and supportive check-ins derived from verified performance and attendance history.
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
            to="/hr/intelligence"
            className="px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">radar</span>
            <span>View Anomalies</span>
          </Link>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-md shadow-primary/20 hover:opacity-95 transition-opacity disabled:opacity-50 text-xs sm:text-sm"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">sync</span>
            )}
            {generating ? "Analyzing Workforce..." : "Scan & Recommend"}
          </button>
        </div>
      </div>

      {/* KPI Overview Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* All Suggested */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-outline font-bold uppercase tracking-wider">All Suggestions</p>
            <p className="text-3xl font-extrabold text-on-surface font-headline mt-1">
              {stats.totalSuggested}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {stats.totalAccepted} Accepted · {stats.totalRejected} Rejected
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">tips_and_updates</span>
          </div>
        </div>

        {/* Bonus Consideration */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-amber-500/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Bonus Review</p>
            <p className="text-3xl font-extrabold text-amber-700 font-headline mt-1">
              {stats.byType?.bonus_consideration ?? 0}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Grade A + High Punctuality</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
        </div>

        {/* Promotion Review */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-purple-500/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-700 font-bold uppercase tracking-wider">Promotion</p>
            <p className="text-3xl font-extrabold text-purple-700 font-headline mt-1">
              {stats.byType?.promotion_review ?? 0}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Tenure &ge; 12m + Grade A</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">military_tech</span>
          </div>
        </div>

        {/* Recognition */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-emerald-500/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Recognition</p>
            <p className="text-3xl font-extrabold text-emerald-700 font-headline mt-1">
              {stats.byType?.recognition ?? 0}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Score &ge; 90 + Punctual</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">workspace_premium</span>
          </div>
        </div>

        {/* Support Check-Ins */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-rose-500/20 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Support Check-In</p>
            <p className="text-3xl font-extrabold text-rose-700 font-headline mt-1">
              {stats.byType?.support_check_in ?? 0}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Variance or Low Score</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search employee, ID, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface placeholder:text-outline"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-surface rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            <option value="bonus_consideration">Bonus Consideration</option>
            <option value="promotion_review">Promotion Review</option>
            <option value="recognition">Recognition</option>
            <option value="support_check_in">Support Check-In</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="suggested">Suggested (Open)</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-6">Recommendation</th>
                <th className="py-4 px-6">Performance</th>
                <th className="py-4 px-6">Attendance</th>
                <th className="py-4 px-6">Anomalies</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary block mb-2">
                      progress_activity
                    </span>
                    <p className="text-sm">Evaluating workforce telemetry...</p>
                  </td>
                </tr>
              ) : filteredRecs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2 block">
                      check_circle
                    </span>
                    <p className="font-semibold text-base text-on-surface">No Recommendations Found</p>
                    <p className="text-xs text-outline mt-1">
                      {statusFilter === "suggested"
                        ? "All employee telemetry is currently aligned or no new candidates qualify under the active criteria."
                        : "No recommendations match the selected filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecs.map((rec) => {
                  const badge = getTypeBadge(rec.type);
                  return (
                    <tr
                      key={rec._id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      {/* Employee */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {rec.employee_id?.full_name?.charAt(0) || "E"}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">
                              {rec.employee_id?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-outline">
                              {rec.employee_id?.employee_code || "EMP"} · {rec.employee_id?.department || "General"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Recommendation Type */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                          >
                            <span className="material-symbols-outlined text-sm">{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-1 max-w-xs">
                          {rec.summary}
                        </p>
                      </td>

                      {/* Performance */}
                      <td className="py-4 px-6">
                        {rec.supporting_data?.performance_grade ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                rec.supporting_data.performance_grade === "A"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rec.supporting_data.performance_grade === "B"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {rec.supporting_data.performance_grade}
                            </span>
                            <span className="text-xs font-semibold text-on-surface">
                              {rec.supporting_data.performance_score}/100
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-outline">No eval</span>
                        )}
                      </td>

                      {/* Attendance */}
                      <td className="py-4 px-6">
                        <div className="text-xs">
                          {rec.supporting_data?.punctuality_rate !== null && rec.supporting_data?.punctuality_rate !== undefined ? (
                            <div>
                              <span className="font-semibold text-on-surface">
                                {rec.supporting_data.punctuality_rate}%
                              </span>{" "}
                              <span className="text-outline">punctual</span>
                              {rec.supporting_data.late_days > 0 && (
                                <p className="text-[11px] text-amber-600">
                                  {rec.supporting_data.late_days} late arrival(s)
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-outline">N/A</span>
                          )}
                        </div>
                      </td>

                      {/* Anomalies */}
                      <td className="py-4 px-6">
                        <div className="text-xs">
                          {rec.supporting_data?.high_severity_anomalies > 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <span className="material-symbols-outlined text-xs">warning</span>
                              {rec.supporting_data.high_severity_anomalies} High
                            </span>
                          ) : rec.supporting_data?.open_anomalies > 0 ? (
                            <span className="text-amber-600 font-medium">
                              {rec.supporting_data.open_anomalies} Open
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check</span>
                              Clean (0)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusBadge(
                            rec.status
                          )}`}
                        >
                          {rec.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedRec(rec);
                            setActionType(null);
                            setReviewNote("");
                          }}
                          className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation Details & Review Modal */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-outline-variant/30 max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">
                    {getTypeBadge(selectedRec.type).icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-on-surface">
                    {selectedRec.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        getTypeBadge(selectedRec.type).bg
                      }`}
                    >
                      {getTypeBadge(selectedRec.type).label}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusBadge(
                        selectedRec.status
                      )}`}
                    >
                      {selectedRec.status}
                    </span>
                    <span className="text-xs text-outline">
                      v{selectedRec.rule_version}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRec(null);
                  setActionType(null);
                }}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Employee Header Info */}
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-on-surface">
                  {selectedRec.employee_id?.full_name}
                </p>
                <p className="text-xs text-outline mt-0.5">
                  ID: {selectedRec.employee_id?.employee_code || "EMP"} · Role:{" "}
                  {selectedRec.employee_id?.job_role || "Staff"} · Dept:{" "}
                  {selectedRec.employee_id?.department || "General"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-outline block">Company Tenure</span>
                <span className="text-sm font-bold text-on-surface">
                  {selectedRec.supporting_data?.tenure_months ?? 0} Months
                </span>
              </div>
            </div>

            {/* Objective Summary */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                Evaluation Summary
              </h4>
              <p className="text-sm text-on-surface bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20">
                {selectedRec.summary}
              </p>
            </div>

            {/* Objective Supporting Rationale */}
            {selectedRec.rationale && selectedRec.rationale.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-outline mb-2">
                  Supporting Evidence &amp; Rule Rationale
                </h4>
                <div className="space-y-2">
                  {selectedRec.rationale.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20 text-xs text-on-surface"
                    >
                      <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Telemetry Snapshot Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-outline mb-2">
                Operational Telemetry Snapshot
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <span className="text-outline block text-[11px]">Performance Grade</span>
                  <span className="font-bold text-base text-on-surface mt-0.5 block">
                    {selectedRec.supporting_data?.performance_grade || "N/A"}{" "}
                    {selectedRec.supporting_data?.performance_score
                      ? `(${selectedRec.supporting_data.performance_score}/100)`
                      : ""}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <span className="text-outline block text-[11px]">Punctuality Rate</span>
                  <span className="font-bold text-base text-on-surface mt-0.5 block">
                    {selectedRec.supporting_data?.punctuality_rate !== null &&
                    selectedRec.supporting_data?.punctuality_rate !== undefined
                      ? `${selectedRec.supporting_data.punctuality_rate}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <span className="text-outline block text-[11px]">Late Days</span>
                  <span className="font-bold text-base text-on-surface mt-0.5 block">
                    {selectedRec.supporting_data?.late_days ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <span className="text-outline block text-[11px]">High Anomalies</span>
                  <span
                    className={`font-bold text-base mt-0.5 block ${
                      (selectedRec.supporting_data?.high_severity_anomalies ?? 0) > 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {selectedRec.supporting_data?.high_severity_anomalies ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Review History (if already reviewed) */}
            {selectedRec.status !== "suggested" && (
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1">
                <div className="flex items-center justify-between text-xs text-outline">
                  <span>
                    Reviewed by:{" "}
                    <strong className="text-on-surface">
                      {selectedRec.reviewed_by?.email || "HR Manager"}
                    </strong>
                  </span>
                  <span>
                    {selectedRec.reviewed_at
                      ? new Date(selectedRec.reviewed_at).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                {selectedRec.review_notes && (
                  <p className="text-xs text-on-surface mt-1 italic">
                    &ldquo;{selectedRec.review_notes}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Action Form (For suggested recommendations) */}
            {selectedRec.status === "suggested" && (
              <div className="space-y-3 pt-2 border-t border-outline-variant/30">
                {!actionType ? (
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setActionType("reject")}
                      className="px-4 py-2 border border-rose-500/30 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Reject Recommendation
                    </button>
                    <button
                      onClick={() => setActionType("accept")}
                      className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold shadow-md transition-colors"
                    >
                      Accept Recommendation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-on-surface">
                        {actionType === "accept"
                          ? "Accept Recommendation for Next HR Phase"
                          : "Reject Recommendation (Mandatory Notes)"}
                      </p>
                      <button
                        onClick={() => setActionType(null)}
                        className="text-xs text-outline hover:underline"
                      >
                        Cancel
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      placeholder={
                        actionType === "accept"
                          ? "Enter optional confirmation note (e.g. Approved for upcoming Q2 bonus cycle)..."
                          : "Provide mandatory reason for rejection (e.g. Employee enrolled in alternative career track)..."
                      }
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      className="w-full p-3 bg-surface rounded-xl border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActionType(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-outline hover:text-on-surface"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleActionSubmit}
                        disabled={actionLoading}
                        className={`px-4 py-1.5 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50 ${
                          actionType === "accept"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-rose-600 hover:bg-rose-700"
                        }`}
                      >
                        {actionLoading ? "Submitting..." : `Confirm ${actionType === "accept" ? "Acceptance" : "Rejection"}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
