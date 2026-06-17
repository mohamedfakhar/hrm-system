import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AddEmployee() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email:     '',
    password:  '',
    full_name: '',
    job_role:  '',
    department:'',
    basic_salary: '',
    hire_date: '',
    phone:     ''
  });

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/employees', formData);

      setSuccess('Employee added successfully!');

      setFormData({
        email: '', password: '', full_name: '', job_role: '',
        department: '', basic_salary: '', hire_date: '', phone: ''
      });

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">

      <h2 className="text-2xl font-bold text-blue-600 mb-6">
        Add New Employee
      </h2>

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-600 p-3 rounded mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="block text-gray-700 mb-1">Full Name</label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Ahmed Hassan"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="ahmed@hrm.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Job Role</label>
            <input
              name="job_role"
              value={formData.job_role}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Developer"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Department</label>
            <input
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="IT"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Basic Salary</label>
            <input
              name="basic_salary"
              type="number"
              value={formData.basic_salary}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="10000"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Hire Date</label>
            <input
              name="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="+201234567890"
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Employee'}
        </button>

      </form>

      <Link to="/hr/dashboard" className="block text-center text-blue-600 hover:underline mt-4 text-sm">
        ← Back to Dashboard
      </Link>

    </div>
  );
}