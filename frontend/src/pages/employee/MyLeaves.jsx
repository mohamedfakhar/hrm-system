import { useState, useEffect } from 'react';
import { getMyLeaves, createLeave } from '../../api/leaveApi';

export default function MyLeaves() {
  const [leaves,      setLeaves]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const [form, setForm] = useState({
    leave_type:  'annual',
    start_date:  '',
    end_date:    '',
    reason:      '',
  });

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await getMyLeaves();
      setLeaves(res.data.data);
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      await createLeave(form);
      setSuccess('Leave request submitted successfully!');
      setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      await loadLeaves();
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'approved') return 'leave-badge leave-badge--approved';
    if (status === 'rejected') return 'leave-badge leave-badge--rejected';
    return 'leave-badge leave-badge--pending';
  };

  return (
    <div className="leaves-page">
      {/* Header */}
      <div className="leaves-header">
        <h1 className="leaves-title">My Leave Requests</h1>
        <button
          className="leaves-btn-new"
          onClick={() => setShowModal(true)}
        >
          + Request Leave
        </button>
      </div>

      {/* Leaves Table */}
      <div className="leaves-table-box">
        {loading ? (
          <p className="leaves-empty">Loading...</p>
        ) : leaves.length === 0 ? (
          <p className="leaves-empty">No leave requests yet</p>
        ) : (
          <table className="leaves-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td className="capitalize">{leave.leave_type}</td>
                  <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                  <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                  <td>{leave.days_count}</td>
                  <td>{leave.reason || '—'}</td>
                  <td>
                    <span className={getStatusStyle(leave.status)}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2 className="modal-title">Request Leave</h2>
              <button
                className="modal-close"
                onClick={() => { setShowModal(false); setError(''); setSuccess(''); }}
              >
                ×
              </button>
            </div>

            {error   && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <form onSubmit={handleSubmit} className="modal-form">

              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select
                  name="leave_type"
                  value={form.leave_type}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="emergency">Emergency</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason (optional)</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  placeholder="Enter reason..."
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="modal-submit-btn"
              >
                {formLoading ? 'Submitting...' : 'Submit Request'}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}