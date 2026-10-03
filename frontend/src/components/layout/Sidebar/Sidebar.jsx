import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const adminLinks = [
  { path: "/hr/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/hr/employees", label: "Employees", icon: "groups" },
  { path: "/hr/attendance", label: "Attendance", icon: "fingerprint" },
  { path: "/hr/leaves", label: "Leaves", icon: "calendar_today" },
  { path: "/hr/payroll", label: "Payroll", icon: "payments" },
  { path: "/hr/performance", label: "Performance", icon: "trending_up" },
  { path: "/hr/intelligence", label: "Intelligence", icon: "psychology" },
  { path: "/hr/recommendations", label: "Recommendations", icon: "auto_awesome" },
  { path: "/hr/assistant", label: "Smart Assistant", icon: "smart_toy" },
  { path: "/admin/add-hr", label: "Add HR", icon: "person_add" },
  { path: "/notifications", label: "Notifications", icon: "notifications" },
];

const hrLinks = [
  { path: "/hr/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/hr/employees", label: "Employees", icon: "groups" },
  { path: "/hr/attendance", label: "Attendance", icon: "fingerprint" },
  { path: "/hr/leaves", label: "Leaves", icon: "calendar_today" },
  { path: "/hr/payroll", label: "Payroll", icon: "payments" },
  { path: "/hr/performance", label: "Performance", icon: "trending_up" },
  { path: "/hr/intelligence", label: "Intelligence", icon: "psychology" },
  { path: "/hr/recommendations", label: "Recommendations", icon: "auto_awesome" },
  { path: "/hr/assistant", label: "Smart Assistant", icon: "smart_toy" },
  { path: "/notifications", label: "Notifications", icon: "notifications" },
];

const employeeLinks = [
  { path: "/employee/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/employee/attendance", label: "Attendance", icon: "fingerprint" },
  { path: "/employee/leaves", label: "My Leaves", icon: "calendar_today" },
  { path: "/employee/salary", label: "My Salary", icon: "payments" },
  { path: "/employee/performance", label: "Performance", icon: "trending_up" },
  { path: "/employee/profile", label: "Profile", icon: "person" },
  { path: "/notifications", label: "Notifications", icon: "notifications" },
];

export default function Sidebar({ mobileOpen = false, onClose }) {
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

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-outline-variant/30">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-2xl">hub</span>
          </div>
          <div>
            <h1 className="font-headline font-bold text-xl text-primary leading-tight">
              HRM Connect
            </h1>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Enterprise
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-6">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider px-4 mb-3">
            Main Menu
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? "sidebar-active bg-primary/10 text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low mb-3 border border-outline-variant/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary-container text-white font-bold flex items-center justify-center text-sm uppercase shrink-0">
              {user?.email?.[0] || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-on-surface truncate">
                {user?.email}
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium uppercase">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-error hover:bg-error-container/30 border border-error/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-sidebar-width bg-surface-container-lowest border-r border-outline-variant/40 z-30 shadow-sm">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex flex-col w-[280px] max-w-[85vw] h-full bg-surface-container-lowest shadow-2xl z-10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full"
              aria-label="Close Sidebar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
