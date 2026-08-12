import React from "react";
import { Route } from "react-router-dom";
import { AllTicketsPage } from "./pages/AllTicketsPage";
import { OpenTicketsPage } from "./pages/OpenTicketsPage";
import { CriticalIssuesPage } from "./pages/CriticalIssuesPage";
import { FeatureRequestsPage } from "./pages/FeatureRequestsPage";
import { SupportAnalyticsPage } from "./pages/SupportAnalyticsPage";
import { SystemStatusPage } from "./pages/SystemStatusPage";
import { TicketDetailsPage } from "./pages/TicketDetailsPage";

export const supportRoutes = (
  <>
    <Route path="/admin/support/all" element={<AllTicketsPage />} />
    <Route path="/admin/support/open" element={<OpenTicketsPage />} />
    <Route path="/admin/support/critical" element={<CriticalIssuesPage />} />
    <Route path="/admin/support/features" element={<FeatureRequestsPage />} />
    <Route path="/admin/support/analytics" element={<SupportAnalyticsPage />} />
    <Route path="/admin/support/status" element={<SystemStatusPage />} />
    <Route path="/admin/support/ticket/:ticketId" element={<TicketDetailsPage />} />
  </>
);

