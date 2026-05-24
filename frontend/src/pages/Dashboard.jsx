import { useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import QuickActions from "../components/dashboard/QuickActions";
import RecentActivity from "../components/dashboard/RecentActivity";
import "./dashboard-enterprise.css";

function Dashboard() {
  const [steps, setSteps] = useState([
    { id: "stepUsers", label: "Users", status: "pending" },
    { id: "stepProjects", label: "Projects/Fellows", status: "pending" },
    { id: "stepHeads", label: "Budget Heads", status: "pending" },
    { id: "stepAccounts", label: "Accounts & Bank", status: "pending" },
  ]);

  const [summaryRows] = useState([
    { head: "Project Support", sanctioned: 120000, spent: 45000, remaining: 75000, percent: 38 },
    { head: "Travel", sanctioned: 40000, spent: 22000, remaining: 18000, percent: 55 },
    { head: "Equipment", sanctioned: 20000, spent: 12000, remaining: 8000, percent: 60 },
  ]);

  const refreshChecklist = () => {
    setSteps((current) => current.map((step) => ({ ...step, status: step.status === "pending" ? "done" : step.status })));
  };

  return (
    <main className="page dashboard-enterprise">
      {/* STATISTICS CARDS */}
      <section className="dashboard-section">
        <div className="container-fluid">
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-lg-3">
              <StatCard
                icon="💳"
                label="Total Transactions"
                value="2,847"
                change={{ trend: "up", value: "12%" }}
                color="primary"
              />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <StatCard
                icon="💰"
                label="Total Budget"
                value="$180K"
                change={{ trend: "down", value: "5%" }}
                color="success"
              />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <StatCard
                icon="👥"
                label="Active Users"
                value="24"
                change={{ trend: "up", value: "3%" }}
                color="warning"
              />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <StatCard
                icon="📊"
                label="Completed Reports"
                value="18"
                change={{ trend: "up", value: "8%" }}
                color="danger"
              />
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS & RECENT ACTIVITY */}
      <section className="dashboard-section">
        <div className="container-fluid">
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <QuickActions />
            </div>
            <div className="col-12 col-lg-6">
              <RecentActivity />
            </div>
          </div>
        </div>
      </section>

      {/* SETUP CHECKLIST */}
      <section className="dashboard-section">
        <div className="container-fluid">
          <div className="setup-card card-enterprise">
            <h3 className="card-title">Setup Checklist</h3>
            <p className="card-subtitle">Finish setup in 4 steps to complete configuration</p>
            
            <div className="checklist-container">
              {steps.map((step) => (
                <div key={step.id} className={`checklist-item ${step.status === "done" ? "completed" : "pending"}`}>
                  <div className="checklist-marker">
                    {step.status === "done" ? "✓" : "○"}
                  </div>
                  <span className="checklist-label">{step.label}</span>
                  <span className="checklist-status">{step.status}</span>
                </div>
              ))}
            </div>

            <div className="checklist-actions">
              <button type="button" className="btn btn-action" onClick={refreshChecklist}>
                🔄 Refresh Status
              </button>
              <button type="button" className="btn btn-action" onClick={() => window.location.assign("/users")}>
                👥 Manage Users
              </button>
              <button type="button" className="btn btn-action" onClick={() => window.location.assign("/master")}>
                ⚙️ Master Data
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINANCE SUMMARY */}
      <section className="dashboard-section">
        <div className="container-fluid">
          <div className="summary-card card-enterprise">
            <h3 className="card-title">Centre Finance Summary</h3>
            <div className="table-responsive">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Budget Head</th>
                    <th className="text-right">Sanctioned</th>
                    <th className="text-right">Spent</th>
                    <th className="text-right">Remaining</th>
                    <th className="text-right">Usage %</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row) => (
                    <tr key={row.head}>
                      <td className="fw-500">{row.head}</td>
                      <td className="text-right">${(row.sanctioned / 1000).toFixed(0)}K</td>
                      <td className="text-right">${(row.spent / 1000).toFixed(0)}K</td>
                      <td className="text-right">${(row.remaining / 1000).toFixed(0)}K</td>
                      <td className="text-right">
                        <div className="progress-bar-inline">
                          <div className="progress-fill" style={{ width: `${row.percent}%` }}></div>
                          <span className="progress-text">{row.percent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
