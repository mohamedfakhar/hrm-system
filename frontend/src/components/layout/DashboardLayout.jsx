import { useState } from "react";
import Sidebar from "./Sidebar/Sidebar";
import Navbar from "./Navbar/Navbar";

export default function DashboardLayout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary/20">
      {/* Sidebar (Desktop sticky + Mobile drawer) */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main layout container */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-sidebar-width transition-all">
        {/* TopAppBar Navbar */}
        <Navbar title={title} onToggleSidebar={() => setMobileOpen(!mobileOpen)} />

        {/* Page content canvas */}
        <main className="flex-1 p-4 md:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}