import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faUsers,
  faCalendarDays,
  faTree,
  faMoneyBill,
  faPlus,
  faUser,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import "./Sidebar.css";

const adminLinks = [
  { path: "/hr/dashboard", label: "Dashboard", icon: faHouse },
  { path: "/hr/employees", label: "Employees", icon: faUsers },
  { path: "/hr/attendance", label: "Attendance", icon: faCalendarDays },
  { path: "/hr/leaves", label: "Leaves", icon: faTree },
  { path: "/hr/payroll", label: "Payroll", icon: faMoneyBill },
  { path: "/admin/add-hr", label: "Add HR", icon: faPlus },
];

const hrLinks = [
  { path: "/hr/dashboard", label: "Dashboard", icon: faHouse },
  { path: "/hr/employees", label: "Employees", icon: faUsers },
  { path: "/hr/attendance", label: "Attendance", icon: faCalendarDays },
  { path: "/hr/leaves", label: "Leaves", icon: faTree },
  { path: "/hr/payroll", label: "Payroll", icon: faMoneyBill },
];

const employeeLinks = [
  { path: "/employee/dashboard", label: "Dashboard", icon: faHouse },
  { path: "/employee/attendance", label: "Attendance", icon: faCalendarDays },
  { path: "/employee/leaves", label: "My Leaves", icon: faTree },
  { path: "/employee/salary", label: "Salary", icon: faMoneyBill },
  { path: "/employee/profile", label: "Profile", icon: faUser },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links =
    user?.role === "admin"
      ? adminLinks
      : user?.role === "hr"
        ? hrLinks
        : employeeLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h1>HRM</h1>
        <span className={`role role-${user?.role}`}>{user?.role}</span>
      </div>

      {/* Links */}
      <nav className="sidebar-links">
        {links.map((link) => {
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={link.icon} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} className="logout-btn">
        <FontAwesomeIcon icon={faRightFromBracket} />
        Logout
      </button>
    </aside>
  );
}
