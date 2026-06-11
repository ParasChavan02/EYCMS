import { Clock3, FileCheck2, FolderOpen, Pin } from "lucide-react";
import { useAuth } from "../../common/hooks/useAuth";
import "./user-erp.css";

function Dashboard() {
  const { user } = useAuth();

  const stats = [
    { icon: Pin, label: "Assigned Events", value: "6", note: "+2 this week", progress: 50 },
    { icon: FileCheck2, label: "Submitted Reports", value: "12", note: "+1 today", progress: 96 },
    { icon: FolderOpen, label: "Uploaded Documents", value: "28", note: "+4 this week", progress: 100 },
    { icon: Clock3, label: "Pending Reviews", value: "3", note: "2 awaiting approval", progress: 24 },
  ];

  const events = [
    { title: "Leadership Workshop", venue: "Conference Hall", date: "Jun 4, 2026" },
    { title: "Finance Review", venue: "Board Room", date: "Jun 10, 2026" },
    { title: "Team Collaboration Day", venue: "Training Center", date: "Jun 18, 2026" },
  ];

  const notifications = [
    { title: "Report approved", body: "Your Q2 Event Report was approved.", date: "Today" },
    { title: "New event assigned", body: "You were assigned to Leadership Workshop.", date: "May 30" },
    { title: "Event update", body: "Finance Review time changed to 3:00 PM.", date: "May 29" },
    { title: "Document review", body: "Travel bills submitted for review.", date: "May 28" },
  ];

  const uploads = [
    { type: "Project Report", name: "Q2_Impact_Report.pdf", date: "May 29", status: "Submitted" },
    { type: "Event Images", name: "EcoDrive_Photos.zip", date: "May 28", status: "Uploaded" },
    { type: "Supporting Document", name: "Attendance_Sheet.pdf", date: "May 27", status: "Uploaded" },
    { type: "Expense Bill", name: "Travel_Bills.pdf", date: "May 26", status: "Pending" },
  ];

  const submissions = [
    { document: "Q2 Event Report", type: "Report", status: "Approved", tone: "approved" },
    { document: "Audit Documents", type: "Supporting Document", status: "Under Review", tone: "review" },
    { document: "Travel Expense Bill", type: "Bill", status: "Pending", tone: "pending" },
    { document: "Image Gallery Upload", type: "Event Images", status: "Rejected", tone: "rejected" },
  ];

  return (
    <main className="user-erp-page">
      <div className="user-erp-shell">
        <section className="user-erp-card user-erp-hero">
          <div className="user-erp-hero-main">
            <div className="user-erp-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
            <div>
              <p className="user-erp-kicker">Welcome back, {user?.name || "User"}</p>
              <h1>My ERP Dashboard</h1>
              <p className="user-erp-hero-copy">
                Review your active assignments, upload status, and upcoming events in one place.
              </p>
            </div>
          </div>
          <div className="user-erp-badges">
            <span className="user-erp-badge">USER</span>
            <span className="user-erp-badge">Thursday, Jun 11</span>
          </div>
        </section>

        <section className="user-stat-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article className="user-erp-card user-stat-card" key={stat.label}>
                <div className="user-stat-icon">
                  <Icon size={28} />
                </div>
                <div>
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                  <span className="user-stat-note">{stat.note}</span>
                  <div className="user-progress">
                    <span style={{ width: `${stat.progress}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="user-erp-card">
          <h2>Quick Actions</h2>
          <div className="user-action-row">
            <button className="user-action-button" type="button">Upload Report</button>
            <button className="user-action-button" type="button">Upload Bills</button>
            <button className="user-action-button" type="button">Upload Event Images</button>
            <button className="user-action-button" type="button">View Events</button>
          </div>
        </section>

        <section className="user-dashboard-grid">
          <article className="user-erp-card">
            <h2>Upcoming Events</h2>
            <div className="user-list">
              {events.map((event) => (
                <div className="user-list-row" key={event.title}>
                  <div className="user-list-main">
                    <div className="user-list-icon"><Pin size={24} /></div>
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.venue}</p>
                    </div>
                  </div>
                  <span>{event.date}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="user-erp-card">
            <h2>Notifications</h2>
            <div className="user-list">
              {notifications.map((item) => (
                <div className="user-list-row" key={item.title}>
                  <div className="user-list-main">
                    <span className="user-dot" />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </div>
                  <span>{item.date}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="user-dashboard-grid">
          <article className="user-erp-card">
            <h2>Recent Uploads</h2>
            <div className="user-list">
              {uploads.map((upload) => (
                <div className="user-list-row" key={upload.name}>
                  <div>
                    <p>{upload.type}</p>
                    <strong>{upload.name}</strong>
                  </div>
                  <div>
                    <p>{upload.date}</p>
                    <strong>{upload.status}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="user-erp-card user-table-card">
            <h2>Submission Status</h2>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.document}>
                    <td>{submission.document}</td>
                    <td>{submission.type}</td>
                    <td><span className={`user-status ${submission.tone}`}>{submission.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>

        <section className="user-erp-card">
          <h2>Recent Activities</h2>
          <div className="user-list">
            {[
              ["Today, 11:20 AM", "Uploaded Q2_Impact_Report.pdf"],
              ["Yesterday, 04:15 PM", "Submitted Travel_Bills.pdf for review"],
              ["May 28, 09:30 AM", "Uploaded EcoDrive_Photos.zip"],
              ["May 26, 02:00 PM", "Attended Finance Review event"],
            ].map(([time, text]) => (
              <div className="user-list-row" key={text}>
                <span className="user-dot" />
                <div>
                  <p>{time}</p>
                  <strong>{text}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
