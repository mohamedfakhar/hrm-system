import { useState, useEffect } from "react";
import { getAllPayroll, generatePayroll, markAsPaid } from "../../api/payrollApi";

export default function PayrollManagement() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");

  const loadPayroll = async (m, y) => {
    try {
      setLoading(true);
      const res = await getAllPayroll({ month: m, year: y });
      setPayrolls(res.data.data || []);
    } catch (err) {
      console.error("Failed to load payroll:", err);
      setMessage({ text: "Failed to load payroll records.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll(month, year);
  }, [month, year]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setMessage({ text: "", type: "" });
      const res = await generatePayroll({ month: Number(month), year: Number(year) });
      setMessage({
        text: res.data?.message || `Payroll successfully generated for cycle ${month}/${year}.`,
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3500);
      await loadPayroll(month, year);
    } catch (err) {
      console.error("Failed to generate payroll:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to generate monthly payroll.",
        type: "error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsPaid = async (id, empName) => {
    try {
      setActionLoading(id);
      await markAsPaid(id);
      setMessage({
        text: `Salary for ${empName} marked as disbursed / paid.`,
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      await loadPayroll(month, year);
    } catch (err) {
      console.error("Failed to mark as paid:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to update disbursement status.",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Aggregate stats for Bento row
  const totalNet = payrolls.reduce((acc, curr) => acc + (Number(curr.net_salary) || 0), 0);
  const totalBonuses = payrolls.reduce((acc, curr) => acc + (Number(curr.bonuses) || 0), 0);
  const totalDeductions = payrolls.reduce(
    (acc, curr) => acc + (Number(curr.total_deductions) || 0),
    0
  );
  const paidCount = payrolls.filter((p) => p.payment_status === "paid").length;

  const filteredPayrolls = payrolls.filter((p) => {
    const name = p.employee_id?.full_name?.toLowerCase() || "";
    const code = p.employee_id?.employee_code?.toLowerCase() || "";
    const term = search.toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">payments</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Payroll Management</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Process monthly corporate compensation cycles, calculate attendance deductions, and disburse salaries.
          </p>
        </div>

        {/* Cycle Selectors & Process CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/40">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-transparent border-none outline-none cursor-pointer"
            >
              {monthNames.slice(1).map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-transparent border-none outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <span className="material-symbols-outlined text-sm animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-base">play_circle</span>
            )}
            <span>{generating ? "Calculating Salaries..." : "Run Payroll"}</span>
          </button>
        </div>
      </div>

      {/* Bento Grid: Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spending */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Disbursement
            </p>
            <p className="font-headline text-2xl font-bold text-primary mt-1">
              {totalNet.toLocaleString()}{" "}
              <span className="text-xs font-normal text-on-surface-variant">EGP</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
        </div>

        {/* Total Bonuses */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Total Bonuses
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">
              {totalBonuses.toLocaleString()}{" "}
              <span className="text-xs font-normal text-on-surface-variant">EGP</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">loyalty</span>
          </div>
        </div>

        {/* Total Deductions */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Total Deductions
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">
              {totalDeductions.toLocaleString()}{" "}
              <span className="text-xs font-normal text-on-surface-variant">EGP</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">price_check</span>
          </div>
        </div>

        {/* Payout Completion */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Disbursed Slips
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface mt-1">
              {paidCount} / {payrolls.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
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

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search employee name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
        </div>

        <span className="text-xs font-semibold text-on-surface-variant">
          Cycle: {monthNames[month]} {year} • {payrolls.length} records
        </span>
      </div>

      {/* Payroll Table */}
      <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-xs font-semibold uppercase text-on-surface-variant">
                <th className="pb-3 px-4">Employee</th>
                <th className="pb-3 px-4">Base Salary</th>
                <th className="pb-3 px-4">Attendance (P / L / A)</th>
                <th className="pb-3 px-4">Deductions</th>
                <th className="pb-3 px-4">Bonuses</th>
                <th className="pb-3 px-4">Net Disbursement</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4 text-right">Disbursement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">
                        progress_activity
                      </span>
                      <span>Loading payroll records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-1 block">
                      receipt_long
                    </span>
                    <p className="text-sm font-medium">
                      No payroll records generated for {monthNames[month]} {year}.
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Click the "Run Payroll" button above to compute salaries for this cycle.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => {
                  const empName = p.employee_id?.full_name || "Employee";
                  const initials = empName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={p._id}
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
                              {p.employee_id?.employee_code || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-on-surface">
                        {p.basic_salary?.toLocaleString()} EGP
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <span className="text-emerald-700 font-bold">{p.present_days || 0}P</span>
                        <span className="text-on-surface-variant mx-1">/</span>
                        <span className="text-amber-700 font-bold">{p.late_days || 0}L</span>
                        <span className="text-on-surface-variant mx-1">/</span>
                        <span className="text-rose-700 font-bold">{p.absent_days || 0}A</span>
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-rose-700">
                        − {p.total_deductions?.toLocaleString() || 0} EGP
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-emerald-700">
                        + {(p.bonuses || 0).toLocaleString()} EGP
                      </td>

                      <td className="py-3 px-4 font-headline font-bold text-primary text-sm">
                        {p.net_salary?.toLocaleString()} EGP
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            p.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.payment_status === "paid" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {p.payment_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {p.payment_status !== "paid" ? (
                          <button
                            type="button"
                            disabled={actionLoading === p._id}
                            onClick={() => handleMarkAsPaid(p._id, empName)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                          >
                            {actionLoading === p._id ? (
                              <span className="material-symbols-outlined text-sm animate-spin">
                                progress_activity
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-sm">check</span>
                            )}
                            <span>Mark Paid</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            <span>Paid</span>
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