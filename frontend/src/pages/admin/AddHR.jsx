import { useState } from "react";
import { Link } from "react-router-dom";
import { addHR } from "../../api/authApi";

export default function AddHR() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await addHR(formData.email, formData.password);
      setSuccess("HR Manager account provisioned successfully!");
      setFormData({
        email: "",
        password: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create HR account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Link
            to="/hr/dashboard"
            className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Add HR Manager
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Admin Governance • Provision management credentials
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="material-symbols-outlined text-sm">security</span>
          Super Admin
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm">
        <div className="mb-6 pb-4 border-b border-outline-variant/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="font-headline text-base font-bold text-on-surface">
              Manager Credentials
            </h2>
            <p className="text-xs text-on-surface-variant">
              The recipient will have permissions to view, approve, and manage company operations.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              HR Corporate Email
            </label>
            <div className="relative">
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="hr.director@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                mail
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Temporary Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                lock
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Minimum 6 characters with letters and numbers recommended.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/20">
            <Link
              to="/hr/dashboard"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading && (
                <span className="material-symbols-outlined text-sm animate-spin">
                  progress_activity
                </span>
              )}
              <span>{loading ? "Provisioning..." : "Create HR Account"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}