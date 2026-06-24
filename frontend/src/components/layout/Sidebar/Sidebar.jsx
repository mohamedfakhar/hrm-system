import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const adminLinks = [
  { path: '/hr/dashboard',    label: 'Dashboard',       icon: '🏠' },
  { path: '/hr/employees',    label: 'Employees',       icon: '👥' },
  { path: '/hr/attendance',   label: 'Attendance',      icon: '📅' },
  { path: '/hr/leaves',       label: 'Leave Approvals', icon: '🌴' },
  { path: '/hr/payroll',      label: 'Payroll',         icon: '💰' },
  { path: '/admin/add-hr',    label: 'Add HR Manager',  icon: '➕' },
];

const hrLinks = [
  { path: '/hr/dashboard',    label: 'Dashboard',       icon: '🏠' },
  { path: '/hr/employees',    label: 'Employees',       icon: '👥' },
  { path: '/hr/attendance',   label: 'Attendance',      icon: '📅' },
  { path: '/hr/leaves',       label: 'Leave Approvals', icon: '🌴' },
  { path: '/hr/payroll',      label: 'Payroll',         icon: '💰' },
];

const employeeLinks = [
  { path: '/employee/dashboard',  label: 'Dashboard',   icon: '🏠' },
  { path: '/employee/attendance', label: 'Attendance',  icon: '📅' },
  { path: '/employee/leaves',     label: 'My Leaves',   icon: '🌴' },
  { path: '/employee/salary',     label: 'My Salary',   icon: '💰' },
  { path: '/employee/profile',    label: 'Profile',     icon: '👤' },
];


export default function Sidebar() {

  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();


  const links =
    user?.role === 'admin'
      ? adminLinks
      : user?.role === 'hr'
      ? hrLinks
      : employeeLinks;


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };


  return (
    <aside className="sidebar w-60 min-h-screen flex flex-col flex-shrink-0">


      {/* Logo */}
      <div className="sidebar-logo px-5 py-6 flex flex-col gap-1.5">

        <span className="sidebar-logo-text">
          HRM Portal
        </span>

        <span 
          className={`sidebar-role-badge role-${user?.role}`}
        >
          {user?.role?.toUpperCase()}
        </span>

      </div>



      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">

        {links.map((link)=>{

          const isActive = location.pathname === link.path;

          return (

            <Link
              key={link.path}
              to={link.path}
              className={`
                sidebar-link 
                flex items-center gap-3 
                px-3 py-2.5 
                rounded-lg 
                text-sm font-medium 
                no-underline
                ${isActive ? 'sidebar-link-active' : ''}
              `}
            >

              <span className="text-base w-5 text-center">
                {link.icon}
              </span>

              <span>
                {link.label}
              </span>

            </Link>

          )

        })}

      </nav>



      {/* Logout */}
      <div className="sidebar-logout-wrap px-3 py-4">

        <button 
          onClick={handleLogout}
          className="
            sidebar-logout-btn 
            w-full flex items-center gap-3 
            px-3 py-2.5 
            rounded-lg 
            text-sm font-medium
          "
        >

          <span>🚪</span>
          <span>Logout</span>

        </button>

      </div>


    </aside>
  );
}