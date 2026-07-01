import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getHRStats } from "../../../api/dashboardApi";
import StatCard from "../../../components/common/StatCard/StatCard";
import "./HRDashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faUsers,
  faUserCheck,
  faUserXmark,
  faUmbrellaBeach,
  faClock,
  faUserTie,
  faUserPlus,
  faClipboardCheck,
  faCalendarDays,
  faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";

export default function HRDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ define first
  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await getHRStats();

      // fallback safe access
      const data = res?.data?.data || {};
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <div className="hr-dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="hr-dashboard">
      {/* Header */}
      <div className="hr-dashboard-header">
        <h1 className="hr-dashboard-title">Welcome back</h1>
        <p className="hr-dashboard-subtitle">
          {user?.role === "admin"
            ? "You have full system access"
            : "Here's what's happening today"}
        </p>
      </div>

      {/* Stats */}
      <div className="hr-stats-grid">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees ?? 0}
          icon={<FontAwesomeIcon icon={faUsers} />}
          color="blue"
        />

        <StatCard
          title="Present Today"
          value={stats?.presentToday ?? 0}
          icon={<FontAwesomeIcon icon={faUserCheck} />}
          color="green"
        />

        <StatCard
          title="Absent Today"
          value={stats?.absentToday ?? 0}
          icon={<FontAwesomeIcon icon={faUserXmark} />}
          color="red"
        />

        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves ?? 0}
          icon={<FontAwesomeIcon icon={faUmbrellaBeach} />}
          color="orange"
        />

        <StatCard
          title="Late Today"
          value={stats?.lateToday ?? 0}
          icon={<FontAwesomeIcon icon={faClock} />}
          color="yellow"
        />

        {user?.role === "admin" && (
          <StatCard
            title="HR Managers"
            value={stats?.hrManagersCount ?? 0}
            icon={<FontAwesomeIcon icon={faUserTie} />}
            color="purple"
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="hr-quick-actions">
        <h2 className="hr-section-title">Quick Actions</h2>

        <div className="hr-actions-grid">
          <a href="/hr/employees" className="hr-action-card">
            <span className="hr-action-icon">
              <FontAwesomeIcon icon={faUserPlus} />
            </span>
            <span>Add Employee</span>
          </a>

          <a href="/hr/leaves" className="hr-action-card">
            <span className="hr-action-icon">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </span>
            <span>Review Leaves</span>
          </a>

          <a href="/hr/attendance" className="hr-action-card">
            <span className="hr-action-icon">
              <FontAwesomeIcon icon={faCalendarDays} />
            </span>
            <span>View Attendance</span>
          </a>

          <a href="/hr/payroll" className="hr-action-card">
            <span className="hr-action-icon">
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </span>
            <span>Run Payroll</span>
          </a>

          {user?.role === "admin" && (
            <a
              href="/admin/add-hr"
              className="hr-action-card hr-action-card--admin"
            >
              <span className="hr-action-icon">
                <FontAwesomeIcon icon={faUserTie} />
              </span>
              <span>Add HR Manager</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
