import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminProtectedRoute from "./components/common/AdminProtectedRoute";
import { AuthProvider } from "./context/authcontext";
import { NotificationProvider } from "./context/notificationcontext";
import Toast from "./components/common/Toast";
import { ROUTES } from "./constants/routes";
import "./styles/sidebar.css";
import "./styles/forms.css";
import "./styles/tables.css";
import "./styles/dashboard.css";
import "./styles/global.css";
import "./styles/support.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Login from "./pages/Login";

import AdminDashboardEnhanced from "./pages/AdminDashboardEnhanced";
import AdminUsers from "./pages/AdminUsers";
import AdminRoles from "./pages/AdminRoles";
import AdminPermissions from "./pages/AdminPermissions";
import AdminTransactions from "./pages/AdminTransactions";
import AdminBudgetHeads from "./pages/AdminBudgetHeads";
import AdminReconciliation from "./pages/AdminReconciliation";
import AdminEvents from "./pages/AdminEvents";
import AdminReports from "./pages/AdminReports";
import AdminSystemConfig from "./pages/AdminSystemConfig";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import ApprovalCenter from "./pages/ApprovalCenter";

import { AllTicketsPage } from "./pages/admin/support/AllTicketsPage";
import { OpenTicketsPage } from "./pages/admin/support/OpenTicketsPage";
import { CriticalIssuesPage } from "./pages/admin/support/CriticalIssuesPage";
import { FeatureRequestsPage } from "./pages/admin/support/FeatureRequestsPage";
import { SupportAnalyticsPage } from "./pages/admin/support/SupportAnalyticsPage";
import { SystemStatusPage } from "./pages/admin/support/SystemStatusPage";
import { TicketDetailsPage } from "./pages/admin/support/TicketDetailsPage";

function App() {
  // Apply saved theme on app load
  useEffect(() => {
    const savedAppearance = localStorage.getItem("appearanceSettings");
    if (savedAppearance) {
      try {
        const parsed = JSON.parse(savedAppearance);
        if (parsed.theme) {
          document.documentElement.setAttribute("data-theme", parsed.theme);
        }
      } catch (e) {
        console.log("Could not load appearance settings");
      }
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <Toast />
          <BrowserRouter>
          <Routes>
            <Route path={ROUTES.ROOT} element={<Login />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route path={ROUTES.USER_DASHBOARD} element={<Dashboard />} />
              <Route path={ROUTES.USER_PROFILE} element={<Profile />} />
            </Route>

            <Route
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route path={ROUTES.ADMIN_ROOT} element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
              <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardEnhanced />} />
              <Route path={ROUTES.ADMIN_PROFILE} element={<Profile />} />
              <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
              <Route path={ROUTES.ADMIN_ROLES} element={<AdminRoles />} />
              <Route path={ROUTES.ADMIN_PERMISSIONS} element={<AdminPermissions />} />
              <Route path={ROUTES.ADMIN_TRANSACTIONS} element={<AdminTransactions />} />
              <Route path={ROUTES.ADMIN_BUDGET_HEADS} element={<AdminBudgetHeads />} />
              <Route path={ROUTES.ADMIN_RECONCILIATION} element={<AdminReconciliation />} />
              <Route path={ROUTES.ADMIN_EVENTS} element={<AdminEvents />} />
              <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReports />} />
              <Route path={ROUTES.ADMIN_APPROVALS} element={<ApprovalCenter />} />
              <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<AdminAuditLogs />} />
              <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSystemConfig />} />
              <Route path={ROUTES.ADMIN_SUPPORT_ALL} element={<AllTicketsPage />} />
              <Route path={ROUTES.ADMIN_SUPPORT_OPEN} element={<OpenTicketsPage />} />
              <Route path={ROUTES.ADMIN_SUPPORT_CRITICAL} element={<CriticalIssuesPage />} />
              <Route path={ROUTES.ADMIN_SUPPORT_FEATURES} element={<FeatureRequestsPage />} />
              <Route path={ROUTES.ADMIN_SUPPORT_ANALYTICS} element={<SupportAnalyticsPage />} />
              <Route path={ROUTES.ADMIN_SUPPORT_STATUS} element={<SystemStatusPage />} />
              <Route path={ROUTES.ADMIN_SUPPORT_TICKET_DETAILS} element={<TicketDetailsPage />} />
            </Route>

            <Route
              path="/users"
              element={
                <AdminProtectedRoute>
                  <Navigate to={ROUTES.ADMIN_USERS} replace />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <AdminProtectedRoute>
                  <Navigate to={ROUTES.ADMIN_TRANSACTIONS} replace />
                </AdminProtectedRoute>
              }
            />
            <Route path="/reconciliation" element={<Navigate to={ROUTES.ADMIN_RECONCILIATION} replace />} />
            <Route path="/events" element={<Navigate to={ROUTES.USER_DASHBOARD} replace />} />
            <Route path="/reports" element={<Navigate to={ROUTES.USER_DASHBOARD} replace />} />
            <Route path="/settings" element={<Navigate to={ROUTES.USER_PROFILE} replace />} />
            <Route path="/approval-center" element={<Navigate to={ROUTES.ADMIN_APPROVALS} replace />} />
            <Route path="/admin/system-config" element={<Navigate to={ROUTES.ADMIN_SETTINGS} replace />} />
            <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  </QueryClientProvider>
  );
}

export default App;
