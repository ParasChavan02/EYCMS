import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

function AppShellLayout({ isAdmin = false, storageKey }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined" || !storageKey) {
      return false;
    }

    return localStorage.getItem(storageKey) === "true";
  });

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    localStorage.setItem(storageKey, String(sidebarCollapsed));
  }, [sidebarCollapsed, storageKey]);

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
      <Sidebar
        isAdmin={isAdmin}
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
        <Topbar
          isAdmin={isAdmin}
          onMenuClick={() => setSidebarOpen((current) => !current)}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        />
        <Outlet />
      </div>
    </div>
  );
}

export default AppShellLayout;
