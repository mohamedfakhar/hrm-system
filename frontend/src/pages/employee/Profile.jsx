import { useState, useEffect } from "react";
import { getMyProfile } from "../../api/employeeApi";
import { useAuth } from "../../context/AuthContext";

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 hover:bg-surface-container-low transition-colors">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="text-sm font-semibold text-on-surface truncate mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const res = await getMyProfile();
      setProfile(res.data.data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border border-outline-variant/30">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-2 block">
          progress_activity
        </span>
        <p className="text-sm text-on-surface-variant">Loading employee profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border border-outline-variant/30">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">badge</span>
        </div>
        <h2 className="font-headline text-lg font-bold text-on-surface">Profile Record Not Found</h2>
        <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
          Your employee details haven't been linked to your account yet. Please contact your HR
          administrator.
        </p>
      </div>
    );
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const formattedHireDate = profile.hire_date
    ? new Date(profile.hire_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const hireYear = profile.hire_date ? new Date(profile.hire_date).getFullYear() : "—";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">account_circle</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Employee Profile</h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Official personnel profile and organization records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active Employee
          </span>
        </div>
      </div>

      {/* Hero Bento Profile Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Identity Card */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          {/* Avatar with Ring */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white font-headline text-3xl font-extrabold flex items-center justify-center shadow-lg border-4 border-white">
              {initials}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xs">verified</span>
            </div>
          </div>

          {/* Identity Info */}
          <div className="flex-1 text-center sm:text-left space-y-2 relative z-10">
            <div>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                {profile.full_name}
              </h2>
              <p className="text-primary font-semibold text-sm mt-0.5">
                {profile.job_role || "Staff Member"} • {profile.department || "General"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant font-mono">
                ID: {profile.employee_code}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                Role: {user?.role || "Employee"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Bento Item */}
        <div className="lg:col-span-4 bg-gradient-to-br from-primary to-blue-700 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <span className="text-xs uppercase tracking-wider text-white/80 font-semibold block">
              Tenure & Status
            </span>
            <p className="font-headline text-2xl font-bold mt-1">Joined in {hireYear}</p>
            <p className="text-xs text-white/70 mt-0.5">Hire Date: {formattedHireDate}</p>
          </div>

          <div className="mt-6 pt-5 border-t border-white/20">
            <div className="flex justify-between items-center text-xs">
              <span className="uppercase tracking-wider text-white/80 font-semibold">
                Annual Leave Balance
              </span>
              <span className="font-bold text-sm">{profile.annual_leave_balance ?? 21} Days</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(15, ((profile.annual_leave_balance ?? 21) / 21) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-white/70 mt-1.5">Authorized corporate leave allocation</p>
          </div>
        </div>
      </div>

      {/* Two Column Detailed Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-xl">person</span>
            <h3 className="font-headline text-base font-bold text-on-surface">
              Personal Information
            </h3>
          </div>

          <div className="space-y-3">
            <DetailItem icon="badge" label="Full Legal Name" value={profile.full_name} />
            <DetailItem
              icon="mail"
              label="Corporate Email"
              value={profile.user_id?.email || user?.email}
            />
            <DetailItem icon="call" label="Phone Number" value={profile.phone} />
            <DetailItem icon="home_pin" label="Residential Address" value={profile.address} />
          </div>
        </div>

        {/* Employment & Organization */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-xl">corporate_fare</span>
            <h3 className="font-headline text-base font-bold text-on-surface">
              Job & Organization Details
            </h3>
          </div>

          <div className="space-y-3">
            <DetailItem icon="work" label="Designation / Role" value={profile.job_role} />
            <DetailItem icon="apartment" label="Department" value={profile.department} />
            <DetailItem icon="event" label="Hire Date" value={formattedHireDate} />
            <DetailItem
              icon="payments"
              label="Basic Monthly Compensation"
              value={profile.basic_salary ? `${profile.basic_salary.toLocaleString()} EGP` : "—"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}