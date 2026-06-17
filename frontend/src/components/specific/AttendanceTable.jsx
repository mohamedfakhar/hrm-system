export default function AttendanceTable({ records }) {

  const statusColors = {
    present: 'bg-green-100 text-green-700',
    late:    'bg-orange-100 text-orange-700',
    absent:  'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left p-4 text-gray-600">Date</th>
            <th className="text-left p-4 text-gray-600">Check In</th>
            <th className="text-left p-4 text-gray-600">Check Out</th>
            <th className="text-left p-4 text-gray-600">Hours</th>
            <th className="text-left p-4 text-gray-600">Late Min</th>
            <th className="text-left p-4 text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-10 text-gray-400">
                No attendance records
              </td>
            </tr>
          ) : (
            records.map((rec) => (
              <tr key={rec._id} className="border-b hover:bg-gray-50">
                <td className="p-4">{new Date(rec.date).toLocaleDateString()}</td>
                <td className="p-4">{rec.check_in || '—'}</td>
                <td className="p-4">{rec.check_out || '—'}</td>
                <td className="p-4">{rec.working_hours || '—'}</td>
                <td className="p-4">{rec.late_minutes || 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[rec.status]}`}>
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