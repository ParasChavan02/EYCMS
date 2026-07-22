import React from "react";
import { Route, Navigate } from "react-router-dom";

import FinanceDashboard from "./pages/FinanceDashboard";
import FinanceTransactions from "./pages/FinanceTransactions";
import FinanceBudget from "./pages/FinanceBudget";
import FinanceBills from "./pages/FinanceBills";
import FinanceReports from "./pages/FinanceReports";
import FinanceFellowUtilization from "./pages/FinanceFellowUtilization";
import FinanceEvents from "./pages/FinanceEvents";
import FinanceApprovals from "./pages/FinanceApprovals";
import FinanceReconciliation from "./pages/FinanceReconciliation";
import FinanceContactSupport from "./pages/FinanceContactSupport";

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
  path="/finance/approvals"
  element={<FinanceApprovals />}
/>


<Route path="/finance/reconciliation" element={<FinanceReconciliation />} />

<Route path="/finance/Events" element={<FinanceEvents />} />


    
    <Route
      path="/finance/fellow-utilization"
      element={<FinanceFellowUtilization />}
    />

    

    <Route
  path="/finance/ContactSupport"
  element={<FinanceContactSupport />}
/>
  </>
);