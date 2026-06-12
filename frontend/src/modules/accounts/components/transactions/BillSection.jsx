import { useState } from "react";

const defaultBills = [
  { id: "BILL-T001", vendor: "TechCorp Pvt Ltd", date: "08 Jun 2026", amount: 45000, category: "IT", status: "Approved", description: "Annual ERP license renewal." },
  { id: "BILL-T002", vendor: "OfficePro Supplies", date: "07 Jun 2026", amount: 12000, category: "Equipment", status: "Pending", description: "Stationery and supplies order." },
  { id: "BILL-T003", vendor: "CloudHost Inc", date: "06 Jun 2026", amount: 8000, category: "IT", status: "Pending", description: "Monthly cloud hosting invoice." },
  { id: "BILL-T004", vendor: "PowerGrid Ltd", date: "05 Jun 2026", amount: 5600, category: "Utilities", status: "Approved", description: "Electricity bill for HQ." },
];

const statusMap = {
  Approved: "badge-success",
  Pending: "badge-warning",
  Rejected: "badge-danger",
};

export default function BillSection({ viewOnly }) {
  const [bills] = useState(defaultBills);
  const [selected, setSelected] = useState(null);

  return (
    <div className="fin-card fin-section">
      <div className="fin-card-header">
        <div>
          <div className="fin-card-title">Associated Bills</div>
          <div className="fin-card-subtitle">Bills linked to these transactions</div>
        </div>
        <span className="fin-badge badge-primary">{bills.length} Bills</span>
      </div>
      <div className="fin-card-body">
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b, i) => (
                <tr key={i}>
                  <td className="mono bold">{b.id}</td>
                  <td className="bold">{b.vendor}</td>
                  <td className="mono">{b.date}</td>
                  <td className="mono bold">₹{b.amount.toLocaleString("en-IN")}</td>
                  <td><span className="fin-badge badge-info">{b.category}</span></td>
                  <td><span className={`fin-badge ${statusMap[b.status]}`}>{b.status}</span></td>
                  <td>
                    <button
                      className="fin-btn fin-btn-ghost fin-btn-sm"
                      onClick={() => setSelected(b)}
                    >
                      👁 View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Detail Modal */}
      {selected && (
        <div className="fin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fin-modal-header">
              <h3>Bill Details — {selected.id}</h3>
              <button className="fin-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="fin-modal-body">
              <div className="fin-modal-row">
                <span className="fin-modal-key">Vendor</span>
                <span className="fin-modal-val">{selected.vendor}</span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Bill Date</span>
                <span className="fin-modal-val">{selected.date}</span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Amount</span>
                <span className="fin-modal-val">₹{selected.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Category</span>
                <span className="fin-modal-val">{selected.category}</span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Description</span>
                <span className="fin-modal-val" style={{ maxWidth: 260, textAlign: "right", lineHeight: 1.5 }}>
                  {selected.description}
                </span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Status</span>
                <span className={`fin-badge ${statusMap[selected.status]}`}>{selected.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}