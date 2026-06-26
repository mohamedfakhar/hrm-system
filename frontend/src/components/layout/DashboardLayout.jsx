import Sidebar from './Sidebar/Sidebar';
import Navbar  from './Navbar/Navbar';

export default function DashboardLayout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main content on the right */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <Navbar title={title} />

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}