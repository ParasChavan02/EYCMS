import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import AccountsLayout from "./layouts/AccountsLayout";
import ProtectedRoute from "./modules/common/components/ProtectedRoute";
import AdminProtectedRoute from "./modules/common/components/AdminProtectedRoute";
import RootRedirect from "./modules/common/components/RootRedirect";
import { AuthProvider } from "./context/authcontext";
import { NotificationProvider } from "./context/notificationcontext";
import Toast from "./modules/common/components/Toast";
import { ROUTES } from "./modules/common/constants/routes";
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

import Dashboard from "./modules/user/pages/Dashboard";
import Profile from "./pages/Profile";

// Modular Route Configurations
import { authRoutes } from "./modules/auth/routes";
import { adminRoutes } from "./modules/admin/routes";
import { supportRoutes } from "./modules/support/routes";
import { userRoutes } from "./modules/user/routes";
import { accountsRoutes } from "./modules/accounts/routes";

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
              {/* Root Redirect Route */}
              <Route path={ROUTES.ROOT} element={<RootRedirect />} />

              {/* Auth Module Routes */}
              {authRoutes}

              {/* User Workspace Layout (ProtectedRoute + UserLayout) */}
              <Route
                element={
                  <ProtectedRoute>
                    <UserLayout />
                  </ProtectedRoute>
                }
              >
                <Route path={ROUTES.USER_DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.USER_PROFILE} element={<Profile />} />
                {userRoutes}
              </Route>

              {/* Admin Workspace Layout (AdminProtectedRoute + AdminLayout) */}
              <Route
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route path={ROUTES.ADMIN_PROFILE} element={<Profile />} />
                {adminRoutes}
                {supportRoutes}
              </Route>

              {/* Accounts Workspace Layout (AdminProtectedRoute + AccountsLayout) */}
              <Route
                element={
                  <AdminProtectedRoute>
                    <AccountsLayout />
                  </AdminProtectedRoute>
                }
              >
                {accountsRoutes}
              </Route>

              {/* Legacy/Redirect Routes */}
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
