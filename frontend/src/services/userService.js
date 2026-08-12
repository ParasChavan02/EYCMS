import { transactionService } from "./transactionService";
import { ucService } from "./ucService";

const USER_PROGRESS_KEY = "eycms_user_progress";

const defaultUserProgress = [];

function initUserProgress() {
  const stored = localStorage.getItem(USER_PROGRESS_KEY);
  if (stored && stored.includes("PROJ-2026-001")) {
    localStorage.removeItem(USER_PROGRESS_KEY);
    return defaultUserProgress;
  }
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
      const approvedTxns = userTxns.filter(t => t.status === "ADMIN_APPROVED" || t.status === "APPROVED").length;
      const rejectedTxns = userTxns.filter(t => t.status === "REJECTED").length;
      const pendingTxns = userTxns.filter(t => t.status === "SUBMITTED" || t.status === "UNDER_REVIEW").length;

      // Find UC request
      const userUc = ucs.find(u => 
        u.requestedBy.toLowerCase().includes(user.email.toLowerCase()) ||
        u.requestedBy.toLowerCase().includes(user.name.toLowerCase())
      );

      const ucInfo = {
        requested: !!userUc,
        templateGranted: userUc ? (userUc.status !== "REQUESTED") : false,
        submitted: userUc ? (userUc.status === "UC_SUBMITTED" || userUc.status === "ADMIN_APPROVED" || userUc.status === "REJECTED") : false,
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
