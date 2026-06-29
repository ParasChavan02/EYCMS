const TRANSACTIONS_KEY = "eycms_transactions";

const defaultTransactions = [
  {
    id: "TXN-001",
    amount: 15000,
    budgetHead: "Marketing",
    description: "Digital ads campaign",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved for campaign execution",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-12T10:00:00.000Z",
    updatedAt: "2026-06-12T14:00:00.000Z",
    uploadedBills: ["facebook_ads_invoice_June.pdf", "ads_design_receipt.png"],
    auditTrail: [
      { timestamp: "2026-06-12T10:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Submitted digital ads request" },
      { timestamp: "2026-06-12T14:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved for campaign execution" }
    ]
  },
  {
    id: "TXN-002",
    amount: 25000,
    budgetHead: "Food & Refreshments",
    description: "Lunch catering for workshop",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved as per catering standard rates",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-11T11:00:00.000Z",
    updatedAt: "2026-06-11T15:30:00.000Z",
    uploadedBills: ["catering_quote_workshop.pdf"],
    auditTrail: [
      { timestamp: "2026-06-11T11:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Submitted catering budget" },
      { timestamp: "2026-06-11T15:30:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved as per catering standard rates" }
    ]
  },
  {
    id: "TXN-003",
    amount: 50000,
    budgetHead: "Venue",
    description: "Auditorium booking deposit",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Required booking deposit approved",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
    uploadedBills: ["auditorium_booking_deposit.pdf"],
    auditTrail: [
      { timestamp: "2026-06-10T09:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Submitted booking deposit request" },
      { timestamp: "2026-06-10T12:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Required booking deposit approved" }
    ]
  },
  {
    id: "TXN-004",
    amount: 20000,
    budgetHead: "Travel",
    description: "Flight tickets for guest speaker",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved guest speaker travel",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-08T14:30:00.000Z",
    updatedAt: "2026-06-08T17:00:00.000Z",
    uploadedBills: ["indigo_flight_guest_speaker.pdf"],
    auditTrail: [
      { timestamp: "2026-06-08T14:30:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Submitted travel request" },
      { timestamp: "2026-06-08T17:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved guest speaker travel" }
    ]
  },
  {
    id: "TXN-005",
    amount: 8000,
    budgetHead: "Food & Refreshments",
    description: "Coffee and snacks for panel",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved standard panel snacks budget",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-07T10:00:00.000Z",
    updatedAt: "2026-06-07T13:00:00.000Z",
    uploadedBills: ["starbucks_snacks_receipt.pdf"],
    auditTrail: [
      { timestamp: "2026-06-07T10:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Submitted refreshment request" },
      { timestamp: "2026-06-07T13:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved standard panel snacks budget" }
    ]
  },
  {
    id: "TXN-006",
    amount: 5000,
    budgetHead: "Miscellaneous",
    description: "Stationery and printing",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved workshop prints",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-06T11:15:00.000Z",
    updatedAt: "2026-06-06T14:00:00.000Z",
    uploadedBills: ["print_hub_stationery_invoice.pdf"],
    auditTrail: [
      { timestamp: "2026-06-06T11:15:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Submitted printing cost request" },
      { timestamp: "2026-06-06T14:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved workshop prints" }
    ]
  },
  {
    id: "TXN-007",
    amount: 40000,
    budgetHead: "Venue",
    description: "Audio-visual equipment rental",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved speaker system setup",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-05T12:00:00.000Z",
    updatedAt: "2026-06-05T15:00:00.000Z",
    uploadedBills: ["av_rental_invoice.pdf"],
    auditTrail: [
      { timestamp: "2026-06-05T12:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Submitted AV rental request" },
      { timestamp: "2026-06-05T15:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved speaker system setup" }
    ]
  },
  {
    id: "TXN-008",
    amount: 10000,
    budgetHead: "Marketing",
    description: "Brochure printing",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved event marketing brochures",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-04T09:30:00.000Z",
    updatedAt: "2026-06-04T12:00:00.000Z",
    uploadedBills: ["digital_print_house_receipt.pdf"],
    auditTrail: [
      { timestamp: "2026-06-04T09:30:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Submitted brochure prints request" },
      { timestamp: "2026-06-04T12:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved event marketing brochures" }
    ]
  },
  {
    id: "TXN-009",
    amount: 5000,
    budgetHead: "Travel",
    description: "Local taxi reimbursements",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "SUBMITTED",
    createdAt: "2026-06-03T15:00:00.000Z",
    updatedAt: "2026-06-03T15:00:00.000Z",
    uploadedBills: ["ola_taxi_bills_consolidated.pdf"],
    auditTrail: [
      { timestamp: "2026-06-03T15:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Request local speaker taxi travel reimbursement" }
    ]
  },
  {
    id: "TXN-010",
    amount: 10000,
    budgetHead: "Food & Refreshments",
    description: "Dinner for organizing committee",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "SUBMITTED",
    createdAt: "2026-06-02T18:00:00.000Z",
    updatedAt: "2026-06-03T10:00:00.000Z",
    uploadedBills: ["committee_dinner_receipt.pdf"],
    auditTrail: [
      { timestamp: "2026-06-02T18:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Request reimbursement for committee organizing dinner" }
    ]
  },
  {
    id: "TXN-011",
    amount: 10000,
    budgetHead: "Marketing",
    description: "Social media promotions",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved budget for Facebook/LinkedIn reach campaign",
    approvedBy: "admin@example.com",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T14:30:00.000Z",
    uploadedBills: ["ad_campaign_facebook_invoice.pdf"],
    auditTrail: [
      { timestamp: "2026-06-01T10:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Promotions budget request" },
      { timestamp: "2026-06-01T14:30:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved budget for Facebook/LinkedIn reach campaign" }
    ]
  },
  {
    id: "TXN-012",
    amount: 20000,
    budgetHead: "Venue",
    description: "Stage setup charges",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved stage fabrication request",
    approvedBy: "admin@example.com",
    createdAt: "2026-05-30T14:00:00.000Z",
    updatedAt: "2026-05-30T17:30:00.000Z",
    uploadedBills: ["stage_fabricators_invoice.pdf"],
    auditTrail: [
      { timestamp: "2026-05-30T14:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Stage setup budget request" },
      { timestamp: "2026-05-30T17:30:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved stage fabrication request" }
    ]
  },
  {
    id: "TXN-013",
    amount: 10000,
    budgetHead: "Miscellaneous",
    description: "Clean up crew fees",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved clean up budget",
    approvedBy: "admin@example.com",
    createdAt: "2026-05-29T11:00:00.000Z",
    updatedAt: "2026-05-29T14:00:00.000Z",
    uploadedBills: ["clean_up_crew_wages.pdf"],
    auditTrail: [
      { timestamp: "2026-05-29T11:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Clean up crew budget" },
      { timestamp: "2026-05-29T14:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved clean up budget" }
    ]
  },
  {
    id: "TXN-014",
    amount: 10000,
    budgetHead: "Miscellaneous",
    description: "Emergency medical kit",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "REJECTED",
    adminRemarks: "Not pre-approved expense category",
    createdAt: "2026-05-28T09:00:00.000Z",
    updatedAt: "2026-05-28T16:00:00.000Z",
    uploadedBills: ["medical_bills_first_aid.pdf"],
    auditTrail: [
      { timestamp: "2026-05-28T09:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Medical kit first aid supplies request" },
      { timestamp: "2026-05-28T16:00:00.000Z", action: "Rejected", user: "admin@example.com", role: "ADMIN", remarks: "Not pre-approved expense category" }
    ]
  },
  {
    id: "TXN-015",
    amount: 2000,
    budgetHead: "Travel",
    description: "Hotel stay for speakers",
    createdBy: "user@example.com",
    creatorRole: "USER",
    transactionType: "USER_REQUEST",
    status: "ADMIN_APPROVED",
    adminRemarks: "Approved lodging expense",
    approvedBy: "admin@example.com",
    createdAt: "2026-05-27T10:00:00.000Z",
    updatedAt: "2026-05-27T14:00:00.000Z",
    uploadedBills: ["guest_house_booking_invoice.pdf"],
    auditTrail: [
      { timestamp: "2026-05-27T10:00:00.000Z", action: "Created", user: "user@example.com", role: "USER", remarks: "Speaker hotel accommodation request" },
      { timestamp: "2026-05-27T14:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved lodging expense" }
    ]
  },
  {
    id: "TXN-016",
    amount: 75000,
    budgetHead: "Equipment",
    description: "Laptop Purchase",
    createdBy: "admin@example.com",
    creatorRole: "ADMIN",
    transactionType: "ADMIN_CREATED",
    status: "DRAFT",
    createdAt: "2026-05-29T10:00:00.000Z",
    updatedAt: "2026-05-29T10:00:00.000Z",
    uploadedBills: ["dell_store_invoice_quote.pdf"],
    auditTrail: [
      { timestamp: "2026-05-29T10:00:00.000Z", action: "Created", user: "admin@example.com", role: "ADMIN", remarks: "Laptop draft transaction created by admin" }
    ]
  }
];

function initTransactions() {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  if (!stored) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(defaultTransactions));
    return defaultTransactions;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(defaultTransactions));
    return defaultTransactions;
  }
}

export const transactionService = {
  getTransactions() {
    return initTransactions();
  },

  getTransactionById(id) {
    const list = this.getTransactions();
    return list.find(t => t.id === id) || null;
  },

  createTransaction(data, creatorName = "Admin", creatorRole = "ADMIN") {
    const list = this.getTransactions();
    const prefix = "TXN";
    // Find next ID
    const nextNum = list.reduce((max, t) => {
      const parts = t.id.split("-");
      const num = parts.length > 1 ? parseInt(parts[1]) : parseInt(t.id.replace(prefix, ""));
      return !isNaN(num) && num > max ? num : max;
    }, 0) + 1;

    const newId = `${prefix}-${String(nextNum).padStart(3, "0")}`;
    const nowStr = new Date().toISOString();

    const newTxn = {
      id: newId,
      amount: Number(data.amount),
      budgetHead: data.budgetHead,
      description: data.description,
      createdBy: creatorName,
      creatorRole: creatorRole,
      transactionType: creatorRole === "ADMIN" ? "ADMIN_CREATED" : "USER_REQUEST",
      status: "DRAFT",
      createdAt: nowStr,
      updatedAt: nowStr,
      uploadedBills: data.uploadedBills || ["simulated_receipt.pdf"],
      auditTrail: [
        {
          timestamp: nowStr,
          action: "Created",
          user: creatorName,
          role: creatorRole,
          remarks: data.description || "Created transaction"
        }
      ]
    };

    list.push(newTxn);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
    return newTxn;
  },

  updateTransaction(id, updates) {
    const list = this.getTransactions();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const updated = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    list[idx] = updated;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
    return updated;
  },

  verifyTransaction(id, verifier, remarks) {
    const nowStr = new Date().toISOString();
    const txn = this.getTransactionById(id);
    if (!txn) return null;

    const auditTrail = [
      ...(txn.auditTrail || []),
      { timestamp: nowStr, action: "Verified", user: verifier, role: "ACCOUNTS", remarks }
    ];

    return this.updateTransaction(id, {
      status: "FINANCE_VERIFIED",
      verifiedBy: verifier,
      verifiedAt: nowStr,
      financeRemarks: remarks,
      auditTrail
    });
  },

  approveTransaction(id, approver, remarks) {
    const nowStr = new Date().toISOString();
    const txn = this.getTransactionById(id);
    if (!txn) return null;

    const auditTrail = [
      ...(txn.auditTrail || []),
      { timestamp: nowStr, action: "Approved", user: approver, role: "ADMIN", remarks }
    ];

    return this.updateTransaction(id, {
      status: "ADMIN_APPROVED",
      approvedBy: approver,
      adminRemarks: remarks,
      auditTrail
    });
  },

  rejectTransaction(id, rejector, remarks) {
    const nowStr = new Date().toISOString();
    const txn = this.getTransactionById(id);
    if (!txn) return null;

    const auditTrail = [
      ...(txn.auditTrail || []),
      { timestamp: nowStr, action: "Rejected", user: rejector, role: "ADMIN", remarks }
    ];

    return this.updateTransaction(id, {
      status: "REJECTED",
      adminRemarks: remarks,
      auditTrail
    });
  },

  requestRevision(id, requester, remarks, requesterRole = "ADMIN") {
    const nowStr = new Date().toISOString();
    const txn = this.getTransactionById(id);
    if (!txn) return null;

    const auditTrail = [
      ...(txn.auditTrail || []),
      { timestamp: nowStr, action: "Revision Requested", user: requester, role: requesterRole, remarks }
    ];

    return this.updateTransaction(id, {
      status: "REVISION_REQUESTED",
      financeRemarks: requesterRole === "ACCOUNTS" ? remarks : txn.financeRemarks,
      adminRemarks: requesterRole === "ADMIN" ? remarks : txn.adminRemarks,
      auditTrail
    });
  }
};
