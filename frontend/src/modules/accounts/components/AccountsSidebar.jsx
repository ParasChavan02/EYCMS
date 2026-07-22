import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  WalletCards,
  ReceiptIndianRupee,
  FileText,
  ClipboardList,
  ScrollText,
  FileSpreadsheet,
  CalendarDays,
  LifeBuoy,
} from "lucide-react";

import { useAuth } from "../../common/hooks/useAuth";
import "../../common/components/sidebar-enterprise.css";
import { Settings } from "lucide-react";
function AccountsSidebar({ isOpen, onClose, isCollapsed }) {
  const { user } = useAuth();

  const accountsNavItems = [
  {
    section: "Overview",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        path: "/finance/dashboard",
      },
    ],
  },

  {
    section: "Financial Operations",
    items: [
      {
        icon: WalletCards,
        label: "Budget Overview",
        path: "/finance/budget",
      },
      {
        icon: ReceiptIndianRupee,
        label: "Transactions",
        path: "/finance/transactions",
      },
      {
        icon: ClipboardList,
        label: "Bills",
        path: "/finance/bills",
      },
    ],
  },

  {
    section: "Monitoring & Analytics",
    items: [
      {
        icon: FileText,
        label: "Reports",
        path: "/finance/reports",
      },
      {
        icon: ScrollText,
        label: "Bank Reconciliation",
        path: "/finance/reconciliation",
      },
      {
        icon: FileSpreadsheet,
        label: "Fellow Utilization",
        path: "/finance/fellow-utilization",
      },
      
    ],
  },

  {
    section: "Workflow",
    items: [
      {
        icon: ScrollText,
        label: "Approvals",
        path: "/finance/approvals",
      },
      {
        icon: CalendarDays, // Import CalendarDays from lucide-react
        label: "Events",
        path: "/finance/events",
      },
    ],
  },

  {
    section: "Support",
    items: [
      {
        icon: LifeBuoy,
        label: "Contact Support",
        path: "/finance/ContactSupport",
      },
    ],
  },
];
  return (
    <aside
      className={`sidebar sidebar-enterprise ${
        isOpen ? "sidebar-open" : ""
      } ${isCollapsed ? "collapsed" : ""}`}
    >
      <div className="sidebar-header">
        <div className="sidebar-brand-shell">
          {!isCollapsed ? (
            <>
              <img src="/eyuva_logo.jpg" alt="Logo" className="sidebar-brand-mark" style={{ objectFit: 'cover' }} />
              <div className="sidebar-brand">
                <h2 className="sidebar-logo">E-YUVA ERP</h2>
                <p className="sidebar-subtitle">Accounts Workspace</p>
              </div>
            </>
          ) : (
            <img src="/eyuva_logo.jpg" alt="Logo" className="sidebar-logo-mini" style={{ objectFit: 'cover' }} />
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {accountsNavItems.map((group) => (
          <div key={group.section || "root"} className="nav-section">
            {!isCollapsed && group.section && (
              <div className="nav-section-label">
                {group.section}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={`${item.label}-${item.path}`}
                  to={item.path}
                  end={item.path === "/finance/dashboard"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  title={item.label}
                >
                  <span className="nav-icon">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>

                  {!isCollapsed && (
                    <span className="nav-text">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default AccountsSidebar;