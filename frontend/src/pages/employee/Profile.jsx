import { useState, useEffect } from 'react';
import { getMyProfile } from '../../api/employeeApi';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user }    = useAuth();
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getMyProfile();
      setProfile(res.data.data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="profile-loading">Loading profile...</p>;

  if (!profile) return (
    <div className="profile-not-found">
      <p>Profile not found.</p>
      <p className="profile-not-found-sub">Contact HR to complete your employee profile.</p>
    </div>
  );

  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const InfoRow = ({ label, value }) => (
    <div className="profile-info-row">
      <span className="profile-info-label">{label}</span>
      <span className="profile-info-value">{value || '—'}</span>
    </div>
  );

  return (
    <div className="profile-page">
      <h1 className="profile-title">My Profile</h1>

      {/* Avatar Card */}
      <div className="profile-avatar-card">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-avatar-info">
          <h2 className="profile-name">{profile.full_name}</h2>
          <p className="profile-role">{profile.job_role}</p>
          <span className="profile-department-badge">{profile.department || 'No Department'}</span>
        </div>
        <div className="profile-code-box">
          <p className="profile-code-label">Employee Code</p>
          <p className="profile-code-value">{profile.employee_code}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="profile-info-grid">

        {/* Personal Info */}
        <div className="profile-info-card">
          <h3 className="profile-card-title">Personal Information</h3>
          <InfoRow label="Full Name"   value={profile.full_name} />
          <InfoRow label="Email"       value={profile.user_id?.email || user?.email} />
          <InfoRow label="Phone"       value={profile.phone} />
          <InfoRow label="Address"     value={profile.address} />
        </div>

        {/* Job Info */}
        <div className="profile-info-card">
          <h3 className="profile-card-title">Job Information</h3>
          <InfoRow label="Job Role"      value={profile.job_role} />
          <InfoRow label="Department"    value={profile.department} />
          <InfoRow label="Hire Date"     value={new Date(profile.hire_date).toLocaleDateString()} />
          <InfoRow label="Leave Balance" value={`${profile.annual_leave_balance} days`} />
        </div>

      </div>
    </div>
  );
}