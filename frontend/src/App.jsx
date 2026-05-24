import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/authcontext";
import { NotificationProvider } from "./context/notificationcontext";
import Toast from "./components/common/Toast";
import "./styles/sidebar.css";
import "./styles/forms.css";
import "./styles/tables.css";
import "./styles/dashboard.css";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Reconciliation from "./pages/Reconciliation";
import MasterData from "./pages/MasterData";
import Login from "./pages/Login";

function App() {
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
              <Route path="/reports" element={<Reports />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/master" element={<MasterData />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;