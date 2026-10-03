import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createEmployee } from "../../api/employeeApi";

export default function AddEmployee() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    job_role: "",
    department: "",
    basic_salary: "",
    hire_date: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await createEmployee({
        ...formData,
        basic_salary: Number(formData.basic_salary),
      });

      setSuccess("Employee onboarded successfully! Redirecting to directory...");
      setFormData({
        email: "",
        password: "",
        full_name: "",
        job_role: "",
        department: "",
        basic_salary: "",
        hire_date: "",
        phone: "",
      });

      setTimeout(() => {
        navigate("/hr/employees");
      }, 1400);
    } catch (err) {
      const errMsg =
        err.response?.data?.errors?.map((e) => e.message).join(", ") ||
        err.response?.data?.message ||
        "Failed to add employee. Please check inputs.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Link
            to="/hr/employees"
            className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Onboard New Employee
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Create employee account and configure personal profile records.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-sm">badge</span>
          HR Personnel Portal
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Account & Authentication */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-1.5 pb-2 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-base">lock</span>
              Account Credentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="employee@company.com"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    mail
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Initial Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    key
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Profile & Organizational Data */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-1.5 pb-2 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-base">person</span>
              Personal & Role Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Full Legal Name
                </label>
                <div className="relative">
                  <input
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Sarah Jenkins"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    badge
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+20 100 123 4567"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    call
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Job Role
                </label>
                <div className="relative">
                  <input
                    name="job_role"
                    type="text"
                    value={formData.job_role}
                    onChange={handleChange}
                    placeholder="Frontend Engineer"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    work
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <input
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Engineering"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    apartment
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Basic Monthly Salary (EGP)
                </label>
                <div className="relative">
                  <input
                    name="basic_salary"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.basic_salary}
                    onChange={handleChange}
                    placeholder="15000"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    payments
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Official Hire Date
                </label>
                <div className="relative">
                  <input
                    name="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    event
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-outline-variant/20">
            <Link
              to="/hr/employees"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading && (
                <span className="material-symbols-outlined text-sm animate-spin">
                  progress_activity
                </span>
              )}
              <span>{loading ? "Registering Employee..." : "Create Employee Account"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}