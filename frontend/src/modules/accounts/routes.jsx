import React from "react";
import { Route, Navigate } from "react-router-dom";

import FinanceDashboard from "./pages/FinanceDashboard";
import FinanceTransactions from "./pages/FinanceTransactions";
import FinanceBudget from "./pages/FinanceBudget";
import FinanceBills from "./pages/FinanceBills";
import FinanceReports from "./pages/FinanceReports";
import FinanceAuditTrail from "./pages/FinanceAuditTrail";

export const accountsRoutes = (
  <>
    <Route
      path="/finance"
      element={<Navigate to="/finance/dashboard" replace />}
    />

    <Route
      path="/finance/dashboard"
      element={<FinanceDashboard />}
    />

    <Route
      path="/finance/transactions"
      element={<FinanceTransactions />}
    />

    <Route
      path="/finance/budget"
      element={<FinanceBudget />}
    />

    <Route
      path="/finance/bills"
      element={<FinanceBills />}
    />

    <Route
      path="/finance/reports"
      element={<FinanceReports />}
    />

    <Route
      path="/finance/audit"
      element={<FinanceAuditTrail />}
    />
  </>
);