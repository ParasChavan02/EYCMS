import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`layout ${sidebarCollapsed ? 'layout-collapsed' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onLinkClick={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} />

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen((state) => !state)} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;