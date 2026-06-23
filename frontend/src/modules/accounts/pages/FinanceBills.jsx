import { useState } from "react";
import "../styles/finance.css";

const allBills = [
  { id: "BILL-001", vendor: "TechCorp Pvt Ltd", date: "08 Jun 2026", amount: "₹45,000", category: "IT", status: "Approved", description: "Annual software license renewal for ERP system." },
  { id: "BILL-002", vendor: "OfficePro Supplies", date: "07 Jun 2026", amount: "₹88,000", category: "Equipment", status: "Pending", description: "Office furniture and workstation equipment purchase." },
  { id: "BILL-003", vendor: "EventHouse Pvt Ltd", date: "06 Jun 2026", amount: "₹32,000", category: "Events", status: "Pending", description: "Annual leadership summit venue and catering." },
  { id: "BILL-004", vendor: "SkillUp Training", date: "05 Jun 2026", amount: "₹12,500", category: "Training", status: "Approved", description: "Employee upskilling program — Batch 4 sessions." },
  { id: "BILL-005", vendor: "Travel Agency India", date: "04 Jun 2026", amount: "₹28,000", category: "Travel", status: "Rejected", description: "Travel booking for Q2 client visit — duplicate submission." },
  { id: "BILL-006", vendor: "PowerGrid Ltd", date: "03 Jun 2026", amount: "₹15,600", category: "Operations", status: "Approved", description: "Monthly electricity bill for HQ building." },
  { id: "BILL-007", vendor: "CloudHost Inc", date: "02 Jun 2026", amount: "₹22,400", category: "IT", status: "Pending", description: "Cloud hosting and storage services for June 2026." },
  { id: "BILL-008", vendor: "Stationery World", date: "01 Jun 2026", amount: "₹6,800", category: "Operations", status: "Approved", description: "Monthly office stationery and printing supplies." },
  { id: "BILL-009", vendor: "MedAssist Corp", date: "31 May 2026", amount: "₹18,000", category: "Training", status: "Rejected", description: "Health & Safety training — insufficient documentation." },
  { id: "BILL-010", vendor: "AV Solutions", date: "30 May 2026", amount: "₹54,000", category: "Equipment", status: "Approved", description: "Projectors and AV equipment for conference rooms." },
];

const statusMap = {
  Approved: "badge-success",
  Pending: "badge-warning",
  Rejected: "badge-danger",
};

export default function FinanceBills() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBill, setSelectedBill] = useState(null);

  const filtered = allBills.filter((b) => {
    const matchSearch =
      b.vendor.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: allBills.length,
    approved: allBills.filter((b) => b.status === "Approved").length,
    pending: allBills.filter((b) => b.status === "Pending").length,
    rejected: allBills.filter((b) => b.status === "Rejected").length,
  };

  const kpis = [
    { label: "Total Bills", value: counts.total, icon: "🧾", accent: "#2563eb", iconBg: "#eff6ff" },
    { label: "Approved Bills", value: counts.approved, icon: "✅", accent: "#16a34a", iconBg: "#f0fdf4" },
    { label: "Pending Bills", value: counts.pending, icon: "⏳", accent: "#d97706", iconBg: "#fffbeb" },
    { label: "Rejected Bills", value: counts.rejected, icon: "❌", accent: "#dc2626", iconBg: "#fef2f2" },
  ];

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Bill Management</h1>
            <p className="subtitle">View and track all submitted bills and their approval status.</p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      <div className="fin-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="fin-kpi-card" style={{ "--accent": k.accent, "--icon-bg": k.iconBg }}>
            <div className="fin-kpi-icon">{k.icon}</div>
            <div className="fin-kpi-label">{k.label}</div>
            <div className="fin-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="fin-card">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">All Bills</div>
            <div className="fin-card-subtitle">{filtered.length} records found</div>
          </div>
        </div>
        <div className="fin-card-body">
          <div className="fin-search-row">
            <div className="fin-search">
              <span className="fin-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by vendor, bill ID or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="fin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Bill ID</th><th>Vendor</th><th>Bill Date</th>
                  <th>Amount</th><th>Category</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="fin-empty">No bills match your search criteria.</div></td></tr>
                ) : (
                  filtered.map((b, i) => (
                    <tr key={i}>
                      <td className="mono bold">{b.id}</td>
                      <td className="bold">{b.vendor}</td>
                      <td className="mono">{b.date}</td>
                      <td className="mono bold">{b.amount}</td>
                      <td><span className="fin-badge badge-info">{b.category}</span></td>
                      <td><span className={`fin-badge ${statusMap[b.status]}`}>{b.status}</span></td>
                      <td>
                        <button className="fin-btn fin-btn-ghost fin-btn-sm" onClick={() => setSelectedBill(b)}>
                          👁 View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBill && (
        <div className="fin-modal-overlay" onClick={() => setSelectedBill(null)}>
          <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fin-modal-header">
              <h3>Bill Details — {selectedBill.id}</h3>
              <button className="fin-modal-close" onClick={() => setSelectedBill(null)}>✕</button>
            </div>
            <div className="fin-modal-body">
              <div className="fin-modal-row"><span className="fin-modal-key">Vendor</span><span className="fin-modal-val">{selectedBill.vendor}</span></div>
              <div className="fin-modal-row"><span className="fin-modal-key">Bill Date</span><span className="fin-modal-val">{selectedBill.date}</span></div>
              <div className="fin-modal-row"><span className="fin-modal-key">Amount</span><span className="fin-modal-val">{selectedBill.amount}</span></div>
              <div className="fin-modal-row"><span className="fin-modal-key">Category</span><span className="fin-modal-val">{selectedBill.category}</span></div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Description</span>
                <span className="fin-modal-val" style={{ maxWidth: 260, textAlign: "right", lineHeight: 1.5 }}>{selectedBill.description}</span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Status</span>
                <span className={`fin-badge ${statusMap[selectedBill.status]}`}>{selectedBill.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}