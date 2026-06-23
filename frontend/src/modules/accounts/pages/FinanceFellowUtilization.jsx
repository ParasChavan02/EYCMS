import React from "react";
import "../styles/finance.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function FinanceFellowUtilization() {
  const project = {
    projectRefNo: "EYUVA-2026-001",
    projectTitle: "Smart Bio Filter System",
    fellowName: "Rahul Sharma",
    mentorName: "Dr. Amit Patel",
    sanctionOrder: "BIRAC/EYUVA/2026/101",
    startDate: "01-Apr-2026",
    endDate: "2027-03-31",
    bankAccount: "XXXX2345",
    status: "Active",
  };

  const today = new Date();
const endDateObj = new Date(project.endDate);

const daysLeft = Math.ceil(
  (endDateObj - today) / (1000 * 60 * 60 * 24)
);

const formattedEndDate = endDateObj.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

  const ucSummary = {
    openingBalance: 50000,
    grantReceived: 750000,
    interestEarned: 1200,
    actualExpenditure: 420000,
    refundedAmount: 0,
  };

  const totalAvailable =
    ucSummary.openingBalance +
    ucSummary.grantReceived +
    ucSummary.interestEarned;

  const carriedForward =
    totalAvailable -
    ucSummary.actualExpenditure -
    ucSummary.refundedAmount;

  const utilizationPercentage = Math.round(
    (ucSummary.actualExpenditure / totalAvailable) * 100
  );

  const soeRows = [
    {
      item: "Isolation & Microbial Material",
      opening: 10000,
      contribution: 250000,
      expenditure: 180000,
      remarks: "Ongoing",
    },
    {
      item: "Raw Material For Filter",
      opening: 5000,
      contribution: 150000,
      expenditure: 95000,
      remarks: "Procured",
    },
    {
      item: "Outsourcing",
      opening: 0,
      contribution: 100000,
      expenditure: 70000,
      remarks: "In Progress",
    },
    {
      item: "Contingency",
      opening: 0,
      contribution: 50000,
      expenditure: 25000,
      remarks: "Available",
    },
  ];

  const committedExpenses = [
    {
      head: "Isolation Material",
      tentative: 50000,
      actual: 42000,
      date: "Jul 2026",
    },
    {
      head: "Raw Material",
      tentative: 35000,
      actual: 28000,
      date: "Aug 2026",
    },
    {
      head: "Outsourcing",
      tentative: 25000,
      actual: 20000,
      date: "Sep 2026",
    },
    {
      head: "Contingency",
      tentative: 15000,
      actual: 8000,
      date: "Oct 2026",
    },
  ];

  const transactions = [
    {
      date: "12-Jun-2026",
      voucher: "VCH-101",
      head: "Isolation Material",
      description: "Purchase of microbial material",
      amount: 75000,
      status: "Approved",
    },
    {
      date: "18-Jun-2026",
      voucher: "VCH-102",
      head: "Raw Material",
      description: "Filter raw materials",
      amount: 35000,
      status: "Approved",
    },
    {
      date: "22-Jun-2026",
      voucher: "VCH-103",
      head: "Outsourcing",
      description: "External testing services",
      amount: 25000,
      status: "Pending",
    },
  ];
  
  const downloadUCPdf = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Annexure 1", 90, 15);

  doc.setFontSize(14);
  doc.text("Utilization Certificate for BIRAC Contribution", 35, 25);
  doc.text("(For the period from 01/04/2026 till 31/03/2027)", 45, 32);

  const ucData = [
    ["1. Project Reference No.", project.projectRefNo],
    ["2. Title of the Project", project.projectTitle],
    ["3. Fellow Name", project.fellowName],
    ["4. Mentor Name", project.mentorName],
    ["5. Sanction Order", project.sanctionOrder],
    ["6. Start Date", project.startDate],
    ["7. End Date", project.endDate],
    ["8. Opening Balance", `₹ ${ucSummary.openingBalance.toLocaleString("en-IN")}`],
    ["9. Grant Received", `₹ ${ucSummary.grantReceived.toLocaleString("en-IN")}`],
    ["10. Interest Earned", `₹ ${ucSummary.interestEarned.toLocaleString("en-IN")}`],
    ["11. Total Available", `₹ ${totalAvailable.toLocaleString("en-IN")}`],
    ["12. Actual Expenditure", `₹ ${ucSummary.actualExpenditure.toLocaleString("en-IN")}`],
    ["13. Refunded Amount", `₹ ${ucSummary.refundedAmount.toLocaleString("en-IN")}`],
    ["14. Balance Available", `₹ ${carriedForward.toLocaleString("en-IN")}`],
  ];

  autoTable(doc, {
    startY: 40,
    head: [["Particulars", "Details"]],
    body: ucData,
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 180;

doc.text(
  "Certified that the above amount has been utilized for the purpose for which it was sanctioned.",
  14,
  finalY + 15
);

doc.text("Finance Officer", 20, finalY + 40);
doc.text("Project Coordinator", 80, finalY + 40);
doc.text("Registrar", 150, finalY + 40);

  doc.save("Utilization_Certificate.pdf");
};

const downloadSOEPdf = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Form - 3", 95, 15);

  doc.setFontSize(14);
  doc.text("Statement of Expenditure for EYUVA Grant", 45, 25);
  doc.text("(FY 2026)", 90, 32);

  const rows = soeRows.map((row) => {
    const available = row.opening + row.contribution;
    const balance = available - row.expenditure;

    return [
      row.item,
      row.opening,
      row.contribution,
      available,
      row.expenditure,
      balance,
      row.remarks,
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [
      [
        "Item",
        "Opening",
        "Contribution",
        "Available",
        "Expenditure",
        "Balance",
        "Remarks",
      ],
    ],
    body: rows,
  });

  doc.save("Statement_Of_Expenditure.pdf");
};


  return (
    <div className="fin-page">
      {/* Header */}
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Fellow Utilization Management</h1>
            <p className="subtitle">
              EYUVA / BIRAC Utilization Certificate & Statement of Expenditure
            </p>
          </div>
          <button className="fin-btn fin-btn-primary">
            Preview Utilization Certificate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="fin-card fin-section">
        <div className="fin-card-body">
          <div className="fin-search-row">
            <select className="fin-select">
              <option>Rahul Sharma</option>
              <option>Priya Patel</option>
              <option>Ankit Verma</option>
            </select>

            <select className="fin-select">
              <option>FY 2026</option>
              <option>FY 2025</option>
            </select>

            <span className="fin-badge badge-success">UC Ready</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fin-kpi-grid">
        {[
          {
            label: "Total Grant Received",
            value: ucSummary.grantReceived,
            icon: "🏛️",
          },
          {
            label: "Interest Earned",
            value: ucSummary.interestEarned,
            icon: "💹",
          },
          {
            label: "Total Expenditure",
            value: ucSummary.actualExpenditure,
            icon: "📊",
          },
          {
            label: "Balance Available",
            value: carriedForward,
            icon: "🏦",
          },
        ].map((k, i) => (
          <div key={i} className="fin-kpi-card">
            <div className="fin-kpi-icon">{k.icon}</div>
            <div className="fin-kpi-label">{k.label}</div>
            <div className="fin-kpi-value">
              ₹{k.value.toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>

      {/* Top Insights */}
      <div className="fin-two-col">
        {/* Project Information */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Project Information</div>
              <div className="fin-card-subtitle">
                Fellow & project details
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            {[
              ["Project Ref No", project.projectRefNo],
              ["Project Title", project.projectTitle],
              ["Fellow Name", project.fellowName],
              ["Mentor Name", project.mentorName],
            ].map(([label, value]) => (
              <div key={label} className="fin-stat-row">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Grant Details */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Grant Details</div>
              <div className="fin-card-subtitle">
                Financial sanction information
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-stat-row">
              <span>Sanction Order</span>
              <strong>{project.sanctionOrder}</strong>
            </div>
            <div className="fin-stat-row">
              <span>Start Date</span>
              <strong>{project.startDate}</strong>
            </div>
            <div className="fin-stat-row">
  <span>End Date</span>
  <strong>{formattedEndDate}</strong>
</div>

<div className="fin-stat-row">
  <span>Days Left</span>
  <strong
    style={{
      color:
        daysLeft < 30
          ? "#dc2626"
          : daysLeft < 90
          ? "#d97706"
          : "#16a34a",
    }}
  >
    {daysLeft > 0 ? `${daysLeft} Days` : "Completed"}
  </strong>
</div>
            <div className="fin-stat-row">
              <span>Bank Account</span>
              <strong>{project.bankAccount}</strong>
            </div>
            <div className="fin-stat-row">
              <span>Status</span>
              <span className="fin-badge badge-success">
                {project.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Utilization Progress + Compliance */}
      <div className="fin-two-col">
        <div className="fin-card">
          <div className="fin-card-header">
            <div className="fin-card-title">Utilization Progress</div>
          </div>

          <div className="fin-card-body">
            <div className="fin-progress-meta">
              <span>Grant Utilized</span>
              <span>{utilizationPercentage}%</span>
            </div>

            <div className="fin-progress-track">
              <div
                className={`fin-progress-fill ${
                  utilizationPercentage > 80
                    ? "danger"
                    : utilizationPercentage > 60
                    ? "warning"
                    : "success"
                }`}
                style={{ width: `${utilizationPercentage}%` }}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <div className="fin-stat-row">
                <span>Total Available</span>
                <strong>₹{totalAvailable.toLocaleString("en-IN")}</strong>
              </div>
              <div className="fin-stat-row">
                <span>Spent</span>
                <strong>₹{ucSummary.actualExpenditure.toLocaleString("en-IN")}</strong>
              </div>
              <div className="fin-stat-row">
                <span>Remaining</span>
                <strong>₹{carriedForward.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="fin-card">
          <div className="fin-card-header">
            <div className="fin-card-title">UC Compliance Status</div>
          </div>

          <div className="fin-card-body">
            <div className="fin-insight-row">
              <span>✓ SOE Prepared</span>
            </div>
            <div className="fin-insight-row">
              <span>✓ Bills Uploaded</span>
            </div>
            <div className="fin-insight-row">
              <span>✓ Transactions Verified</span>
            </div>
            <div className="fin-insight-row">
              <span style={{ color: "#d97706" }}>
                ⚠ UC Pending Approval
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* UC Summary */}
      <div className="fin-card fin-section">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">
              Utilization Certificate Summary
            </div>
            <div className="fin-card-subtitle">
              Fund movement summary
            </div>
          </div>
        </div>

        <div className="fin-card-body">
          {[
            ["Opening Balance", ucSummary.openingBalance],
            ["Grant Received", ucSummary.grantReceived],
            ["Interest Earned", ucSummary.interestEarned],
            ["Total Available", totalAvailable],
            ["Actual Expenditure", ucSummary.actualExpenditure],
            ["Balance Carried Forward", carriedForward],
          ].map(([label, value]) => (
            <div key={label} className="fin-stat-row">
              <span>{label}</span>
              <strong>₹{value.toLocaleString("en-IN")}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* SOE Table */}
      <div className="fin-card fin-section uc-table-section">
        <div className="fin-card-header">
          <div className="fin-card-title">
            Statement of Expenditure 
          </div>
        </div>

        <div className="fin-card-body">
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Opening</th>
                  <th>Contribution</th>
                  <th>Available</th>
                  <th>Expenditure</th>
                  <th>Balance</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {soeRows.map((row, index) => {
                  const available = row.opening + row.contribution;
                  const balance = available - row.expenditure;

                  return (
                    <tr key={index}>
                      <td className="bold">{row.item}</td>
                      <td>₹{row.opening.toLocaleString("en-IN")}</td>
                      <td>₹{row.contribution.toLocaleString("en-IN")}</td>
                      <td>₹{available.toLocaleString("en-IN")}</td>
                      <td>₹{row.expenditure.toLocaleString("en-IN")}</td>
                      <td>₹{balance.toLocaleString("en-IN")}</td>
                      <td>{row.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Committed Expenditure */}
      <div className="fin-card fin-section uc-table-section">
        <div className="fin-card-header">
          <div className="fin-card-title">
            Committed Expenditure
          </div>
        </div>

        <div className="fin-card-body">
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Head</th>
                  <th>Tentative Amount</th>
                  <th>Actual Expense</th>
                  <th>Expected Date</th>
                </tr>
              </thead>
              <tbody>
                {committedExpenses.map((row, index) => (
                  <tr key={index}>
                    <td>{row.head}</td>
                    <td>₹{row.tentative.toLocaleString("en-IN")}</td>
                    <td>₹{row.actual.toLocaleString("en-IN")}</td>
                    <td>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Linked Transactions */}
      <div className="fin-card fin-section uc-table-section">
        <div className="fin-card-header">
          <div className="fin-card-title">Linked Transaction Records</div>
        </div>

        <div className="fin-card-body">
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher</th>
                  <th>Head</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={index}>
                    <td>{tx.date}</td>
                    <td>{tx.voucher}</td>
                    <td>{tx.head}</td>
                    <td>{tx.description}</td>
                    <td>₹{tx.amount.toLocaleString("en-IN")}</td>
                    <td>
                      <span
                        className={`fin-badge ${
                          tx.status === "Approved"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="fin-card fin-section uc-table-section">
        <div className="fin-card-header">
          <div className="fin-card-title">Compliance Timeline</div>
        </div>

        <div className="fin-card-body">
          <div className="fin-timeline">
            {[
              "Grant Released",
              "Expenses Recorded",
              "SOE Prepared",
              "UC Ready For Submission",
            ].map((step, i) => (
              <div className="fin-timeline-item" key={i}>
                <div className="fin-timeline-dot" />
                <div className="fin-timeline-title">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
  className="fin-btn fin-btn-primary"
  onClick={downloadUCPdf}
>
  Download Utilization Certificate
</button>

<button
  className="fin-btn fin-btn-ghost"
  onClick={downloadSOEPdf}
>
  Download Statement Of Expenditure
</button>
      </div>
    </div>
  );
}