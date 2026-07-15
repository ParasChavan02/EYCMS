import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "../modules/super-admin/components/SuperAdminSidebar";
import Navbar from "../modules/common/components/Navbar";

const STORAGE_KEY = "super_admin_sidebar_collapsed";

function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const shouldLockScroll = sidebarOpen && window.matchMedia("(max-width: 900px)").matches;
    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className={`layout ${sidebarCollapsed ? "layout-collapsed" : ""}`}>
      <SuperAdminSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <button
        type="button"
        className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      />

      <div className="main-content">
        <Navbar
          isAdmin={false}
          onMenuClick={() => setSidebarOpen((current) => !current)}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        />
        <Outlet />
      </div>
    </div>
  );
}

export default SuperAdminLayout;
