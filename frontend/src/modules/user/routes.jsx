import { Route } from "react-router-dom";
import Events from "./pages/Events";
import Reports from "./pages/Reports";
import HelpCenter from "./pages/HelpCenter";
import ReportIssue from "./pages/ReportIssue";
import Transactions from "./pages/Transactions";
import MyTickets from "./pages/MyTickets";
import FeatureRequests from "./pages/FeatureRequests";
import ContactSupport from "./pages/ContactSupport";
import BankReconciliation from "./pages/BankReconciliation";

export const userRoutes = (
  <>
    <Route path="/events" element={<Events />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/help-center" element={<HelpCenter />} />
    <Route path="/report-issue" element={<ReportIssue />} />
    <Route path="/transactions" element={<Transactions />} />
    <Route path="/bank-reconciliation" element={<BankReconciliation />} />
    <Route path="/my-tickets" element={<MyTickets />} />
    <Route path="/feature-requests" element={<FeatureRequests />} />
    <Route path="/contact-support" element={<ContactSupport />} />
  </>
);
