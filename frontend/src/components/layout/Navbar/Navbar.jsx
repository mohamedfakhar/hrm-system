import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import "./Navbar.css";

export default function Navbar({ title }) {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="navbar h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left: Page title */}
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>

      {/* Right: Bell + User */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="navbar-bell-btn relative text-xl p-1"
          >
            <FontAwesomeIcon icon={faBell} />
            <span className="navbar-badge absolute top-0 right-0 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Dropdown */}
          {showNotif && (
            <div className="navbar-notif-dropdown absolute top-10 right-0 w-72 rounded-xl overflow-hidden z-50">
              <p className="navbar-notif-header px-4 py-3 text-[13px] font-bold text-slate-800">
                Notifications
              </p>

              <div className="navbar-notif-item flex items-start gap-3 px-4 py-3">
                <span
                  className="navbar-notif-dot mt-1 flex-shrink-0"
                  style={{ backgroundColor: "#10b981" }}
                />
                <div>
                  <p className="navbar-notif-text text-[13px] font-medium text-slate-800">
                    Leave request approved
                  </p>
                  <p className="navbar-notif-time text-[11px] text-slate-400 mt-0.5">
                    2 hours ago
                  </p>
                </div>
              </div>

              <div className="navbar-notif-item flex items-start gap-3 px-4 py-3">
                <span
                  className="navbar-notif-dot mt-1 flex-shrink-0"
                  style={{ backgroundColor: "#2563eb" }}
                />
                <div>
                  <p className="navbar-notif-text text-[13px] font-medium text-slate-800">
                    Salary for May has been paid
                  </p>
                  <p className="navbar-notif-time text-[11px] text-slate-400 mt-0.5">
                    1 day ago
                  </p>
                </div>
              </div>

              <div className="navbar-notif-item flex items-start gap-3 px-4 py-3">
                <span
                  className="navbar-notif-dot mt-1 flex-shrink-0"
                  style={{ backgroundColor: "#f59e0b" }}
                />
                <div>
                  <p className="navbar-notif-text text-[13px] font-medium text-slate-800">
                    You were marked late today
                  </p>
                  <p className="navbar-notif-time text-[11px] text-slate-400 mt-0.5">
                    Today
                  </p>
                </div>
              </div>

              <button className="navbar-mark-all-btn w-full p-2.5 text-[13px] font-semibold">
                Mark all as read
              </button>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="navbar-avatar w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-800">
              {user?.email}
            </p>
            <p className="text-[11px] text-slate-400 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
