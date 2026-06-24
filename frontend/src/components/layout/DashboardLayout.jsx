import Sidebar from '../layout/Navbar/Navbar';
import Navbar  from '../layout/Sidebar/Sidebar';


export default function DashboardLayout({ children, title }) {
  return (
    <div className="dashboard-wrapper flex min-h-screen">

      <Sidebar />

      {/* Right side */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <Navbar title={title} />

        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
}