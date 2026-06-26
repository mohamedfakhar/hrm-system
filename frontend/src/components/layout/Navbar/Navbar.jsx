import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import "./Navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

export default function Navbar({ title }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <h2>{title}</h2>

      <div className="nav-right">
        {/* Bell */}
        <div className="notif">
          <button onClick={() => setOpen(!open)}>
            <FontAwesomeIcon icon={faBell} />
            <span className="badge">3</span>
          </button>

          {open && (
            <div className="dropdown">
              <p>Notifications</p>
              <div>Leave approved</div>
              <div>Salary paid</div>
              <div>Late today</div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="user">
          <div className="avatar">{user?.email?.[0].toUpperCase()}</div>
          <div>
            <p>{user?.email}</p>
            <span>{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
