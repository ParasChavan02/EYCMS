export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  USER_DASHBOARD: "/dashboard",
  USER_PROFILE: "/profile",
  USER_EVENTS: "/events",
  USER_REPORTS: "/reports",
  USER_SETTINGS: "/settings",
  ADMIN_ROOT: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_PROFILE: "/admin/profile",
  ADMIN_USERS: "/admin/users",
  ADMIN_ROLES: "/admin/roles",
  ADMIN_PERMISSIONS: "/admin/permissions",
  ADMIN_TRANSACTIONS: "/admin/transactions",
  ADMIN_BUDGET_HEADS: "/admin/budget-heads",
  ADMIN_RECONCILIATION: "/admin/reconciliation",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_APPROVALS: "/admin/approvals",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_SUPPORT_ALL: "/admin/support/all",
  ADMIN_SUPPORT_OPEN: "/admin/support/open",
  ADMIN_SUPPORT_CRITICAL: "/admin/support/critical",
  ADMIN_SUPPORT_FEATURES: "/admin/support/features",
  ADMIN_SUPPORT_ANALYTICS: "/admin/support/analytics",
  ADMIN_SUPPORT_STATUS: "/admin/support/status",
  ADMIN_SUPPORT_TICKET_DETAILS: "/admin/support/ticket/:ticketId",
};

export function isAdminRole(account) {
  return account?.role?.toUpperCase() === "ADMIN";
}

export function getHomeRoute(account) {
  const role = account?.role?.toUpperCase();

  if (role === "ADMIN") {
    return ROUTES.ADMIN_DASHBOARD;
  }

  if (role === "ACCOUNTS") {
    return "/finance/dashboard";
  }

  return ROUTES.USER_DASHBOARD;
}

export function getProfileRoute(account) {
  return isAdminRole(account) ? ROUTES.ADMIN_PROFILE : ROUTES.USER_PROFILE;
}

export function getSettingsRoute(account) {
  return isAdminRole(account) ? ROUTES.ADMIN_SETTINGS : ROUTES.USER_SETTINGS;
}