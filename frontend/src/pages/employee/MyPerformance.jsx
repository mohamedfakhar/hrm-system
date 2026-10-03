import { useState, useEffect } from "react";
import { getMyEvaluations } from "../../api/performanceApi";

export default function MyPerformance() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const res = await getMyEvaluations();
        setEvaluations(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load personal evaluations:", err);
        setError("Failed to load your performance reviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, []);

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

  const latest = evaluations[0] || null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-on-surface">
            My Performance Reviews
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Track your professional evaluations, skill ratings, and manager feedback.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Top Metrics Cards (if records exist) */}
      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider">Latest Grade</p>
              <p className="text-3xl font-extrabold text-on-surface font-headline mt-1">
                Grade {latest.grade}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">Period {latest.period_key}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${getGradeBadge(latest.grade)}`}>
              {latest.grade}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider">Overall Score</p>
              <p className="text-3xl font-extrabold text-primary font-headline mt-1">
                {latest.final_score}
                <span className="text-sm text-outline font-normal"> / 100</span>
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">Weighted Final Score</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider">Total Reviews</p>
              <p className="text-3xl font-extrabold text-on-surface font-headline mt-1">
                {evaluations.length}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">Finalized Evaluations</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-surface-container text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">history</span>
            </div>
          </div>
        </div>
      )}

      {/* Evaluations Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-outline gap-3">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading your evaluations...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center text-outline gap-2">
            <span className="material-symbols-outlined text-4xl">workspace_premium</span>
            <p className="text-sm font-semibold text-on-surface">No evaluations published yet</p>
            <p className="text-xs text-on-surface-variant">
              Your finalized performance evaluations will appear here once published by HR.
            </p>
          </div>
        ) : (
          evaluations.map((item) => (
            <div
              key={item._id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 space-y-5 shadow-sm hover:border-outline-variant/60 transition-colors"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-xl text-sm font-bold ${getGradeBadge(item.grade)}`}>
                    Grade {item.grade}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface font-headline">
                      Evaluation Period: {item.period_key}
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      {item.period_type?.toUpperCase()} • {new Date(item.start_date).toLocaleDateString()} – {new Date(item.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-primary font-headline">
                    {item.final_score}
                    <span className="text-xs text-outline font-normal"> / 100</span>
                  </p>
                  <p className="text-[11px] text-outline">
                    Finalized {item.finalized_at ? new Date(item.finalized_at).toLocaleDateString() : ""}
                  </p>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-outline uppercase tracking-wider">
                  Evaluated Competencies
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {item.skills?.map((skill) => (
                    <div
                      key={skill.name}
                      className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-on-surface">{skill.name}</span>
                        <span className="font-bold text-primary">{skill.score}%</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Snapshot */}
              <div className="p-3 bg-surface-container-low rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-outline font-semibold">Attendance Component: </span>
                  <span className="font-bold text-on-surface">{item.attendance_score}%</span>
                </div>
                <div className="flex items-center gap-4 text-outline">
                  <span>Present: <strong className="text-emerald-600">{item.attendance_metrics?.present_days}d</strong></span>
                  <span>Late: <strong className="text-amber-600">{item.attendance_metrics?.late_days}d</strong></span>
                  <span>Absences: <strong className="text-rose-600">{item.attendance_metrics?.unexcused_absences}d</strong></span>
                </div>
              </div>

              {/* Manager Feedback */}
              {item.feedback && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-outline uppercase tracking-wider">
                    Manager Feedback
                  </p>
                  <p className="text-sm p-4 bg-surface-container-low rounded-xl text-on-surface leading-relaxed border border-outline-variant/20">
                    "{item.feedback}"
                  </p>
                </div>
              )}

              {/* Recommendation Note */}
              {item.recommendation_note && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-outline uppercase tracking-wider">
                    Development &amp; Progression Notes
                  </p>
                  <p className="text-sm p-4 bg-surface-container-low rounded-xl text-on-surface leading-relaxed border border-outline-variant/20">
                    {item.recommendation_note}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
