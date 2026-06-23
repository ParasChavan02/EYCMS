const UC_REQUESTS_KEY = "eycms_uc_requests";
const USER_UC_STATUS_KEY = "uc_status";
const USER_UC_FILE_KEY = "uc_submitted_file";
const USER_UC_DATE_KEY = "uc_submitted_date";

const defaultUCRequests = [
  {
    id: "UC-001",
    requestedBy: "Rahul S. (rahul@example.com)",
    status: "ADMIN_APPROVED",
    templateGranted: {
      templateFile: "UC_Template_Phase1.docx",
      instructions: "Please fill section A and sign the document before uploading.",
      grantedAt: "2026-06-05T10:00:00.000Z"
    },
    uploadedUcFile: "Utilization_Certificate_Signed.pdf",
    uploadedBills: ["food_invoice_workshop.pdf", "taxi_receipt.pdf"],
    financeRemarks: "All bills match expenditure values",
    adminRemarks: "Approved, ready for disbursement release",
    verifiedBy: "finance@example.com",
    approvedBy: "admin@example.com",
    submittedAt: "2026-06-06T15:00:00.000Z",
    updatedAt: "2026-06-08T11:00:00.000Z",
    auditTrail: [
      { timestamp: "2026-06-04T09:00:00.000Z", action: "Created", user: "rahul@example.com", role: "USER", remarks: "Requested UC template" },
      { timestamp: "2026-06-05T10:00:00.000Z", action: "Submitted", user: "admin@example.com", role: "ADMIN", remarks: "Template granted" },
      { timestamp: "2026-06-06T15:00:00.000Z", action: "Submitted", user: "rahul@example.com", role: "USER", remarks: "Uploaded filled UC document" },
      { timestamp: "2026-06-07T11:00:00.000Z", action: "Verified", user: "finance@example.com", role: "ACCOUNTS", remarks: "All bills match expenditure values" },
      { timestamp: "2026-06-08T11:00:00.000Z", action: "Approved", user: "admin@example.com", role: "ADMIN", remarks: "Approved, ready for disbursement release" }
    ]
  },
  {
    id: "UC-002",
    requestedBy: "Priya S. (priya@example.com)",
    status: "TEMPLATE_GRANTED",
    templateGranted: {
      templateFile: "UC_Template_General.docx",
      instructions: "Provide receipts for AV equipment rentals and venue charges.",
      grantedAt: "2026-06-10T12:00:00.000Z"
    },
    updatedAt: "2026-06-10T12:00:00.000Z",
    auditTrail: [
      { timestamp: "2026-06-09T14:00:00.000Z", action: "Created", user: "priya@example.com", role: "USER", remarks: "Requested UC template" },
      { timestamp: "2026-06-10T12:00:00.000Z", action: "Submitted", user: "admin@example.com", role: "ADMIN", remarks: "Template granted with instructions" }
    ]
  }
];

function initUCRequests() {
  const stored = localStorage.getItem(UC_REQUESTS_KEY);
  let list = [];
  if (!stored) {
    list = defaultUCRequests;
    localStorage.setItem(UC_REQUESTS_KEY, JSON.stringify(list));
  } else {
    try {
      list = JSON.parse(stored);
    } catch (e) {
      list = defaultUCRequests;
      localStorage.setItem(UC_REQUESTS_KEY, JSON.stringify(list));
    }
  }

  // Interoperability with user actions in localStorage:
  const userUcStatus = localStorage.getItem(USER_UC_STATUS_KEY);
  const userUcFile = localStorage.getItem(USER_UC_FILE_KEY);
  const userUcDate = localStorage.getItem(USER_UC_DATE_KEY);

  let changes = false;

  // 1. If user set status to REQUESTED but we don't have it in our list
  if (userUcStatus === "REQUESTED") {
    const hasRequested = list.some(r => r.status === "REQUESTED");
    if (!hasRequested) {
      const newId = `UC-${String(list.length + 1).padStart(3, "0")}`;
      const nowStr = new Date().toISOString();
      list.push({
        id: newId,
        requestedBy: "Rahul S. (rahul@example.com)", // Default logged-in user in user scope
        status: "REQUESTED",
        updatedAt: nowStr,
        auditTrail: [
          { timestamp: nowStr, action: "Created", user: "rahul@example.com", role: "USER", remarks: "Requested UC from dashboard" }
        ]
      });
      changes = true;
    }
  }

  // 2. If user uploaded completed UC (status set to SUBMITTED by user page)
  if (userUcStatus === "SUBMITTED") {
    // Find the latest active request that was TEMPLATE_GRANTED
    const activeReqIdx = list.findIndex(r => r.status === "TEMPLATE_GRANTED" || r.status === "REVISION_REQUESTED");
    if (activeReqIdx !== -1) {
      const nowStr = new Date().toISOString();
      list[activeReqIdx] = {
        ...list[activeReqIdx],
        status: "UC_SUBMITTED",
        uploadedUcFile: userUcFile || "Utilization_Certificate.pdf",
        uploadedBills: ["bill_receipt_1.pdf", "bill_receipt_2.pdf"],
        submittedAt: userUcDate || nowStr,
        updatedAt: nowStr,
        auditTrail: [
          ...(list[activeReqIdx].auditTrail || []),
          {
            timestamp: nowStr,
            action: "Submitted",
            user: "rahul@example.com",
            role: "USER",
            remarks: `Submitted file: ${userUcFile || "Utilization_Certificate.pdf"}`
          }
        ]
      };
      changes = true;
    }
  }

  if (changes) {
    localStorage.setItem(UC_REQUESTS_KEY, JSON.stringify(list));
  }

  return list;
}

export const ucService = {
  getUCRequests() {
    return initUCRequests();
  },

  getUCRequestById(id) {
    const list = this.getUCRequests();
    return list.find(r => r.id === id) || null;
  },

  createUCRequest(userEmail = "user@example.com", userName = "User") {
    const list = this.getUCRequests();
    const newId = `UC-${String(list.length + 1).padStart(3, "0")}`;
    const nowStr = new Date().toISOString();

    const newReq = {
      id: newId,
      requestedBy: `${userName} (${userEmail})`,
      status: "REQUESTED",
      updatedAt: nowStr,
      auditTrail: [
        { timestamp: nowStr, action: "Created", user: userEmail, role: "USER", remarks: "Requested UC template" }
      ]
    };

    list.push(newReq);
    localStorage.setItem(UC_REQUESTS_KEY, JSON.stringify(list));
    localStorage.setItem(USER_UC_STATUS_KEY, "REQUESTED");
    return newReq;
  },

  grantTemplate(id, templateFile, instructions, adminEmail = "admin@example.com") {
    const nowStr = new Date().toISOString();
    const req = this.getUCRequestById(id);
    if (!req) return null;

    const auditTrail = [
      ...(req.auditTrail || []),
      { timestamp: nowStr, action: "Submitted", user: adminEmail, role: "ADMIN", remarks: `Template granted: ${templateFile}. Instructions: ${instructions}` }
    ];

    // Propagate to user localStorage so the user page unlocks and downloads
    localStorage.setItem(USER_UC_STATUS_KEY, "TEMPLATE_UPLOADED");

    return this.updateUCRequest(id, {
      status: "TEMPLATE_GRANTED",
      templateGranted: {
        templateFile,
        instructions,
        grantedAt: nowStr
      },
      auditTrail
    });
  },

  submitUC(id, fileName, bills = ["receipt1.pdf"], userEmail = "user@example.com") {
    const nowStr = new Date().toISOString();
    const req = this.getUCRequestById(id);
    if (!req) return null;

    const auditTrail = [
      ...(req.auditTrail || []),
      { timestamp: nowStr, action: "Submitted", user: userEmail, role: "USER", remarks: `Uploaded completed UC: ${fileName}` }
    ];

    // Propagate to user localStorage
    localStorage.setItem(USER_UC_STATUS_KEY, "SUBMITTED");
    localStorage.setItem(USER_UC_FILE_KEY, fileName);
    localStorage.setItem(USER_UC_DATE_KEY, new Date().toLocaleString());

    return this.updateUCRequest(id, {
      status: "UC_SUBMITTED",
      uploadedUcFile: fileName,
      uploadedBills: bills,
      submittedAt: nowStr,
      auditTrail
    });
  },

  verifyUC(id, verifier, remarks) {
    const nowStr = new Date().toISOString();
    const req = this.getUCRequestById(id);
    if (!req) return null;

    const auditTrail = [
      ...(req.auditTrail || []),
      { timestamp: nowStr, action: "Verified", user: verifier, role: "ACCOUNTS", remarks }
    ];

    return this.updateUCRequest(id, {
      status: "FINANCE_VERIFIED",
      verifiedBy: verifier,
      financeRemarks: remarks,
      auditTrail
    });
  },

  approveUC(id, approver, remarks) {
    const nowStr = new Date().toISOString();
    const req = this.getUCRequestById(id);
    if (!req) return null;

    const auditTrail = [
      ...(req.auditTrail || []),
      { timestamp: nowStr, action: "Approved", user: approver, role: "ADMIN", remarks }
    ];

    // Set user local uc_status to completed or keep it as submitted
    localStorage.setItem(USER_UC_STATUS_KEY, "SUBMITTED"); // keep compatible

    return this.updateUCRequest(id, {
      status: "ADMIN_APPROVED",
      approvedBy: approver,
      adminRemarks: remarks,
      auditTrail
    });
  },

  rejectUC(id, rejector, remarks) {
    const nowStr = new Date().toISOString();
    const req = this.getUCRequestById(id);
    if (!req) return null;

    const auditTrail = [
      ...(req.auditTrail || []),
      { timestamp: nowStr, action: "Rejected", user: rejector, role: "ADMIN", remarks }
    ];

    return this.updateUCRequest(id, {
      status: "REJECTED",
      adminRemarks: remarks,
      auditTrail
    });
  },

  requestUCRevision(id, requester, remarks, requesterRole = "ADMIN") {
    const nowStr = new Date().toISOString();
    const req = this.getUCRequestById(id);
    if (!req) return null;

    const auditTrail = [
      ...(req.auditTrail || []),
      { timestamp: nowStr, action: "Revision Requested", user: requester, role: requesterRole, remarks }
    ];

    // Set user local uc_status to template_uploaded so they can submit again
    localStorage.setItem(USER_UC_STATUS_KEY, "TEMPLATE_UPLOADED");

    return this.updateUCRequest(id, {
      status: "REVISION_REQUESTED",
      financeRemarks: requesterRole === "ACCOUNTS" ? remarks : req.financeRemarks,
      adminRemarks: requesterRole === "ADMIN" ? remarks : req.adminRemarks,
      auditTrail
    });
  },

  updateUCRequest(id, updates) {
    const list = this.getUCRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const updated = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    list[idx] = updated;
    localStorage.setItem(UC_REQUESTS_KEY, JSON.stringify(list));
    return updated;
  }
};
