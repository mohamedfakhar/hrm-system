import { useState, useEffect } from 'react';
import { getMyPayroll } from '../../api/payrollApi';

export default function MySalary() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    loadPayroll();
  }, []);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const res = await getMyPayroll();
      setPayrolls(res.data.data);
    } catch (err) {
      console.error('Failed to load payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  const latest = payrolls[0] || null;

  const monthName = (month) => {
    const names = ['', 'January', 'February', 'March', 'April', 'May',
      'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return names[month] || month;
  };

  return (
    <div className="salary-page">
      <h1 className="salary-title">My Salary</h1>

      {loading ? (
        <p className="salary-empty">Loading...</p>
      ) : payrolls.length === 0 ? (
        <div className="salary-empty-box">
          <p className="salary-empty">No salary records yet.</p>
          <p className="salary-empty-sub">Your payroll will appear here once HR generates it.</p>
        </div>
      ) : (
        <>
          {/* Latest Salary Card */}
          {latest && (
            <div className="salary-latest-card">
              <div className="salary-latest-left">
                <p className="salary-latest-label">
                  Latest Salary — {monthName(latest.month)} {latest.year}
                </p>
                <p className="salary-latest-amount">
                  {latest.net_salary?.toLocaleString()} EGP
                </p>
                <span className={`salary-status salary-status--${latest.payment_status}`}>
                  {latest.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
              </div>
              <div className="salary-latest-breakdown">
                <div className="salary-breakdown-item">
                  <span className="breakdown-label">Basic Salary</span>
                  <span className="breakdown-value">{latest.basic_salary?.toLocaleString()} EGP</span>
                </div>
                <div className="salary-breakdown-item">
                  <span className="breakdown-label">Deductions</span>
                  <span className="breakdown-value deduction">
                    − {latest.total_deductions?.toLocaleString()} EGP
                  </span>
                </div>
                <div className="salary-breakdown-item">
                  <span className="breakdown-label">Bonuses</span>
                  <span className="breakdown-value bonus">
                    + {latest.bonuses?.toLocaleString() || 0} EGP
                  </span>
                </div>
                <div className="salary-breakdown-divider" />
                <div className="salary-breakdown-item">
                  <span className="breakdown-label net">Net Salary</span>
                  <span className="breakdown-value net">
                    {latest.net_salary?.toLocaleString()} EGP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* History Table */}
          <div className="salary-history-box">
            <h3 className="salary-history-title">Salary History</h3>
            <table className="salary-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Basic</th>
                  <th>Deductions</th>
                  <th>Bonuses</th>
                  <th>Net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p._id}>
                    <td>{monthName(p.month)} {p.year}</td>
                    <td>{p.basic_salary?.toLocaleString()} EGP</td>
                    <td className="deduction">
                      − {p.total_deductions?.toLocaleString()} EGP
                    </td>
                    <td className="bonus">
                      + {p.bonuses?.toLocaleString() || 0} EGP
                    </td>
                    <td className="net-bold">
                      {p.net_salary?.toLocaleString()} EGP
                    </td>
                    <td>
                      <span className={`salary-status salary-status--${p.payment_status}`}>
                        {p.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}