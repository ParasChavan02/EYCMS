import React from "react";
import { Route, Navigate } from "react-router-dom";

import FinanceDashboard from "./pages/FinanceDashboard";
import FinanceTransactions from "./pages/FinanceTransactions";
import FinanceBudget from "./pages/FinanceBudget";
import FinanceBills from "./pages/FinanceBills";
import FinanceReports from "./pages/FinanceReports";
import FinanceAuditTrail from "./pages/FinanceAuditTrail";
import FinanceFellowUtilization from "./pages/FinanceFellowUtilization";
import FinanceVendors from "./pages/FinanceVendors";
import FinanceApprovals from "./pages/FinanceApprovals";
import FinanceInvoices from "./pages/FinanceInvoices";
import FinanceReconciliation from "./pages/FinanceReconciliation";
import FinanceSettings from "./pages/FinanceSettings";

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
  path="/finance/vendors"
  element={<FinanceVendors />}
/>

<Route
  path="/finance/approvals"
  element={<FinanceApprovals />}
/>

<Route
  path="/finance/invoices"
  element={<FinanceInvoices />}
/>
<Route path="/finance/reconciliation" element={<FinanceReconciliation />} />
    
    <Route
      path="/finance/fellow-utilization"
      element={<FinanceFellowUtilization />}
    />

    <Route
      path="/finance/audit"
      element={<FinanceAuditTrail />}
    />

    <Route
  path="/finance/settings"
  element={<FinanceSettings />}
/>
  </>
);