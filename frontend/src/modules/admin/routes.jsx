import React from "react";
import { Route, Navigate } from "react-router-dom";
import AdminDashboardEnhanced from "./pages/AdminDashboardEnhanced";
import AdminUsers from "./pages/AdminUsers";
import AdminRoles from "./pages/AdminRoles";
import AdminPermissions from "./pages/AdminPermissions";
import ApprovalCenter from "./pages/ApprovalCenter";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminBudgetHeads from "./pages/AdminBudgetHeads";
import AdminTransactions from "./pages/AdminTransactions";
import AdminReconciliation from "./pages/AdminReconciliation";
import AdminReports from "./pages/AdminReports";
import AdminEvents from "./pages/AdminEvents";
import AdminSystemConfig from "./pages/AdminSystemConfig";
import TransactionReviewCenter from "./pages/TransactionReviewCenter";
import AdminUCManagement from "./pages/AdminUCManagement";
import AdminGallery from "./pages/AdminGallery";
import AdminOtherDocuments from "./pages/AdminOtherDocuments";

export const adminRoutes = (
  <>
    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="/admin/dashboard" element={<AdminDashboardEnhanced />} />
    <Route path="/admin/users" element={<AdminUsers />} />
    <Route path="/admin/roles" element={<AdminRoles />} />
    <Route path="/admin/permissions" element={<AdminPermissions />} />
    <Route path="/admin/approvals" element={<ApprovalCenter />} />
    <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
    <Route path="/admin/budget-heads" element={<AdminBudgetHeads />} />
    <Route path="/admin/transactions" element={<AdminTransactions />} />
    <Route path="/admin/reconciliation" element={<AdminReconciliation />} />
    <Route path="/admin/reports" element={<AdminReports />} />
    <Route path="/admin/events" element={<AdminEvents />} />
    <Route path="/admin/gallery" element={<AdminGallery />} />
    <Route path="/admin/other-documents" element={<AdminOtherDocuments />} />
    <Route path="/admin/settings" element={<AdminSystemConfig />} />
    <Route path="/admin/transaction-review" element={<TransactionReviewCenter />} />
    <Route path="/admin/uc-management" element={<AdminUCManagement />} />
    <Route path="/admin/uc" element={<AdminUCManagement />} />
  </>
);
