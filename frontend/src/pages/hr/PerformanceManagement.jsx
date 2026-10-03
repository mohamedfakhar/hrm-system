import { useState, useEffect } from "react";
import {
  getAllEvaluations,
  createEvaluation,
  updateEvaluation,
  finalizeEvaluation,
  deleteEvaluation,
  getAttendancePreview
} from "../../api/performanceApi";
import { getAllEmployees } from "../../api/employeeApi";

const DEFAULT_SKILLS = [
  { name: "Communication", category: "Core", score: 85, weight: 0.25 },
  { name: "Teamwork", category: "Core", score: 85, weight: 0.25 },
  { name: "Problem Solving", category: "Core", score: 80, weight: 0.25 },
  { name: "Technical Skills", category: "Role Specific", score: 80, weight: 0.25 }
];

export default function PerformanceManagement() {
  const [evaluations, setEvaluations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [viewEvaluation, setViewEvaluation] = useState(null);

  // Form State
  const [form, setForm] = useState({
    employee_id: "",
    period_type: "quarterly",
    period_key: "2026-Q1",
    start_date: "2026-01-01",
    end_date: "2026-03-31",
    skills: DEFAULT_SKILLS,
    feedback: "",
    recommendation_note: "",
    status: "draft"
  });

  // Attendance Preview State
  const [attPreview, setAttPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evalRes, empRes] = await Promise.all([
        getAllEvaluations(),
        getAllEmployees()
      ]);
      setEvaluations(evalRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load evaluations:", err);
      setMessage({ text: "Failed to load performance evaluations.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update attendance preview whenever employee or dates change in modal
  useEffect(() => {
    if (modalOpen && form.employee_id && form.start_date && form.end_date) {
      const fetchPreview = async () => {
        try {
          setPreviewLoading(true);
          const res = await getAttendancePreview(form.employee_id, form.start_date, form.end_date);
          setAttPreview(res.data?.data || null);
        } catch (err) {
          console.error("Attendance preview error:", err);
          setAttPreview(null);
        } finally {
          setPreviewLoading(false);
        }
      };
      fetchPreview();
    }
  }, [modalOpen, form.employee_id, form.start_date, form.end_date]);

  const openCreateModal = () => {
    setEditingEvaluation(null);
    setForm({
      employee_id: employees[0]?._id || "",
      period_type: "quarterly",
      period_key: "2026-Q1",
      start_date: "2026-01-01",
      end_date: "2026-03-31",
      skills: DEFAULT_SKILLS.map((s) => ({ ...s })),
      feedback: "",
      recommendation_note: "",
      status: "draft"
    });
    setModalOpen(true);
  };

  const openEditModal = (evaluation) => {
    if (evaluation.status === "finalized") return;
    setEditingEvaluation(evaluation);
    setForm({
      employee_id: evaluation.employee_id?._id || evaluation.employee_id,
      period_type: evaluation.period_type || "quarterly",
      period_key: evaluation.period_key,
      start_date: evaluation.start_date ? evaluation.start_date.substring(0, 10) : "",
      end_date: evaluation.end_date ? evaluation.end_date.substring(0, 10) : "",
      skills: evaluation.skills?.length > 0 ? evaluation.skills.map((s) => ({ ...s })) : DEFAULT_SKILLS,
      feedback: evaluation.feedback || "",
      recommendation_note: evaluation.recommendation_note || "",
      status: evaluation.status || "draft"
    });
    setModalOpen(true);
  };

  const handleSkillScoreChange = (index, newScore) => {
    const scoreVal = Math.max(1, Math.min(100, Number(newScore) || 0));
    setForm((prev) => {
      const nextSkills = [...prev.skills];
      nextSkills[index] = { ...nextSkills[index], score: scoreVal };
      return { ...prev, skills: nextSkills };
    });
  };

  // Client-side visual preview calculations
  const computedSkillScore = (() => {
    if (!form.skills || form.skills.length === 0) return 0;
    const totalWeight = form.skills.reduce((sum, s) => sum + (s.weight || 1), 0);
    const weightedSum = form.skills.reduce((sum, s) => sum + (s.score * (s.weight || 1)), 0);
    return totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(1)) : 0;
  })();

  const computedAttendanceScore = attPreview?.attendanceScore ?? 100;
  const computedFinalScore = parseFloat(
    ((computedSkillScore * 0.70) + (computedAttendanceScore * 0.30)).toFixed(1)
  );

  const computedGrade = (() => {
    if (computedFinalScore >= 90) return "A";
    if (computedFinalScore >= 80) return "B";
    if (computedFinalScore >= 70) return "C";
    if (computedFinalScore >= 60) return "D";
    return "F";
  })();

  const handleFormSubmit = async (targetStatus) => {
    try {
      setActionLoading("submitting");
      const payload = {
        ...form,
        status: targetStatus
      };

      if (editingEvaluation) {
        await updateEvaluation(editingEvaluation._id, payload);
        setMessage({ text: "Evaluation updated successfully!", type: "success" });
      } else {
        await createEvaluation(payload);
        setMessage({
          text: targetStatus === "finalized"
            ? "Evaluation finalized and published to employee!"
            : "Evaluation saved as draft!",
          type: "success"
        });
      }

      setModalOpen(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      await loadData();
    } catch (err) {
      console.error("Submission error:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to save evaluation.",
        type: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalize = async (id, empName) => {
    if (!window.confirm(`Finalize and publish performance evaluation for ${empName}? Once finalized, scores cannot be edited.`)) {
      return;
    }

    try {
      setActionLoading(id);
      await finalizeEvaluation(id);
      setMessage({
        text: `Evaluation for ${empName} finalized and published.`,
        type: "success"
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      await loadData();
    } catch (err) {
      console.error("Finalization error:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to finalize evaluation.",
        type: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this draft evaluation?")) return;

    try {
      setActionLoading(id);
      await deleteEvaluation(id);
      setMessage({ text: "Draft evaluation deleted.", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      await loadData();
    } catch (err) {
      console.error("Delete error:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to delete evaluation.",
        type: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Filter evaluations
  const filteredEvaluations = evaluations.filter((item) => {
    const matchesPeriod = periodFilter === "all" || item.period_key === periodFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesGrade = gradeFilter === "all" || item.grade === gradeFilter;

    const empName = item.employee_id?.full_name?.toLowerCase() || "";
    const empCode = item.employee_id?.employee_code?.toLowerCase() || "";
    const dept = item.employee_id?.department?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    const matchesSearch = !query || empName.includes(query) || empCode.includes(query) || dept.includes(query);

    return matchesPeriod && matchesStatus && matchesGrade && matchesSearch;
  });

  const uniquePeriods = Array.from(new Set(evaluations.map((e) => e.period_key))).filter(Boolean);

  const getGradeBadge = (grade) => {
    switch (grade) {
      case "A":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
      case "B":
        return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
      case "C":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      case "D":
        return "bg-orange-500/10 text-orange-600 border border-orange-500/20";
      default:
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
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
          <h2 className="text-2xl font-bold font-headline text-on-surface">
            Performance Evaluations
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Conduct multi-factor appraisals combining skill assessments with attendance telemetry.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-md shadow-primary/20 hover:opacity-95 transition-opacity"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          New Evaluation
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">All Periods</option>
            {uniquePeriods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="finalized">Finalized</option>
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">All Grades</option>
            <option value="A">Grade A (90-100)</option>
            <option value="B">Grade B (80-89)</option>
            <option value="C">Grade C (70-79)</option>
            <option value="D">Grade D (60-69)</option>
            <option value="F">Grade F (&lt;60)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search employee or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-outline gap-3">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading evaluations...</p>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-outline gap-2">
            <span className="material-symbols-outlined text-4xl">trending_up</span>
            <p className="text-sm font-semibold text-on-surface">No evaluations found</p>
            <p className="text-xs text-on-surface-variant">
              Create a new evaluation to start tracking team performance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-outline text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-4">Period</th>
                  <th className="py-4 px-4 text-center">Skill Score</th>
                  <th className="py-4 px-4 text-center">Attendance Score</th>
                  <th className="py-4 px-4 text-center">Final Score</th>
                  <th className="py-4 px-4 text-center">Grade</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredEvaluations.map((item) => {
                  const emp = item.employee_id || {};
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      {/* Employee Info */}
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

                      {/* Period */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                          {item.period_key}
                        </span>
                      </td>

                      {/* Skill Score */}
                      <td className="py-4 px-4 text-center font-medium text-on-surface">
                        {item.skill_score}%
                      </td>

                      {/* Attendance Score */}
                      <td className="py-4 px-4 text-center font-medium text-on-surface">
                        {item.attendance_score}%
                      </td>

                      {/* Final Score */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-on-surface text-base">
                          {item.final_score}
                        </span>
                      </td>

                      {/* Grade */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${getGradeBadge(
                            item.grade
                          )}`}
                        >
                          Grade {item.grade}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === "finalized"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === "finalized" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {item.status === "finalized" ? "Finalized" : "Draft"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewEvaluation(item)}
                            title="View Full Details"
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>

                          {item.status === "draft" && (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                title="Edit Draft"
                                className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() => handleFinalize(item._id, emp.full_name)}
                                disabled={actionLoading === item._id}
                                title="Finalize and Publish"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {actionLoading === item._id ? (
                                  <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                                ) : (
                                  <span className="material-symbols-outlined text-lg">lock</span>
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
                                disabled={actionLoading === item._id}
                                title="Delete Draft"
                                className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT EVALUATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl border border-outline-variant/30 shadow-2xl p-6 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <h3 className="text-xl font-bold font-headline text-on-surface">
                  {editingEvaluation ? "Edit Evaluation Draft" : "New Performance Evaluation"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Appraise employee performance using skills scoring and attendance telemetry.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  Employee
                </label>
                <select
                  disabled={!!editingEvaluation}
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary disabled:opacity-60"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Key */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  Period Key
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026-Q1"
                  value={form.period_key}
                  onChange={(e) => setForm({ ...form, period_key: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Attendance Telemetry Live Preview Card */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">fingerprint</span>
                  Attendance Telemetry (Calculated from Live Logs)
                </span>
                {previewLoading && (
                  <span className="text-xs text-primary animate-pulse font-medium">
                    Calculating...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center">
                <div className="p-2 bg-surface-container-lowest rounded-lg">
                  <p className="text-[11px] text-outline">Working Days</p>
                  <p className="font-bold text-sm text-on-surface">
                    {attPreview?.metrics?.total_working_days ?? 0}
                  </p>
                </div>
                <div className="p-2 bg-surface-container-lowest rounded-lg">
                  <p className="text-[11px] text-outline">Present Days</p>
                  <p className="font-bold text-sm text-emerald-600">
                    {attPreview?.metrics?.present_days ?? 0}
                  </p>
                </div>
                <div className="p-2 bg-surface-container-lowest rounded-lg">
                  <p className="text-[11px] text-outline">Late Days</p>
                  <p className="font-bold text-sm text-amber-600">
                    {attPreview?.metrics?.late_days ?? 0}
                  </p>
                </div>
                <div className="p-2 bg-surface-container-lowest rounded-lg">
                  <p className="text-[11px] text-outline">Unexcused Absences</p>
                  <p className="font-bold text-sm text-rose-600">
                    {attPreview?.metrics?.unexcused_absences ?? 0}
                  </p>
                </div>
                <div className="p-2 bg-surface-container-lowest rounded-lg border border-primary/20">
                  <p className="text-[11px] text-primary font-semibold">Attendance Score</p>
                  <p className="font-extrabold text-sm text-primary">
                    {computedAttendanceScore}%
                  </p>
                </div>
              </div>
            </div>

            {/* Skills Evaluation Sliders / Inputs */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline uppercase tracking-wider">
                Skill Scoring (1 - 100)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {form.skills.map((skill, idx) => (
                  <div
                    key={skill.name}
                    className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{skill.name}</p>
                      <p className="text-[11px] text-outline">{skill.category} • Weight: {skill.weight * 100}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={skill.score}
                        onChange={(e) => handleSkillScoreChange(idx, e.target.value)}
                        className="w-16 px-2 py-1 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-center font-bold text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Computed Scores Summary Card */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">
                  Formula v1.0 Calculation Preview
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Final Score = (Skill Score × 70%) + (Attendance Score × 30%)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[11px] text-outline">Skill Score: <span className="font-bold text-on-surface">{computedSkillScore}%</span></p>
                  <p className="text-[11px] text-outline">Att. Score: <span className="font-bold text-on-surface">{computedAttendanceScore}%</span></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary font-headline">
                    {computedFinalScore}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-xl text-sm font-bold ${getGradeBadge(computedGrade)}`}>
                  Grade {computedGrade}
                </div>
              </div>
            </div>

            {/* Feedback & Recommendation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  Manager Feedback
                </label>
                <textarea
                  rows="3"
                  placeholder="Key accomplishments and observations..."
                  value={form.feedback}
                  onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  Recommendation / Development Note
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Recommended for leadership training / bonus eligible..."
                  value={form.recommendation_note}
                  onChange={(e) => setForm({ ...form, recommendation_note: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading === "submitting"}
                onClick={() => handleFormSubmit("draft")}
                className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={actionLoading === "submitting"}
                onClick={() => handleFormSubmit("finalized")}
                className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-95 shadow-md shadow-primary/20 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">lock</span>
                Finalize &amp; Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW EVALUATION DETAILS MODAL */}
      {viewEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant/30 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <h3 className="text-xl font-bold font-headline text-on-surface">
                  Performance Evaluation Details
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Period: {viewEvaluation.period_key} ({viewEvaluation.period_type})
                </p>
              </div>
              <button
                onClick={() => setViewEvaluation(null)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Score Highlight Banner */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-outline font-bold uppercase tracking-wider">Employee</p>
                <p className="text-base font-bold text-on-surface">{viewEvaluation.employee_id?.full_name}</p>
                <p className="text-xs text-on-surface-variant">
                  {viewEvaluation.employee_id?.employee_code} • {viewEvaluation.employee_id?.department}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-black text-primary font-headline">{viewEvaluation.final_score}</p>
                  <p className="text-[11px] text-outline">Final Score</p>
                </div>
                <div className={`px-3 py-1 rounded-xl text-sm font-bold ${getGradeBadge(viewEvaluation.grade)}`}>
                  Grade {viewEvaluation.grade}
                </div>
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-outline uppercase tracking-wider">Skill Ratings</p>
              <div className="grid grid-cols-2 gap-2">
                {viewEvaluation.skills?.map((s) => (
                  <div key={s.name} className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between text-xs">
                    <span className="font-medium text-on-surface">{s.name}</span>
                    <span className="font-bold text-primary">{s.score}/100</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Snapshot */}
            <div className="p-3 bg-surface-container-low rounded-xl space-y-1 text-xs">
              <p className="font-bold text-outline uppercase tracking-wider mb-2">
                Attendance Telemetry Snapshot (Frozen)
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-outline">Working Days</p>
                  <p className="font-bold text-on-surface">{viewEvaluation.attendance_metrics?.total_working_days}</p>
                </div>
                <div>
                  <p className="text-outline">Present Days</p>
                  <p className="font-bold text-emerald-600">{viewEvaluation.attendance_metrics?.present_days}</p>
                </div>
                <div>
                  <p className="text-outline">Late Days</p>
                  <p className="font-bold text-amber-600">{viewEvaluation.attendance_metrics?.late_days}</p>
                </div>
                <div>
                  <p className="text-outline">Late Minutes</p>
                  <p className="font-bold text-rose-600">{viewEvaluation.attendance_metrics?.total_late_minutes}m</p>
                </div>
              </div>
            </div>

            {/* Feedback & Notes */}
            <div className="space-y-3 text-sm">
              {viewEvaluation.feedback && (
                <div>
                  <p className="text-xs font-bold text-outline uppercase tracking-wider mb-1">Feedback</p>
                  <p className="p-3 rounded-xl bg-surface-container-low text-on-surface">{viewEvaluation.feedback}</p>
                </div>
              )}
              {viewEvaluation.recommendation_note && (
                <div>
                  <p className="text-xs font-bold text-outline uppercase tracking-wider mb-1">Recommendation Note</p>
                  <p className="p-3 rounded-xl bg-surface-container-low text-on-surface">{viewEvaluation.recommendation_note}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-outline pt-2 border-t border-outline-variant/30">
              <span>Evaluator: {viewEvaluation.evaluator_id?.email || "HR Manager"}</span>
              <span>Status: <strong className="uppercase">{viewEvaluation.status}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
