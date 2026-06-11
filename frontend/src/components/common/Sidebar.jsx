import { NavLink } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  BarChart3,
  ClipboardCheck,
  Clock,
  FileText,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  LockKeyhole,
  ReceiptIndianRupee,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES, isAdminRole } from "../../constants/routes";
import "./sidebar-enterprise.css";

function Sidebar({ isOpen, onClose, isCollapsed, isAdmin = false }) {
  const { user } = useAuth();
  const adminMode = isAdmin || isAdminRole(user);

  const adminNavItems = [
    {
      section: null,
      items: [{ icon: LayoutDashboard, label: "Dashboard", path: ROUTES.ADMIN_DASHBOARD }],
    },
    {
      section: "User Management",
      items: [
        { icon: Users, label: "Users", path: ROUTES.ADMIN_USERS },
        { icon: ShieldCheck, label: "Roles", path: ROUTES.ADMIN_USERS },
        { icon: LockKeyhole, label: "Permissions", path: ROUTES.ADMIN_USERS },
      ],
    },
    {
      section: "Finance",
      items: [
        { icon: WalletCards, label: "Budget Heads", path: ROUTES.ADMIN_BUDGET_HEADS },
        { icon: ReceiptIndianRupee, label: "Transactions", path: ROUTES.ADMIN_TRANSACTIONS },
        { icon: ClipboardCheck, label: "Reconciliation", path: ROUTES.ADMIN_RECONCILIATION },
      ],
    },
    {
      section: "Operations",
      items: [
        { icon: Sparkles, label: "Events", path: ROUTES.ADMIN_EVENTS },
        { icon: BarChart3, label: "Reports", path: ROUTES.ADMIN_REPORTS },
        { icon: ClipboardCheck, label: "Approvals", path: ROUTES.ADMIN_APPROVALS },
        { icon: FileText, label: "Audit Logs", path: ROUTES.ADMIN_AUDIT_LOGS },
      ],
    },
    {
      section: "Support Management",
      items: [
        { icon: Inbox, label: "All Tickets", path: ROUTES.ADMIN_SUPPORT_ALL },
        { icon: Clock, label: "Open Tickets", path: ROUTES.ADMIN_SUPPORT_OPEN },
        { icon: AlertCircle, label: "Critical Issues", path: ROUTES.ADMIN_SUPPORT_CRITICAL },
        { icon: Lightbulb, label: "Feature Requests", path: ROUTES.ADMIN_SUPPORT_FEATURES },
        { icon: BarChart3, label: "Support Analytics", path: ROUTES.ADMIN_SUPPORT_ANALYTICS },
        { icon: Activity, label: "System Status", path: ROUTES.ADMIN_SUPPORT_STATUS },
      ],
    },
    {
      section: "System",
      items: [{ icon: Settings, label: "Settings", path: ROUTES.ADMIN_SETTINGS }],
    },
  ];

  const userNavItems = [
    {
      section: null,
      items: [{ icon: LayoutDashboard, label: "Dashboard", path: ROUTES.USER_DASHBOARD }],
    },
    {
      section: "Workspace",
      items: [
        { icon: Users, label: "Profile", path: ROUTES.USER_PROFILE },
        { icon: Sparkles, label: "Events", path: ROUTES.USER_EVENTS },
        { icon: FileText, label: "Reports", path: ROUTES.USER_REPORTS },
        { icon: Settings, label: "Settings", path: ROUTES.USER_SETTINGS },
      ],
    },
  ];

  const navItems = adminMode ? adminNavItems : userNavItems;

  return (
    <aside className={`sidebar sidebar-enterprise ${isOpen ? "sidebar-open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-shell">
          {!isCollapsed ? (
            <>
              <div className="sidebar-brand-mark">EY</div>
              <div className="sidebar-brand">
                <h2 className="sidebar-logo">E-YUVA ERP</h2>
                <p className="sidebar-subtitle">{adminMode ? "Administration workspace" : "Workspace"}</p>
              </div>
            </>
          ) : (
            <div className="sidebar-logo-mini">EY</div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((group) => (
          <div key={group.section || "root"} className="nav-section">
            {!isCollapsed && group.section && <div className="nav-section-label">{group.section}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={`${item.label}-${item.path}`}
                  to={item.path}
                  end={item.path === ROUTES.ADMIN_DASHBOARD || item.path === ROUTES.USER_DASHBOARD}
                  onClick={onClose}
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  title={item.label}
                >
                  <span className="nav-icon">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  {!isCollapsed && <span className="nav-text">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
