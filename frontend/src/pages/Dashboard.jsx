import { useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import QuickActions from "../components/dashboard/QuickActions";
import RecentActivity from "../components/dashboard/RecentActivity";
import AlertsWidget from "../components/dashboard/AlertsWidget";
import FinanceCard from "../components/dashboard/FinanceCard";
import "./dashboard-enterprise.css";

function Dashboard() {
  const [summaryRows] = useState([
    { head: "Project Support", sanctioned: 120000, spent: 45000, remaining: 75000, percent: 38 },
    { head: "Travel", sanctioned: 40000, spent: 22000, remaining: 18000, percent: 55 },
    { head: "Equipment", sanctioned: 20000, spent: 12000, remaining: 8000, percent: 60 },
  ]);

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

      {/* OPERATIONAL ALERTS */}
      <section className="dashboard-section">
        <div className="container-fluid">
          <AlertsWidget />
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

      {/* FINANCE SUMMARY */}
      <section className="dashboard-section">
        <div className="container-fluid">
          <div className="summary-card card-enterprise">
            <h3 className="card-title">Centre Finance Summary</h3>

            {/* DESKTOP TABLE VIEW */}
            <div className="table-view">
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

            {/* MOBILE CARD VIEW */}
            <div className="cards-view">
              <div className="finance-cards-grid">
                {summaryRows.map((row) => (
                  <FinanceCard
                    key={row.head}
                    head={row.head}
                    sanctioned={row.sanctioned}
                    spent={row.spent}
                    remaining={row.remaining}
                    percent={row.percent}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
