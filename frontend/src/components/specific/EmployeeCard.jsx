export default function EmployeeCard({ employee, onDelete }) {
  if (!employee) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-100 flex justify-between items-center">
      <div>
        <h4 className="font-semibold text-gray-800">{employee.full_name}</h4>
        <p className="text-xs text-gray-500">
          {employee.job_role} • {employee.department || 'General'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {employee.phone || 'No phone'} • Code: {employee.employee_code}
        </p>
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(employee._id)}
          className="text-red-500 hover:text-red-700 text-xs px-2.5 py-1 border border-red-200 rounded"
        >
          Deactivate
        </button>
      )}
    </div>
  );
}
