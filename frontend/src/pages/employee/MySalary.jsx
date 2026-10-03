import { useState, useEffect } from "react";
import { getMyPayroll } from "../../api/payrollApi";

export default function MySalary() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPayroll = async () => {
    try {
      const res = await getMyPayroll();
      setPayrolls(res.data.data || []);
    } catch (err) {
      console.error("Failed to load payroll:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  const latest = payrolls[0] || null;

  const monthName = (month) => {
    const names = [
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
    return names[month] || month;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">payments</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Compensation & Salary</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Track your monthly earnings, deductions, bonuses, and verified payroll slips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Direct Deposit Active
          </span>
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-outline-variant/30">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-2 block">
            progress_activity
          </span>
          <p className="text-sm text-on-surface-variant">Loading salary breakdown...</p>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-outline-variant/30">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <h2 className="font-headline text-lg font-bold text-on-surface">No Salary Records Yet</h2>
          <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
            Your payroll statement will automatically appear here once HR processes the monthly cycle.
          </p>
        </div>
      ) : (
        <>
          {/* Latest Salary Hero Card */}
          {latest && (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-outline-variant/30 relative overflow-hidden shadow-sm">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
                {/* Left Side: Big Number */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Latest Pay Cycle
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                        {monthName(latest.month)} {latest.year}
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-on-surface-variant font-medium">Net Take-Home Pay</p>
                      <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary tracking-tight mt-1">
                        {latest.net_salary?.toLocaleString()}{" "}
                        <span className="text-lg font-normal text-on-surface-variant">EGP</span>
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        latest.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          latest.payment_status === "paid" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      {latest.payment_status === "paid" ? "Disbursed / Paid" : "Processing / Pending"}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Processed by Corporate Finance
                    </span>
                  </div>
                </div>

                {/* Right Side: Detailed Breakdown List */}
                <div className="w-full lg:w-80 bg-surface-container-low/80 p-5 rounded-xl border border-outline-variant/30 flex flex-col justify-between space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-2 border-b border-outline-variant/20">
                    Earnings Breakdown
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-on-surface">
                      <span className="text-on-surface-variant">Base Salary</span>
                      <span className="font-semibold">{latest.basic_salary?.toLocaleString()} EGP</span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-700">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">add_circle</span>
                        Bonuses & Incentives
                      </span>
                      <span className="font-semibold">
                        + {latest.bonuses?.toLocaleString() || 0} EGP
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-rose-700">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">remove_circle</span>
                        Tax & Late Deductions
                      </span>
                      <span className="font-semibold">
                        − {latest.total_deductions?.toLocaleString() || 0} EGP
                      </span>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/30 flex justify-between items-center text-sm font-bold text-on-surface">
                      <span>Net Disbursement</span>
                      <span className="text-primary">{latest.net_salary?.toLocaleString()} EGP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Salary Statements Table */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history_edu</span>
                <h2 className="font-headline text-lg font-bold text-on-surface">Salary History</h2>
              </div>
              <span className="text-xs text-on-surface-variant">
                Showing {payrolls.length} statements
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-xs font-semibold uppercase text-on-surface-variant">
                    <th className="pb-3 px-4">Pay Period</th>
                    <th className="pb-3 px-4">Base Salary</th>
                    <th className="pb-3 px-4">Deductions</th>
                    <th className="pb-3 px-4">Bonuses</th>
                    <th className="pb-3 px-4">Net Salary</th>
                    <th className="pb-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {payrolls.map((p) => (
                    <tr key={p._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-semibold text-on-surface">
                        {monthName(p.month)} {p.year}
                      </td>
                      <td className="py-3 px-4 text-on-surface text-xs">
                        {p.basic_salary?.toLocaleString()} EGP
                      </td>
                      <td className="py-3 px-4 text-rose-600 text-xs font-medium">
                        − {p.total_deductions?.toLocaleString() || 0} EGP
                      </td>
                      <td className="py-3 px-4 text-emerald-600 text-xs font-medium">
                        + {p.bonuses?.toLocaleString() || 0} EGP
                      </td>
                      <td className="py-3 px-4 font-bold text-primary text-xs">
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
                          {p.payment_status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}