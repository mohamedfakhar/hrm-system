import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllEmployees, deleteEmployee } from "../../api/employeeApi";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError("Failed to load employee directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate employee: ${name}?`)) return;
    try {
      await deleteEmployee(id);
      setSuccessMsg(`Employee ${name} successfully deactivated.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadEmployees();
    } catch (err) {
      console.error("Failed to deactivate employee:", err);
      setError(err.response?.data?.message || "Failed to deactivate employee");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Distinct departments
  const departments = [
    "all",
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  const filteredEmployees = employees.filter((emp) => {
    const term = search.toLowerCase();
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(term) ||
      emp.job_role?.toLowerCase().includes(term) ||
      emp.department?.toLowerCase().includes(term) ||
      emp.employee_code?.toLowerCase().includes(term) ||
      emp.user_id?.email?.toLowerCase().includes(term);

    const matchesDept =
      departmentFilter === "all" || emp.department === departmentFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.is_active) ||
      (statusFilter === "inactive" && !emp.is_active);

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">groups</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Employee Directory</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Comprehensive personnel registry, active roles, and department assignments.
          </p>
        </div>

        <Link
          to="/hr/employees/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Add Employee</span>
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search name, code, role, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Dept:
            </span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 outline-none capitalize"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-primary px-3 py-1 bg-primary/10 rounded-full ml-auto md:ml-0">
            {filteredEmployees.length} {filteredEmployees.length === 1 ? "Employee" : "Employees"}
          </span>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-xs font-semibold uppercase text-on-surface-variant">
                <th className="pb-3 px-4">Employee</th>
                <th className="pb-3 px-4">Role & Department</th>
                <th className="pb-3 px-4">Contact</th>
                <th className="pb-3 px-4">Base Salary</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">
                        progress_activity
                      </span>
                      <span>Loading directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-1 block">
                      person_off
                    </span>
                    <p className="text-sm font-medium">No personnel records found</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Try adjusting your search criteria or add a new employee.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const initials =
                    emp.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "E";

                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface group-hover:text-primary transition-colors text-sm">
                              {emp.full_name}
                            </p>
                            <p className="text-[11px] text-on-surface-variant font-mono">
                              {emp.employee_code} • {emp.user_id?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-xs font-semibold text-on-surface">{emp.job_role}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant">
                          {emp.department || "General"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-on-surface font-medium">
                        {emp.phone || "—"}
                      </td>

                      <td className="py-3 px-4 text-xs font-bold text-on-surface">
                        {emp.basic_salary ? `${emp.basic_salary.toLocaleString()} EGP` : "—"}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            emp.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              emp.is_active ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {emp.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {emp.is_active ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(emp._id, emp.full_name)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs">person_remove</span>
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">
                            Deactivated
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