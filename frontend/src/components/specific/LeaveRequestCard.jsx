export default function LeaveRequestCard({ leave, showActions, onApprove, onReject }) {

  const statusColors = {
    pending:  'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gray-800 capitalize">{leave.leave_type} Leave</p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(leave.start_date).toLocaleDateString()} →{' '}
            {new Date(leave.end_date).toLocaleDateString()}
            <span className="ml-2 text-gray-400">({leave.days_count} days)</span>
          </p>
          {leave.reason && (
            <p className="text-sm text-gray-500 mt-1">Reason: {leave.reason}</p>
          )}
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[leave.status]}`}>
          {leave.status}
        </span>
      </div>

      {/* HR Actions */}
      {showActions && leave.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onApprove(leave._id)}
            className="bg-green-500 text-white text-xs px-3 py-1.5 rounded hover:bg-green-600"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(leave._id)}
            className="bg-red-500 text-white text-xs px-3 py-1.5 rounded hover:bg-red-600"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}