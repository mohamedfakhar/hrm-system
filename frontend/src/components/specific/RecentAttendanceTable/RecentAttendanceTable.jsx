export default function RecentAttendanceTable({ records }) {
  return (
    <div className="recent-attendance-box">
      <h3 className="recent-attendance-title">Recent Attendance</h3>

      <table className="recent-attendance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="5" className="recent-attendance-empty">
                No attendance records yet
              </td>
            </tr>
          ) : (
            records.map((rec) => (
              <tr key={rec._id}>
                <td>{new Date(rec.date).toLocaleDateString()}</td>
                <td>{rec.check_in || "—"}</td>
                <td>{rec.check_out || "—"}</td>
                <td>{rec.working_hours ? `${rec.working_hours}h` : "—"}</td>
                <td>
                  <span className={`status-badge status-badge--${rec.status}`}>
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
