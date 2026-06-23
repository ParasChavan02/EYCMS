import { transactionService } from "./transactionService";
import { ucService } from "./ucService";

const USER_PROGRESS_KEY = "eycms_user_progress";

const defaultUserProgress = [
  {
    projectID: "PROJ-2026-001",
    name: "Rahul S.",
    email: "rahul@example.com",
    dateOfJoining: "2025-07-01",
    fellowshipDuration: "12 Months",
    daysRemaining: 15,
    fellowshipMonth: 11,
    programProgress: 90,
    assignedEvents: 4,
    submittedReports: 8,
    uploadedDocuments: 15,
    pendingReviews: 1,
    status: "Active"
  },
  {
    projectID: "PROJ-2026-002",
    name: "Priya S.",
    email: "priya@example.com",
    dateOfJoining: "2025-08-01",
    fellowshipDuration: "12 Months",
    daysRemaining: 45,
    fellowshipMonth: 10,
    programProgress: 75,
    assignedEvents: 3,
    submittedReports: 6,
    uploadedDocuments: 10,
    pendingReviews: 2,
    status: "Pending Review"
  },
  {
    projectID: "PROJ-2026-003",
    name: "Amit Kumar",
    email: "amit@example.com",
    dateOfJoining: "2025-06-01",
    fellowshipDuration: "12 Months",
    daysRemaining: -5,
    fellowshipMonth: 12,
    programProgress: 100,
    assignedEvents: 6,
    submittedReports: 12,
    uploadedDocuments: 24,
    pendingReviews: 0,
    status: "Completed"
  },
  {
    projectID: "PROJ-2026-004",
    name: "Purva Kalkute",
    email: "purva@example.com",
    dateOfJoining: "2025-09-01",
    fellowshipDuration: "12 Months",
    daysRemaining: 75,
    fellowshipMonth: 9,
    programProgress: 50,
    assignedEvents: 2,
    submittedReports: 4,
    uploadedDocuments: 8,
    pendingReviews: 3,
    status: "Delayed"
  }
];

function initUserProgress() {
  const stored = localStorage.getItem(USER_PROGRESS_KEY);
  if (!stored) {
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(defaultUserProgress));
    return defaultUserProgress;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(defaultUserProgress));
    return defaultUserProgress;
  }
}

export const userService = {
  getUserProgress() {
    const list = initUserProgress();
    const txns = transactionService.getTransactions();
    const ucs = ucService.getUCRequests();

    // Dynamically augment with live transaction and UC aggregates
    return list.map(user => {
      // Find transactions by this user (check email or name matching)
      const userTxns = txns.filter(t => 
        t.createdBy.toLowerCase().includes(user.email.toLowerCase()) ||
        t.createdBy.toLowerCase().includes(user.name.toLowerCase())
      );

      const totalTxns = userTxns.length;
      const approvedTxns = userTxns.filter(t => t.status === "ADMIN_APPROVED").length;
      const rejectedTxns = userTxns.filter(t => t.status === "REJECTED").length;
      const pendingTxns = userTxns.filter(t => t.status === "SUBMITTED" || t.status === "FINANCE_VERIFIED" || t.status === "UNDER_REVIEW").length;

      // Find UC request
      const userUc = ucs.find(u => 
        u.requestedBy.toLowerCase().includes(user.email.toLowerCase()) ||
        u.requestedBy.toLowerCase().includes(user.name.toLowerCase())
      );

      const ucInfo = {
        requested: !!userUc,
        templateGranted: userUc ? (userUc.status !== "REQUESTED") : false,
        submitted: userUc ? (userUc.status === "UC_SUBMITTED" || userUc.status === "FINANCE_VERIFIED" || userUc.status === "ADMIN_APPROVED" || userUc.status === "REJECTED") : false,
        approved: userUc ? (userUc.status === "ADMIN_APPROVED") : false,
        rejected: userUc ? (userUc.status === "REJECTED") : false
      };

      return {
        ...user,
        financials: {
          total: totalTxns,
          approved: approvedTxns,
          rejected: rejectedTxns,
          pending: pendingTxns
        },
        uc: ucInfo
      };
    });
  }
};
