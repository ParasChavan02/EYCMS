import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/authcontext";
import { NotificationProvider } from "./context/notificationcontext";
import Toast from "./components/common/Toast";
import "./styles/sidebar.css";
import "./styles/forms.css";
import "./styles/tables.css";
import "./styles/dashboard.css";
import "./styles/global.css";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Events from "./pages/Events";
import Reconciliation from "./pages/Reconciliation";
import MasterData from "./pages/MasterData";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

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
    <NotificationProvider>
      <AuthProvider>
        <Toast />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/events" element={<Events />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/master" element={<MasterData />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;