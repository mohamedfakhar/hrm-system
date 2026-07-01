import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getEmployeeStats } from "../../../api/dashboardApi";
import { getMyAttendance } from "../../../api/attendanceApi";
import StatCard from "../../../components/common/StatCard/StatCard";
import AttendanceChart from "../../../components/specific/AttendanceChart/AttendanceChart";
import RecentAttendanceTable from "../../../components/specific/RecentAttendanceTable/RecentAttendanceTable";

import { FaUmbrellaBeach, FaCheckCircle, FaClock, FaClipboardList, FaCalendarAlt, FaMoneyBillWave, FaUser,} from "react-icons/fa";

import "./Dashboard.css";
import "../../../components/specific/AttendanceChart/AttendanceChart.css";
import "../../../components/specific/RecentAttendanceTable/RecentAttendanceTable.css";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
     
      const [statsRes, attendanceRes] = await Promise.all([
        getEmployeeStats(),
        getMyAttendance(),
      ]);

      setStats(statsRes.data.data);
      setAttendance(attendanceRes.data.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = attendance
    .slice(0, 5)
    .reverse()
    .map((rec) => ({
      day: new Date(rec.date).toLocaleDateString("en-US", { weekday: "short" }),
      hours: rec.working_hours || 0,
    }));

  const recentRecords = attendance.slice(0, 5);

  if (loading) {
    return <div className="emp-dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="emp-dashboard">
      {/* Welcome Section */}
      <div className="emp-dashboard-header">
        <h1 className="emp-dashboard-title">
          Hello {user?.email?.split("@")[0]}
        </h1>
        <p className="emp-dashboard-subtitle">
          Here's your summary for this month
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="emp-stats-grid">
        <StatCard
          title="Leave Balance"
          value={`${stats?.leaveBalance ?? 0} days`}
          icon={<FaUmbrellaBeach />}
          color="green"
        />
        <StatCard
          title="Present This Month"
          value={stats?.presentDaysThisMonth ?? 0}
          icon={<FaCheckCircle />}
          color="blue"
        />
        <StatCard
          title="Late This Month"
          value={stats?.lateDaysThisMonth ?? 0}
          icon={<FaClock />}
          color="orange"
        />
        <StatCard
          title="Pending Requests"
          value={stats?.pendingLeaveRequests ?? 0}
          icon={<FaClipboardList />}
          color="yellow"
        />
      </div>

      {/* Chart + Table Section */}
      <div className="emp-dashboard-grid">
        <AttendanceChart data={chartData} />
        <RecentAttendanceTable records={recentRecords} />
      </div>

      {/* Salary Section */}
      {stats?.lastSalary > 0 && (
        <div className="emp-salary-card">
          <div className="emp-salary-info">
            <h3 className="emp-salary-label">
              Last Salary — {stats.lastSalaryMonth}
            </h3>
            <p className="emp-salary-amount">
              {stats.lastSalary?.toLocaleString()} EGP
            </p>
          </div>
          <span
            className={`emp-salary-status emp-salary-status--${stats.lastSalaryStatus}`}
          >
            {stats.lastSalaryStatus === "paid" ? "Paid" : "Pending"}
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="emp-quick-actions">
        <h2 className="emp-section-title">Quick Actions</h2>
        <div className="emp-actions-grid">
          <a href="/employee/attendance" className="emp-action-card">
            <FaCalendarAlt />
            <span>My Attendance</span>
          </a>
          <a href="/employee/leaves" className="emp-action-card">
            <FaUmbrellaBeach />
            <span>Request Leave</span>
          </a>
          <a href="/employee/salary" className="emp-action-card">
            <FaMoneyBillWave />
            <span>My Salary</span>
          </a>
          <a href="/employee/profile" className="emp-action-card">
            <FaUser />
            <span>My Profile</span>
          </a>
        </div>
      </div>
    </div>
  );
}
