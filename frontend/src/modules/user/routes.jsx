import { Route } from "react-router-dom";
import Events from "./pages/Events";
import Reports from "./pages/Reports";
import HelpCenter from "./pages/HelpCenter";
import ReportIssue from "./pages/ReportIssue";
import MyTickets from "./pages/MyTickets";
import FeatureRequests from "./pages/FeatureRequests";
import ContactSupport from "./pages/ContactSupport";

export const userRoutes = (
  <>
    <Route path="/events" element={<Events />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/help-center" element={<HelpCenter />} />
    <Route path="/report-issue" element={<ReportIssue />} />
    <Route path="/my-tickets" element={<MyTickets />} />
    <Route path="/feature-requests" element={<FeatureRequests />} />
    <Route path="/contact-support" element={<ContactSupport />} />
  </>
);
